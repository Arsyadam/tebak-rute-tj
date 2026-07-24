import { useEffect, useState } from 'react'
import { Map } from '@/components/ui/map'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import type { Difficulty, GameData, GameMode, PlayStyle, UserProfile } from '@/types'
import { JAKARTA_CENTER, MODE_META } from '@/lib/game'
import { loadLeaderboard, loadUser, signInGuest, signOut } from '@/lib/auth'
import { sound } from '@/lib/sound'
import { GameRoom } from '@/lib/multiplayer'
import { cn } from '@/lib/utils'
import { Trophy, Users, User } from 'lucide-react'

export type StartPayload = {
  mode: GameMode
  difficulty: Difficulty | 'all'
  count: number
  playStyle: PlayStyle
  room: GameRoom | null
  seed: number
}

interface Props {
  data: GameData
  onStart: (payload: StartPayload) => void
}

export function Landing({ data, onStart }: Props) {
  const [user, setUser] = useState<UserProfile | null>(() => loadUser())
  const [name, setName] = useState(user?.name ?? '')
  const [mode, setMode] = useState<GameMode>('name-stops')
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('easy')
  const [playStyle, setPlayStyle] = useState<PlayStyle>('solo')
  const [roomCode, setRoomCode] = useState('')
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [players, setPlayers] = useState(
    user ? [{ id: user.id, name: user.name, color: user.color, score: 0 }] : [],
  )
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [leaderboard, setLeaderboard] = useState(() => loadLeaderboard())

  useEffect(() => {
    setLeaderboard(loadLeaderboard())
  }, [user])

  const canPlay = Boolean(user)

  const login = () => {
    sound.unlock()
    sound.join()
    const u = signInGuest(name)
    setUser(u)
    setName(u.name)
    setPlayers([{ id: u.id, name: u.name, color: u.color, score: 0 }])
  }

  const logout = () => {
    if (room) {
      room.destroy()
      setRoom(null)
    }
    signOut()
    setUser(null)
    setPlayers([])
    sound.click()
  }

  const createRoom = async () => {
    if (!user) return
    setBusy(true)
    setStatus('Membuat room…')
    try {
      sound.unlock()
      const r = await GameRoom.host(user)
      r.onRoster = setPlayers
      r.onStatus = setStatus
      r.onStart = ({ seed, mode: m, difficulty: d }) => {
        onStart({
          mode: m as GameMode,
          difficulty: d as Difficulty | 'all',
          count: 3,
          playStyle: 'friends',
          room: r,
          seed,
        })
      }
      setRoom(r)
      setPlayStyle('friends')
      setStatus(`Kode room: ${r.code}`)
      sound.join()
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Gagal buat room')
      sound.wrong()
    } finally {
      setBusy(false)
    }
  }

  const joinRoom = async () => {
    if (!user || !roomCode.trim()) return
    setBusy(true)
    setStatus('Menghubungkan…')
    try {
      sound.unlock()
      const r = await GameRoom.join(user, roomCode.trim())
      r.onRoster = setPlayers
      r.onStatus = setStatus
      r.onStart = ({ seed, mode: m, difficulty: d }) => {
        onStart({
          mode: m as GameMode,
          difficulty: d as Difficulty | 'all',
          count: 3,
          playStyle: 'friends',
          room: r,
          seed,
        })
      }
      setRoom(r)
      setPlayStyle('friends')
      sound.join()
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Gagal join room')
      sound.wrong()
    } finally {
      setBusy(false)
    }
  }

  const startSolo = () => {
    if (!user) return
    sound.unlock()
    sound.click()
    onStart({
      mode,
      difficulty,
      count: mode === 'name-stops' ? 2 : 5,
      playStyle: 'solo',
      room: null,
      seed: Date.now(),
    })
  }

  const startFriends = () => {
    if (!room || !user) return
    if (!room.isHost) {
      setStatus('Tunggu host memulai game.')
      return
    }
    sound.click()
    room.startGame(Date.now(), mode, difficulty)
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#e9ecef] text-[#1c1f26]">
      <div className="absolute inset-0">
        <Map theme="light" center={JAKARTA_CENTER} zoom={11.2} className="h-full w-full opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#e9ecef]/90 via-[#e9ecef]/55 to-[#e9ecef]" />
      </div>

      <div className="relative z-10 mx-auto grid h-full w-full max-w-6xl gap-4 overflow-auto px-4 py-6 sm:px-6 lg:grid-cols-[1.4fr_0.9fr]">
        <section className="flex flex-col">
          <p className="font-display text-4xl font-extrabold tracking-tight text-[var(--tj)] sm:text-5xl">
            Tebak Jalur TJ
          </p>
          <h1 className="mt-2 max-w-xl font-display text-2xl leading-tight font-bold sm:text-3xl">
            Drop in. Guess the line. Race your friends.
          </h1>
          <p className="mt-3 max-w-lg text-sm text-[#667085] sm:text-base">
            Data GTFS resmi Transjakarta. Warna jalur sesuai koridor aslinya.
          </p>
          <p className="mt-2 text-xs text-[#98a2b3]">
            {data.meta.routeCount} rute · {data.meta.stopCount} halte
          </p>

          {!user ? (
            <Card className="mt-6 border-black/8 bg-white/90 shadow-lg backdrop-blur">
              <CardHeader>
                <CardTitle className="font-display">Masuk dulu</CardTitle>
                <CardDescription>
                  Nama panggilan buat solo / bareng temen & leaderboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama kamu"
                  onKeyDown={(e) => e.key === 'Enter' && login()}
                />
                <Button className="bg-[var(--tj)] hover:bg-[#094a86]" onClick={login}>
                  Lanjut
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-black/8 bg-white/90 px-4 py-3 shadow backdrop-blur">
              <Avatar>
                <AvatarFallback style={{ background: user.color }} className="text-white">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{user.name}</p>
                <p className="text-xs text-[#667085]">Guest · tersimpan di device ini</p>
              </div>
              <Button variant="ghost" onClick={logout}>
                Ganti
              </Button>
            </div>
          )}

          <Tabs
            value={playStyle}
            onValueChange={(v) => setPlayStyle(v as PlayStyle)}
            className="mt-5"
          >
            <TabsList>
              <TabsTrigger value="solo" className="gap-1.5">
                <User className="size-3.5" /> Solo
              </TabsTrigger>
              <TabsTrigger value="friends" className="gap-1.5">
                <Users className="size-3.5" /> Bareng temen
              </TabsTrigger>
            </TabsList>

            <TabsContent value="solo" className="mt-4 space-y-4">
              <ModePicker mode={mode} setMode={setMode} disabled={!canPlay} />
              <DifficultyPicker difficulty={difficulty} setDifficulty={setDifficulty} />
              <Button
                size="lg"
                disabled={!canPlay}
                className="h-12 w-full bg-[var(--tj)] text-base font-bold hover:bg-[#094a86]"
                onClick={startSolo}
              >
                Start solo
              </Button>
            </TabsContent>

            <TabsContent value="friends" className="mt-4 space-y-4">
              <ModePicker mode={mode} setMode={setMode} disabled={!canPlay} />
              <DifficultyPicker difficulty={difficulty} setDifficulty={setDifficulty} />
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  disabled={!canPlay || busy}
                  className="bg-[var(--tj)] hover:bg-[#094a86]"
                  onClick={createRoom}
                >
                  Buat room
                </Button>
                <div className="flex gap-2">
                  <Input
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Kode room"
                    className="tracking-widest"
                    maxLength={6}
                  />
                  <Button disabled={!canPlay || busy} variant="secondary" onClick={joinRoom}>
                    Join
                  </Button>
                </div>
              </div>
              {status ? <p className="text-sm text-[#667085]">{status}</p> : null}
              {players.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {players.map((p) => (
                    <Badge key={p.id} variant="secondary" className="gap-1.5">
                      <span className="size-2 rounded-full" style={{ background: p.color }} />
                      {p.name}
                    </Badge>
                  ))}
                </div>
              ) : null}
              <Button
                size="lg"
                disabled={!canPlay || !room || !room.isHost}
                className="h-12 w-full bg-[var(--tj)] text-base font-bold hover:bg-[#094a86]"
                onClick={startFriends}
              >
                {room?.isHost ? 'Start race' : 'Menunggu host…'}
              </Button>
            </TabsContent>
          </Tabs>
        </section>

        <aside>
          <Card className="border-black/8 bg-white/90 shadow-lg backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Trophy className="size-4 text-amber-500" /> Leaderboard
              </CardTitle>
              <CardDescription>Skor terbaik di device ini</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-72 pr-3">
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-[#667085]">Belum ada skor. Main dulu!</p>
                ) : (
                  <ul className="space-y-2">
                    {leaderboard.slice(0, 15).map((e, i) => (
                      <li
                        key={e.id}
                        className="flex items-center gap-2 rounded-lg bg-[#f4f5f7] px-2.5 py-2"
                      >
                        <span className="w-5 text-xs text-[#98a2b3]">{i + 1}</span>
                        <span className="size-2.5 rounded-full" style={{ background: e.color }} />
                        <span className="min-w-0 flex-1 truncate text-sm">{e.name}</span>
                        <span className="text-xs text-[#98a2b3]">
                          {MODE_META[e.mode]?.title ?? e.mode}
                        </span>
                        <span className="text-sm font-bold tabular-nums">
                          {e.score.toLocaleString('id-ID')}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function ModePicker({
  mode,
  setMode,
  disabled,
}: {
  mode: GameMode
  setMode: (m: GameMode) => void
  disabled?: boolean
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {(Object.keys(MODE_META) as GameMode[]).map((m) => {
        const meta = MODE_META[m]
        const active = mode === m
        return (
          <button
            key={m}
            type="button"
            disabled={disabled}
            onClick={() => {
              sound.click()
              setMode(m)
            }}
            className={cn(
              'rounded-2xl border bg-white/90 p-4 text-left shadow-sm transition',
              active
                ? 'border-[var(--tj)] ring-1 ring-[var(--tj)]/30'
                : 'border-black/8 hover:border-black/20',
              disabled && 'opacity-50',
            )}
          >
            <p className="font-display text-lg font-bold">{meta.title}</p>
            <p className="mt-1 text-sm text-[#667085]">{meta.blurb}</p>
            <p className="mt-2 text-xs text-[#98a2b3]">{meta.tip}</p>
          </button>
        )
      })}
    </div>
  )
}

function DifficultyPicker({
  difficulty,
  setDifficulty,
}: {
  difficulty: Difficulty | 'all'
  setDifficulty: (d: Difficulty | 'all') => void
}) {
  return (
    <div>
      <Label className="text-[#667085]">Kesulitan</Label>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {(
          [
            ['easy', 'BRT'],
            ['medium', 'Integrasi'],
            ['hard', 'Mikrotrans'],
            ['all', 'Semua'],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={difficulty === value ? 'default' : 'secondary'}
            className={cn(
              'rounded-full',
              difficulty === value && 'bg-[var(--tj)] hover:bg-[#094a86]',
            )}
            onClick={() => setDifficulty(value)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  )
}
