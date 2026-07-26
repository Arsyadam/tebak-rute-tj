import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { authRouter } from './routes/auth.js'
import { gamesRouter } from './routes/games.js'
import { leaderboardRouter } from './routes/leaderboard.js'
import { historyRouter } from './routes/history.js'
import { roomsRouter } from './routes/rooms.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = Number(process.env.PORT || 3001)

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": [
          "'self'",
          "https://pagead2.googlesyndication.com",
          "https://www.googletagservices.com",
          "https://www.google.com",
        ],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
        "img-src": ["'self'", "data:", "blob:", "https:"],
        "connect-src": [
          "'self'",
          "https://0.peerjs.com",
          "wss://0.peerjs.com",
          "https://*.peerjs.com",
          "wss://*.peerjs.com",
          "https://basemaps.cartocdn.com",
          "https://*.basemaps.cartocdn.com",
          "https://*.tile.openstreetmap.org",
          "https:",
          "wss:",
        ],
        "worker-src": ["'self'", "blob:"],
        "child-src": ["'self'", "blob:"],
        "frame-src": [
          "'self'",
          "https://googleads.g.doubleclick.net",
          "https://tpc.googlesyndication.com",
          "https://www.google.com",
        ],
        // Behind Cloudflare Flexible SSL; avoid forcing HTTPS upgrades that can loop.
        "upgrade-insecure-requests": null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
)
app.use(cors({ origin: allowedOrigin, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRouter)
app.use('/api/games', gamesRouter)
app.use('/api/leaderboard', leaderboardRouter)
app.use('/api/history', historyRouter)
app.use('/api/rooms', roomsRouter)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../../dist')
  app.use(express.static(distPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`TransitGuessr API listening on http://0.0.0.0:${PORT}`)
})
