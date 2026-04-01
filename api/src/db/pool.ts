import { Pool, QueryResult } from 'pg'

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (!value) return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

const isProduction = process.env.NODE_ENV === 'production'
const syncIntervalMs = Number(process.env.DB_SYNC_INTERVAL_MS || 15000)

const buildPool = (connectionString: string) => {
  const isSupabase = connectionString.includes('supabase.co') || connectionString.includes('pooler.supabase.com')

  const nextPool = new Pool({
    connectionString,
    ssl:
      isSupabase || isProduction
        ? {
            rejectUnauthorized: parseBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, false),
          }
        : undefined,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })

  nextPool.on('error', (err: Error) => {
    console.error('Unexpected error on idle client', err)
  })

  return nextPool
}

const primaryUrl = (process.env.DATABASE_URL || '').trim()
const localUrl = (process.env.LOCAL_DATABASE_URL || process.env.DATABASE_FALLBACK_URL || '').trim()

if (!primaryUrl && !localUrl) {
  throw new Error('No database URL configured. Set DATABASE_URL and/or LOCAL_DATABASE_URL.')
}

const primaryPool = primaryUrl ? buildPool(primaryUrl) : null
const localPool = localUrl ? buildPool(localUrl) : null

let primaryHealthy = Boolean(primaryPool)
let syncTimer: NodeJS.Timeout | null = null

const shouldTryFallback = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false
  const code = (err as { code?: string }).code
  return ['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ETIMEDOUT', 'ENETUNREACH'].includes(String(code))
}

const markPrimaryUnhealthy = (err: unknown) => {
  if (!shouldTryFallback(err)) return
  if (!primaryHealthy) return
  primaryHealthy = false

  if (primaryUrl && localUrl) {
    console.warn('[DB] Primary Supabase unavailable. Using local Postgres and queueing writes for sync.')
  }
}

const isMutatingQuery = (sql: string): boolean => {
  const normalized = sql.trim().toUpperCase()
  if (!normalized) return false
  if (normalized.startsWith('SELECT') || normalized.startsWith('SHOW') || normalized.startsWith('EXPLAIN')) {
    return false
  }

  return /(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|GRANT|REVOKE)\b/.test(normalized)
}

const ensureOutboxTable = async (): Promise<void> => {
  if (!localPool) return

  await localPool.query(`
    CREATE TABLE IF NOT EXISTS db_sync_outbox (
      id BIGSERIAL PRIMARY KEY,
      sql_text TEXT NOT NULL,
      params_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMP DEFAULT NOW(),
      last_error TEXT,
      retry_count INTEGER NOT NULL DEFAULT 0,
      synced_at TIMESTAMP
    )
  `)
}

const enqueueLocalWriteForSync = async (sqlText: string, params: unknown[]): Promise<void> => {
  if (!localPool) return

  await ensureOutboxTable()
  await localPool.query(
    `INSERT INTO db_sync_outbox (sql_text, params_json) VALUES ($1, $2::jsonb)`,
    [sqlText, JSON.stringify(params)]
  )
}

const tryPrimaryQuery = async (sqlText: string, params: unknown[]): Promise<QueryResult | null> => {
  if (!primaryPool) return null

  try {
    const result = await primaryPool.query(sqlText, params)
    if (!primaryHealthy) {
      primaryHealthy = true
      console.log('[DB] Primary Supabase connection restored. Resuming outbox sync.')
    }
    return result
  } catch (err) {
    markPrimaryUnhealthy(err)
    return null
  }
}

const flushOutboxToPrimary = async (): Promise<void> => {
  if (!localPool || !primaryPool || !primaryHealthy) return

  await ensureOutboxTable()
  const rows = await localPool.query(
    `SELECT id, sql_text, params_json
     FROM db_sync_outbox
     WHERE synced_at IS NULL
     ORDER BY id ASC
     LIMIT 100`
  )

  for (const row of rows.rows as Array<{ id: number; sql_text: string; params_json: unknown[] }>) {
    try {
      await primaryPool.query(row.sql_text, row.params_json || [])
      await localPool.query(
        `UPDATE db_sync_outbox SET synced_at = NOW(), last_error = NULL WHERE id = $1`,
        [row.id]
      )
    } catch (err) {
      markPrimaryUnhealthy(err)
      await localPool.query(
        `UPDATE db_sync_outbox
         SET retry_count = retry_count + 1,
             last_error = $2
         WHERE id = $1`,
        [row.id, err instanceof Error ? err.message : 'Unknown sync error']
      )
      break
    }
  }
}

const query = async (...args: Parameters<Pool['query']>) => {
  const sqlText = String(args[0])
  const params = Array.isArray(args[1]) ? args[1] : []
  const mutating = isMutatingQuery(sqlText)

  if (primaryHealthy || !localPool) {
    const primaryResult = await tryPrimaryQuery(sqlText, params)
    if (primaryResult) {
      if (mutating && localPool) {
        // Keep local warm when possible. Sync reliability still uses outbox when primary is down.
        try {
          await localPool.query(sqlText, params)
        } catch {
          // Ignore best-effort local mirror errors.
        }
      }
      return primaryResult
    }
  }

  if (!localPool) {
    throw new Error('Primary database unavailable and no local fallback configured.')
  }

  const localResult = await localPool.query(sqlText, params)
  if (mutating) {
    await enqueueLocalWriteForSync(sqlText, params)
  }

  return localResult
}

const startSyncWorker = () => {
  if (!primaryPool || !localPool || syncTimer) return

  syncTimer = setInterval(async () => {
    try {
      if (!primaryHealthy) {
        const probe = await tryPrimaryQuery('SELECT NOW()', [])
        if (!probe) return
      }

      await flushOutboxToPrimary()
    } catch {
      // Keep worker alive.
    }
  }, syncIntervalMs)

  syncTimer.unref()
}

startSyncWorker()

const end = async () => {
  if (syncTimer) {
    clearInterval(syncTimer)
    syncTimer = null
  }

  await Promise.all([
    primaryPool?.end(),
    localPool && localPool !== primaryPool ? localPool.end() : undefined,
  ])
}

const on = (...args: Parameters<Pool['on']>) => {
  if (primaryPool) primaryPool.on(...args)
  if (localPool && localPool !== primaryPool) localPool.on(...args)
}

const getDbRoutingStatus = () => ({
  primaryConfigured: Boolean(primaryPool),
  localConfigured: Boolean(localPool),
  primaryHealthy,
  syncIntervalMs,
})

const getOutboxStats = async () => {
  if (!localPool) {
    return {
      pending: 0,
      failed: 0,
      total: 0,
    }
  }

  await ensureOutboxTable()
  const result = await localPool.query(
    `SELECT
      COUNT(*) FILTER (WHERE synced_at IS NULL) AS pending,
      COUNT(*) FILTER (WHERE synced_at IS NULL AND retry_count > 0) AS failed,
      COUNT(*) AS total
     FROM db_sync_outbox`
  )

  const row = result.rows[0] || { pending: '0', failed: '0', total: '0' }
  return {
    pending: Number(row.pending || 0),
    failed: Number(row.failed || 0),
    total: Number(row.total || 0),
  }
}

const forceSyncNow = async (): Promise<void> => {
  if (!primaryPool || !localPool) return
  const probe = await tryPrimaryQuery('SELECT NOW()', [])
  if (!probe) return
  await flushOutboxToPrimary()
}

const pool = {
  query,
  end,
  on,
  getDbRoutingStatus,
  getOutboxStats,
  forceSyncNow,
}

export default pool
