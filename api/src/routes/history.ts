import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

export const historyRouter = Router()

historyRouter.get('/', requireAuth, async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1))
  const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)))

  const [sessions, count] = await Promise.all([
    prisma.gameSession.findMany({
      where: { userId: req.userId! },
      orderBy: { finishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        rounds: { orderBy: { roundIndex: 'asc' } },
      },
    }),
    prisma.gameSession.count({ where: { userId: req.userId! } }),
  ])

  res.json({ sessions, count, page, limit })
})
