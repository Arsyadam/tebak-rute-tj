import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

export const gamesRouter = Router()

gamesRouter.post('/', requireAuth, async (req, res) => {
  const { mode, difficulty, score, playStyle, hintCount, rounds } = req.body as {
    mode?: string
    difficulty?: string
    score?: number
    playStyle?: string
    hintCount?: number
    rounds?: Array<{
      roundIndex?: number
      correctAnswer?: string
      score?: number
      hintUsed?: boolean
    }>
  }

  if (!mode || difficulty == null || score == null || !playStyle || !Array.isArray(rounds)) {
    res.status(400).json({ error: 'Missing required fields' })
    return
  }

  const session = await prisma.gameSession.create({
    data: {
      userId: req.userId!,
      mode,
      difficulty,
      score,
      playStyle,
      hintCount: hintCount || 0,
      finishedAt: new Date(),
      rounds: {
        createMany: {
          data: rounds.map((r) => ({
            roundIndex: r.roundIndex ?? 0,
            correctAnswer: r.correctAnswer ?? '',
            score: r.score ?? 0,
            hintUsed: r.hintUsed ?? false,
          })),
        },
      },
    },
    include: {
      user: { select: { name: true, color: true } },
      rounds: { orderBy: { roundIndex: 'asc' } },
    },
  })

  res.json(session)
})
