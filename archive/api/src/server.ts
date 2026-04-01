import 'dotenv/config'
import app from './app'
import pool from './db/pool'

const PORT = process.env.PORT || 5000

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms))

const startServer = async () => {
  const maxAttempts = 5
  let attempt = 0
  let lastErr: any = null

  const routing = pool.getDbRoutingStatus?.() || { configured: false }
  console.log('[DB] Routing status:', routing)

  while (attempt < maxAttempts) {
    attempt += 1
    try {
      console.log(`[DB] Attempt ${attempt} of ${maxAttempts} - testing connection...`)
      const res = await pool.query('SELECT NOW()')
      console.log('[Database Connected]', res.rows[0])
      // Connected successfully, start server
      return app.listen(PORT, () => {
        console.log(`[Server] Lockbox API running on http://localhost:${PORT}`)
        console.log(`[Environment] ${process.env.NODE_ENV || 'development'}`)
      })
    } catch (err) {
      lastErr = err
      console.error(`[DB] Connection attempt ${attempt} failed:`, err?.message || err)
      // On final attempt, break and exit below
      if (attempt >= maxAttempts) break
      const delay = Math.min(5000 * attempt, 30000) // exponential backoff up to 30s
      console.log(`[DB] Waiting ${delay}ms before retrying...`)
      // eslint-disable-next-line no-await-in-loop
      await wait(delay)
    }
  }

  console.error('[Database Connection Error] All attempts failed. Last error:', lastErr)
  process.exit(1)
}

let server: ReturnType<typeof app.listen>

startServer().then((startedServer) => {
  server = startedServer
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Shutdown] SIGTERM received, closing gracefully')
  if (!server) {
    process.exit(0)
    return
  }

  server.close(() => {
    console.log('[Shutdown] Server closed')
    pool.end().finally(() => {
      console.log('[Shutdown] Database connections closed')
      process.exit(0)
    })
  })
})

process.on('SIGINT', () => {
  console.log('[Shutdown] SIGINT received, closing gracefully')
  if (!server) {
    process.exit(0)
    return
  }

  server.close(() => {
    console.log('[Shutdown] Server closed')
    pool.end().finally(() => {
      console.log('[Shutdown] Database connections closed')
      process.exit(0)
    })
  })
})

export default server

