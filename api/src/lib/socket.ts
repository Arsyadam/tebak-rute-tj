import { Server } from 'socket.io'
import type { Server as HttpServer } from 'node:http'
import { verifyToken } from './auth.js'
import { prisma } from './prisma.js'

type SocketPlayer = {
  socketId: string
  userId: string
  name: string
  color: string
  score: number
  isHost: boolean
}

type RoomState = {
  code: string
  hostId: string
  mode: string
  difficulty: string
  players: Map<string, SocketPlayer>
  sockets: Map<string, string>
  started: boolean
  seed?: number
}

const rooms = new Map<string, RoomState>()

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || true,
      credentials: true,
    },
    path: '/socket.io',
  })

  io.use(async (socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ||
        socket.handshake.headers.cookie?.match(/token=([^;]+)/)?.[1]
      if (!token) return next(new Error('Missing token'))
      const payload = verifyToken(token)
      if (!payload) return next(new Error('Invalid token'))
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, name: true, color: true },
      })
      if (!user) return next(new Error('User not found'))
      socket.data.user = user
      next()
    } catch (e) {
      next(e as Error)
    }
  })

  io.on('connection', (socket) => {
    const user = socket.data.user as { id: string; name: string; color: string }

    socket.on('host', async ({ code, mode, difficulty }: { code: string; mode: string; difficulty: string }) => {
      const room = await prisma.room.findUnique({ where: { code: code.toUpperCase() } })
      if (!room || room.hostId !== user.id) {
        socket.emit('status', { error: 'Room not found or not host' })
        return
      }
      const state = getOrCreateRoom(code.toUpperCase(), room.hostId, mode, difficulty)
      joinRoom(state, socket, user, true)
      socket.emit('status', { message: `Room ${state.code} siap. Bagikan link ke teman.` })
      broadcastRoster(state, io)
    })

    socket.on('join', async ({ code }: { code: string }) => {
      const room = await prisma.room.findUnique({
        where: { code: code.toUpperCase() },
        include: { host: { select: { id: true, name: true } } },
      })
      if (!room) {
        socket.emit('status', { error: 'Room tidak ditemukan' })
        return
      }
      if (room.hostId === user.id) {
        socket.emit('status', { error: 'Host harus pakai event host' })
        return
      }
      const state = getOrCreateRoom(code.toUpperCase(), room.hostId, room.mode, room.difficulty)
      if (state.started) {
        socket.emit('status', { error: 'Race sudah dimulai' })
        return
      }
      joinRoom(state, socket, user, false)
      socket.emit('status', { message: 'Sudah gabung · menunggu host' })
      broadcastRoster(state, io)
    })

    socket.on('start', ({ seed, mode, difficulty }: { seed: number; mode: string; difficulty: string }) => {
      const state = findRoomBySocket(socket.id)
      if (!state) return
      const player = state.players.get(socket.id)
      if (!player?.isHost) return
      state.started = true
      state.seed = seed
      io.to(state.code).emit('start', { seed, mode, difficulty })
    })

    socket.on('guess-stop', ({ stopId, points }: { stopId: string; points: number }) => {
      const state = findRoomBySocket(socket.id)
      if (!state) return
      const player = state.players.get(socket.id)
      if (!player) return
      io.to(state.code).emit('guess-stop', {
        playerId: player.userId,
        stopId,
        points,
        name: player.name,
      })
    })

    socket.on('score-sync', ({ players }: { players: { id: string; score: number }[] }) => {
      const state = findRoomBySocket(socket.id)
      if (!state) return
      for (const p of players) {
        const player = [...state.players.values()].find((x) => x.userId === p.id)
        if (player) player.score = p.score
      }
      broadcastRoster(state, io)
    })

    socket.on('disconnect', () => {
      const state = findRoomBySocket(socket.id)
      if (!state) return
      state.players.delete(socket.id)
      state.sockets.delete(socket.id)
      if (state.players.size === 0) {
        rooms.delete(state.code)
        return
      }
      broadcastRoster(state, io)
    })
  })

  return io
}

function getOrCreateRoom(code: string, hostId: string, mode: string, difficulty: string): RoomState {
  let state = rooms.get(code)
  if (!state) {
    state = {
      code,
      hostId,
      mode,
      difficulty,
      players: new Map(),
      sockets: new Map(),
      started: false,
    }
    rooms.set(code, state)
  }
  return state
}

function joinRoom(state: RoomState, socket: any, user: { id: string; name: string; color: string }, isHost: boolean) {
  void socket.join(state.code)
  state.players.set(socket.id, {
    socketId: socket.id,
    userId: user.id,
    name: user.name,
    color: user.color,
    score: 0,
    isHost,
  })
  state.sockets.set(socket.id, state.code)
}

function broadcastRoster(state: RoomState, io: Server) {
  const players = [...state.players.values()].map((p) => ({
    id: p.userId,
    name: p.name,
    color: p.color,
    score: p.score,
  }))
  io.to(state.code).emit('roster', { players })
}

function findRoomBySocket(socketId: string): RoomState | null {
  for (const state of rooms.values()) {
    if (state.players.has(socketId)) return state
  }
  return null
}
