import Peer, { type DataConnection } from 'peerjs'
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

function roomPeerId(code: string) {
  return `transitguestr-${code.toLowerCase()}`
}

export function makeRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 5; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
  return s
}

export class GameRoom {
  code: string
  peer: Peer
  isHost: boolean
  players = new Map<string, RoomPlayer>()
  connections = new Map<string, DataConnection>()
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

  private constructor(code: string, peer: Peer, isHost: boolean, self: RoomPlayer) {
    this.code = code
    this.peer = peer
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
    const code = res.code
    const peer = await openPeer(roomPeerId(code))
    const self: RoomPlayer = {
      id: user.id,
      name: user.name,
      color: user.color,
      score: 0,
    }
    const room = new GameRoom(code, peer, true, self)
    peer.on('connection', (conn) => {
      room.wireConn(conn)
    })
    room.onStatus(`Room ${code} siap. Bagikan link ke teman.`)
    return room
  }

  static async join(user: UserProfile, code: string): Promise<GameRoom> {
    await api(`/rooms/${code.toUpperCase()}`)
    const peer = await openPeer()
    const self: RoomPlayer = {
      id: user.id,
      name: user.name,
      color: user.color,
      score: 0,
    }
    const room = new GameRoom(code.toUpperCase(), peer, false, self)
    const conn = peer.connect(roomPeerId(code.toUpperCase()), { reliable: true })
    await waitOpen(conn)
    room.wireConn(conn)
    conn.send({ type: 'hello', player: self } satisfies RoomMessage)
    room.onStatus(`Gabung room ${code.toUpperCase()}…`)
    return room
  }

  private wireConn(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn)
      if (this.isHost) {
        this.broadcastRoster()
      }
    })
    conn.on('data', (raw) => {
      const msg = raw as RoomMessage
      if (msg.type === 'hello' && this.isHost) {
        this.players.set(msg.player.id, { ...msg.player, score: 0 })
        this.connections.set(conn.peer, conn)
        this.broadcastRoster()
      }
      if (msg.type === 'roster') {
        this.players.clear()
        for (const p of msg.players) this.players.set(p.id, p)
        this.onRoster([...this.players.values()])
      }
      if (msg.type === 'start') this.onStart(msg)
      if (msg.type === 'guess-stop') this.onGuessStop(msg)
      if (msg.type === 'score-sync') {
        this.players.clear()
        for (const p of msg.players) this.players.set(p.id, p)
        this.onRoster([...this.players.values()])
      }
    })
    conn.on('close', () => {
      this.connections.delete(conn.peer)
    })
  }

  broadcastRoster() {
    const players = [...this.players.values()]
    this.onRoster(players)
    this.broadcast({ type: 'roster', players })
  }

  startGame(seed: number, mode: string, difficulty: string) {
    if (!this.isHost) return
    const payload = { type: 'start' as const, seed, mode, difficulty }
    this.broadcast(payload)
    this.onStart(payload)
  }

  sendGuessStop(stopId: string, points: number) {
    const msg: RoomMessage = {
      type: 'guess-stop',
      playerId: this.self.id,
      stopId,
      points,
      name: this.self.name,
    }
    // apply locally
    this.onGuessStop(msg)
    this.broadcast(msg)
  }

  applyScore(playerId: string, points: number) {
    const p = this.players.get(playerId)
    if (!p) return
    p.score += points
    this.players.set(playerId, p)
    if (playerId === this.self.id) this.self = p
    const players = [...this.players.values()]
    this.onRoster(players)
    if (this.isHost) this.broadcast({ type: 'score-sync', players })
  }

  broadcast(msg: RoomMessage) {
    for (const conn of this.connections.values()) {
      if (conn.open) conn.send(msg)
    }
  }

  destroy() {
    for (const c of this.connections.values()) c.close()
    this.peer.destroy()
  }
}

function openPeer(id?: string) {
  return new Promise<Peer>((resolve, reject) => {
    const peer = id ? new Peer(id) : new Peer()
    peer.on('open', () => resolve(peer))
    peer.on('error', (err) => reject(err))
  })
}

function waitOpen(conn: DataConnection) {
  return new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Timeout join room')), 12000)
    conn.on('open', () => {
      clearTimeout(t)
      resolve()
    })
    conn.on('error', (e) => {
      clearTimeout(t)
      reject(e)
    })
  })
}
