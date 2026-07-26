import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

export const roomsRouter = Router()

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function makeCode() {
  let s = ''
  for (let i = 0; i < 5; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return s
}

async function uniqueCode(attempts = 10): Promise<string> {
  for (let i = 0; i < attempts; i++) {
    const code = makeCode()
    const existing = await prisma.room.findUnique({ where: { code } })
    if (!existing) return code
  }
  throw new Error('Could not generate unique room code')
}

roomsRouter.post('/', requireAuth, async (req, res) => {
  const { mode, difficulty } = req.body as { mode?: string; difficulty?: string }
  if (!mode || difficulty == null) {
    res.status(400).json({ error: 'Missing mode or difficulty' })
    return
  }

  const code = await uniqueCode()
  const room = await prisma.room.create({
    data: {
      code,
      hostId: req.userId!,
      mode,
      difficulty,
    },
  })
  res.json(room)
})

roomsRouter.get('/:code', async (req, res) => {
  const code = typeof req.params.code === 'string' ? req.params.code : req.params.code[0]
  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      host: { select: { name: true } },
    },
  })
  if (!room) {
    res.status(404).json({ error: 'Room not found' })
    return
  }
  res.json(room)
})

roomsRouter.delete('/:code', requireAuth, async (req, res) => {
  const code = (typeof req.params.code === 'string' ? req.params.code : req.params.code[0]).toUpperCase()
  const room = await prisma.room.findUnique({ where: { code } })
  if (!room) {
    res.status(404).json({ error: 'Room not found' })
    return
  }
  if (room.hostId !== req.userId) {
    res.status(403).json({ error: 'Only the host can close this room' })
    return
  }
  await prisma.room.delete({ where: { code } })
  res.json({ ok: true })
})
