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

app.use(helmet())
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
