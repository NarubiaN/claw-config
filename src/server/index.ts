import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'
import configRouter from './routes/config.js'
import discoveryRouter from './routes/discovery.js'
import { bootfilesDiscoveryRouter, bootfilesMutationRouter } from './routes/bootfiles.js'
import { getConfigPath } from './lib/config-io.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.SERVER_PORT ?? process.env.PORT ?? 3001
const isDev = process.env.NODE_ENV !== 'production'

const app = express()

// Middleware
app.use(express.json({ limit: '10mb' }))
if (isDev) {
  app.use(cors({ origin: 'http://localhost:5173' }))
}

// API routes
app.get('/api/info', (_req, res) => {
  res.json({
    ok: true,
    data: {
      homedir: os.homedir(),
      configPath: getConfigPath(),
    },
  })
})

app.use('/api/config', configRouter)
app.use('/api/discovery', discoveryRouter)
app.use('/api/discovery', bootfilesDiscoveryRouter)
app.use('/api/bootfiles', bootfilesMutationRouter)

// Serve static client in production
if (!isDev) {
  const clientDist = path.resolve(__dirname, '../../client')
  app.use(express.static(clientDist))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

const server = app.listen(PORT, () => {
  console.log(`claw-config server running on http://localhost:${PORT}`)
  console.log(`Mode: ${isDev ? 'development' : 'production'}`)
})

// Keep the server running
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
