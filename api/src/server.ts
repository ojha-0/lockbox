import 'dotenv/config'
import app from './app'
import pool from './db/pool'

const PORT = process.env.PORT || 5000

const startServer = async () => {
  try {
    const res = await pool.query('SELECT NOW()')
    console.log('[Database Connected]', res.rows[0])
  } catch (err) {
    console.error('[Database Connection Error]', err)
    process.exit(1)
  }

  return app.listen(PORT, () => {
    console.log(`[Server] Lockbox API running on http://localhost:${PORT}`)
    console.log(`[Environment] ${process.env.NODE_ENV || 'development'}`)
  })
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

