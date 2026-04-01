import express, { Express, Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { APIResponse } from './types'
import { globalLimiter } from './middleware/rateLimiter'
import authRoutes from './routes/auth'
import citizenRoutes from './routes/citizen'
import verificationRoutes from './routes/verifications'
import adminRoutes from './routes/admin'
import pool from './db/pool'

const app: Express = express()

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Global rate limiter
app.use(globalLimiter)

// Health check
app.get('/api/v1/health', (req: Request, res: Response) => {
  const response: APIResponse = {
    success: true,
    data: { status: 'ok', timestamp: new Date().toISOString() },
  }
  res.json(response)
})

app.get('/api/v1/health/db', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const routing = pool.getDbRoutingStatus()
    const outbox = await pool.getOutboxStats()
    const response: APIResponse = {
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        routing,
        outbox,
      },
    }
    res.json(response)
  } catch (error) {
    next(error)
  }
})

app.post('/api/v1/health/db/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await pool.forceSyncNow()
    const outbox = await pool.getOutboxStats()
    const response: APIResponse = {
      success: true,
      data: {
        status: 'sync-triggered',
        timestamp: new Date().toISOString(),
        outbox,
      },
    }
    res.json(response)
  } catch (error) {
    next(error)
  }
})

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/citizen', citizenRoutes)
app.use('/api/v1/verifications', verificationRoutes)
app.use('/api/v1/admin', adminRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'ERR_NOT_FOUND',
  })
})

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', err)

  const response: APIResponse = {
    success: false,
    error: err.message || 'Internal server error',
    code: err.code || 'ERR_INTERNAL',
  }

  res.status(err.status || 500).json(response)
})

export default app
