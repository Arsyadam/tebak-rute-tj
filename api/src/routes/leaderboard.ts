import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

export const leaderboardRouter = Router()

leaderboardRouter.get('/', async (req, res) => {
  const mode = typeof req.query.mode === 'string' ? req.query.mode : undefined

  const sessions = await prisma.gameSession.findMany({
    where: mode ? { mode } : undefined,
    orderBy: { score: 'desc' },
    take: 50,
    include: {
      user: {
        select: { name: true, color: true },
      },
    },
  })

  res.json(
    sessions.map((s) => ({
      id: s.id,
      name: s.user.name,
      color: s.user.color,
      score: s.score,
      mode: s.mode,
      playStyle: s.playStyle,
      at: s.finishedAt || s.startedAt,
    })),
  )
})
