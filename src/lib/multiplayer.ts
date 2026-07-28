import { io, Socket } from 'socket.io-client'
import type { UserProfile } from '@/types'
import { api } from '@/api/client'

export type RoomPlayer = {
  id: string
  name: string
  color: string
  score: number
}

export type RoomMessage =
  | { type: 'hello'; player: RoomPlayer }
  | { type: 'roster'; players: RoomPlayer[] }
  | { type: 'start'; seed: number; mode: string; difficulty: string }
  | { type: 'guess-stop'; playerId: string; stopId: string; points: number; name: string }
  | { type: 'score-sync'; players: RoomPlayer[] }
  | { type: 'chat'; name: string; text: string }

export function makeRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 5; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
  return s
}

export class GameRoom {
  code: string
  socket: Socket
  isHost: boolean
  players = new Map<string, RoomPlayer>()
  self: RoomPlayer
  onRoster: (players: RoomPlayer[]) => void = () => {}
  onStart: (payload: { seed: number; mode: string; difficulty: string }) => void = () => {}
  onGuessStop: (payload: {
    playerId: string
    stopId: string
    points: number
    name: string
  }) => void = () => {}
  onStatus: (msg: string) => void = () => {}

  private constructor(code: string, socket: Socket, isHost: boolean, self: RoomPlayer) {
    this.code = code
    this.socket = socket
    this.isHost = isHost
    this.self = self
    this.players.set(self.id, self)
  }

  static async host(
    user: UserProfile,
    mode: string,
    difficulty: string,
  ): Promise<GameRoom> {
    const res = (await api('/rooms', {
      method: 'POST',
      body: JSON.stringify({ mode, difficulty }),
    })) as { code: string }
    const code = res.code.toUpperCase()
    const socket = connectSocket()
    const self: RoomPlayer = { id: user.id, name: user.name, color: user.color, score: 0 }
    const room = new GameRoom(code, socket, true, self)
    wireSocket(room, socket)
    await waitConnect(socket)
    socket.emit('host', { code, mode, difficulty })
    return room
  }

  static async join(user: UserProfile, code: string): Promise<GameRoom> {
    await api(`/rooms/${code.toUpperCase()}`)
    const socket = connectSocket()
    const self: RoomPlayer = { id: user.id, name: user.name, color: user.color, score: 0 }
    const room = new GameRoom(code.toUpperCase(), socket, false, self)
    wireSocket(room, socket)
    await waitConnect(socket)
    socket.emit('join', { code: code.toUpperCase() })
    return room
  }

  startGame(seed: number, mode: string, difficulty: string) {
    if (!this.isHost) return
    this.socket.emit('start', { seed, mode, difficulty })
  }

  sendGuessStop(stopId: string, points: number) {
    this.socket.emit('guess-stop', { stopId, points })
    this.onGuessStop({
      playerId: this.self.id,
      stopId,
      points,
      name: this.self.name,
    })
  }

  applyScore(playerId: string, points: number) {
    const p = this.players.get(playerId)
    if (!p) return
    p.score += points
    this.players.set(playerId, p)
    if (playerId === this.self.id) this.self = p
    this.onRoster([...this.players.values()])
  }

  destroy() {
    this.socket.emit('leave')
    this.socket.disconnect()
  }

  syncScores() {
    const players = [...this.players.values()].map((p) => ({ id: p.id, score: p.score }))
    this.socket.emit('score-sync', { players })
  }
}

function connectSocket(): Socket {
  const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : window.location.origin
  return io(baseUrl, {
    path: '/socket.io',
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
  })
}

function waitConnect(socket: Socket): Promise<void> {
  return new Promise((resolve, reject) => {
    if (socket.connected) {
      resolve()
      return
    }
    const t = setTimeout(() => reject(new Error('Timeout connect socket')), 10000)
    socket.once('connect', () => {
      clearTimeout(t)
      resolve()
    })
    socket.once('connect_error', (e) => {
      clearTimeout(t)
      reject(e)
    })
  })
}

function wireSocket(room: GameRoom, socket: Socket) {
  socket.on('status', ({ message, error }: { message?: string; error?: string }) => {
    room.onStatus(error ? `Gagal: ${error}` : message || '')
  })

  socket.on('roster', ({ players }: { players: RoomPlayer[] }) => {
    room.players.clear()
    for (const p of players) room.players.set(p.id, p)
    room.onRoster(players)
  })

  socket.on('start', (payload: { seed: number; mode: string; difficulty: string }) => {
    room.onStart(payload)
  })

  socket.on('guess-stop', (payload: { playerId: string; stopId: string; points: number; name: string }) => {
    room.onGuessStop(payload)
  })
}
