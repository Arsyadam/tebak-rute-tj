import { useEffect, useRef, useState } from 'react'
import { Map } from '@/components/ui/map'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import StatusIndicator from '@/components/8starlabs-ui/status-indicator'
import { TransportBadge } from '@/components/8starlabs-ui/transport-badge'
import { RouteBadge } from '@/components/RouteBadge'
import { AdSlot } from '@/components/AdSlot'
import type { Difficulty, GameData, GameMode, LeaderboardEntry, PlayStyle } from '@/types'
import { JAKARTA_CENTER, MODE_META } from '@/lib/game'
import { loadLeaderboard } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'
import { sound } from '@/lib/sound'
import { GameRoom } from '@/lib/multiplayer'
import type { RoomPlayer } from '@/lib/multiplayer'
import { cn } from '@/lib/utils'
import { Trophy, Users, User, Mail, LogIn } from 'lucide-react'

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
  const { user, loading: authLoading, loginGuest, loginEmail, registerEmail, logout } = useAuth()
  const [authMode, setAuthMode] = useState<'guest' | 'login' | 'register'>('guest')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState('')

  const [mode, setMode] = useState<GameMode>('name-stops')
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('easy')
  const [playStyle, setPlayStyle] = useState<PlayStyle>('solo')
  const [roomCode, setRoomCode] = useState('')
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const autoJoinRef = useRef(false)
  const joinInFlightRef = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('room')
    if (code) {
      setRoomCode(code.toUpperCase())
      setPlayStyle('friends')
    }
  }, [])

  useEffect(() => {
    loadLeaderboard()
      .then((list) => setLeaderboard(list || []))
      .catch(() => setLeaderboard([]))
  }, [user])

  useEffect(() => {
    if (!user) {
      setPlayers([])
      autoJoinRef.current = false
      return
    }
    setPlayers([{ id: user.id, name: user.name, color: user.color, score: 0 }])
  }, [user])

  const canPlay = Boolean(user)

  const submitGuest = async () => {
    setAuthBusy(true)
    setAuthError('')
    try {
      sound.unlock()
      sound.join()
      await loginGuest(name)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Gagal masuk')
    } finally {
      setAuthBusy(false)
    }
  }

  const submitEmail = async () => {
    if (!email || !password) {
      setAuthError('Email dan password wajib diisi')
      return
    }
    setAuthBusy(true)
    setAuthError('')
    try {
      sound.unlock()
      sound.join()
      if (authMode === 'register') {
        await registerEmail(email, password, name || email.split('@')[0])
      } else {
        await loginEmail(email, password)
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Gagal masuk')
    } finally {
      setAuthBusy(false)
    }
  }

  const doLogout = async () => {
    if (room) {
      room.destroy()
      setRoom(null)
    }
    await logout()
    setPlayers([])
    setRoomCode('')
    sound.click()
  }

  const googleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || '/api'
    window.location.href = `${apiUrl}/auth/google`
  }

  const startSolo = () => {
    if (!canPlay) return
    sound.unlock()
    onStart({
      mode,
      difficulty,
      count: 5,
      playStyle: 'solo',
      room: null,
      seed: Date.now(),
    })
  }

  const startFriends = () => {
    if (!room || !room.isHost) return
    sound.unlock()
    room.startGame(Date.now(), mode, difficulty)
  }

  const createRoom = async () => {
    if (!user) return
    setBusy(true)
    setStatus('Membuat room…')
    try {
      sound.unlock()
      const r = await GameRoom.host(user, mode, difficulty)
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
      setStatus(e instanceof Error ? e.message : 'Gagal membuat room')
    } finally {
      setBusy(false)
    }
  }

  const joinRoom = async (codeOverride?: string) => {
    const code = (codeOverride || roomCode).trim().toUpperCase()
    if (!user || !code || joinInFlightRef.current || room) return
    joinInFlightRef.current = true
    setBusy(true)
    setRoomCode(code)
    setPlayStyle('friends')
    setStatus(`Gabung room ${code}…`)
    try {
      sound.unlock()
      const r = await GameRoom.join(user, code)
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
      setStatus('Sudah gabung · menunggu host')
      sound.join()
    } catch (e) {
      autoJoinRef.current = false
      setStatus(e instanceof Error ? e.message : 'Gagal gabung room')
    } finally {
      joinInFlightRef.current = false
      setBusy(false)
    }
  }

  const leaveRoom = async () => {
    if (!room) return
    room.destroy()
    setRoom(null)
    setPlayers(user ? [{ id: user.id, name: user.name, color: user.color, score: 0 }] : [])
    setStatus('')
    setRoomCode('')
    setPlayStyle('solo')
    autoJoinRef.current = false
    joinInFlightRef.current = false
    sound.click()
  }

  // Deep-link: once authenticated with ?room=CODE, join automatically.
  useEffect(() => {
    if (!user || room || busy || authLoading) return
    if (!roomCode || autoJoinRef.current) return
    const params = new URLSearchParams(window.location.search)
    if (!params.get('room')) return
    autoJoinRef.current = true
    void joinRoom(roomCode)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- join once per auth+deeplink
  }, [user, room, roomCode, busy, authLoading])

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#e9ecef] text-[#667085]">
        Memuat sesi…
      </div>
    )
  }

  return (
    <div className="relative h-full overflow-auto bg-[#e9ecef]">
      <div className="pointer-events-none fixed inset-0">
        <Map
          center={JAKARTA_CENTER}
          zoom={11}
          className="pointer-events-none h-full w-full opacity-80"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#e9ecef]/90 via-[#e9ecef]/55 to-[#e9ecef]" />
      </div>

      <div className="relative z-10 mx-auto grid h-full w-full max-w-6xl gap-4 overflow-auto px-4 py-6 sm:px-6 lg:grid-cols-[1.4fr_0.9fr]">
        <section className="flex flex-col">
          <p className="font-display text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">
            TransitGuessr
          </p>
          <h1 className="mt-2 max-w-xl font-display text-2xl leading-tight font-bold sm:text-3xl">
            Tebak rute. Tebak halte. Lomba bareng teman.
          </h1>
          <p className="mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
            Data GTFS Transjakarta, KRL, MRT, dan LRT Jabodebek / Jabodetabek. Warna jalur sesuai aslinya.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <RouteBadge code="1" color="#D01C2A" agency="tj" size="sm" />
            <RouteBadge code="9" color="#E87722" agency="tj" size="sm" />
            <TransportBadge system="JK" stationCode={['RED', 'BLU', 'GRN', 'BRN', 'PNK']} size="sm" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {data.meta.routeCount} rute · {data.meta.stopCount} halte
          </p>

          {!user ? (
            <Card className="mt-6 border-black/8 bg-white/90 shadow-lg backdrop-blur">
              <CardHeader>
                <CardTitle className="font-display">Masuk dulu</CardTitle>
                <CardDescription>Pilih cara masuk: guest, email, atau Google.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as typeof authMode)}>
                  <TabsList className="w-full">
                    <TabsTrigger value="guest" className="gap-1.5">
                      <User className="size-3.5" /> Guest
                    </TabsTrigger>
                    <TabsTrigger value="login" className="gap-1.5">
                      <LogIn className="size-3.5" /> Login
                    </TabsTrigger>
                    <TabsTrigger value="register" className="gap-1.5">
                      <Mail className="size-3.5" /> Daftar
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="guest" className="mt-4 space-y-3">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama panggilan"
                      onKeyDown={(e) => e.key === 'Enter' && submitGuest()}
                    />
                    <Button className="w-full bg-primary" onClick={submitGuest} disabled={authBusy}>
                      Lanjut sebagai guest
                    </Button>
                  </TabsContent>

                  <TabsContent value="login" className="mt-4 space-y-3">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      onKeyDown={(e) => e.key === 'Enter' && submitEmail()}
                    />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      onKeyDown={(e) => e.key === 'Enter' && submitEmail()}
                    />
                    <Button className="w-full bg-primary" onClick={submitEmail} disabled={authBusy}>
                      Login
                    </Button>
                  </TabsContent>

                  <TabsContent value="register" className="mt-4 space-y-3">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama"
                      onKeyDown={(e) => e.key === 'Enter' && submitEmail()}
                    />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      onKeyDown={(e) => e.key === 'Enter' && submitEmail()}
                    />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      onKeyDown={(e) => e.key === 'Enter' && submitEmail()}
                    />
                    <Button className="w-full bg-primary" onClick={submitEmail} disabled={authBusy}>
                      Daftar
                    </Button>
                  </TabsContent>
                </Tabs>

                <div className="relative my-4">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-muted-foreground">
                    atau
                  </span>
                </div>

                <Button variant="outline" className="w-full" onClick={googleLogin} disabled={authBusy}>
                  Lanjutkan dengan Google
                </Button>

                {authError ? <p className="text-sm text-rose-500">{authError}</p> : null}
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
                <p className="text-xs text-[#667085]">
                  {user.isGuest ? 'Guest' : user.email || 'Akun tersimpan'}
                </p>
              </div>
              <Button variant="ghost" onClick={doLogout}>
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
                className="h-12 w-full text-base font-bold"
                onClick={startSolo}
              >
                Start solo
              </Button>
            </TabsContent>

            <TabsContent value="friends" className="mt-4 space-y-4">
              <ModePicker mode={mode} setMode={setMode} disabled={!canPlay} />
              <DifficultyPicker difficulty={difficulty} setDifficulty={setDifficulty} />
              <div className="grid gap-2 sm:grid-cols-2">
                <Button disabled={!canPlay || busy} onClick={createRoom}>
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
                  <Button disabled={!canPlay || busy} variant="secondary" onClick={() => void joinRoom()}>
                    Join
                  </Button>
                </div>
              </div>
              {status ? (
                <StatusIndicator
                  state={busy ? 'fixing' : room ? 'active' : 'idle'}
                  label={status}
                  size="sm"
                />
              ) : null}
              {room?.isHost ? (
                <div className="rounded-xl border border-black/8 bg-white/90 p-3 text-sm">
                  <p className="mb-1.5 text-xs text-muted-foreground">Bagikan link room:</p>
                  <div className="flex gap-2">
                    <Input
                      value={`${window.location.origin}/?room=${room.code}`}
                      readOnly
                      className="h-9 text-xs"
                    />
                    <Button
                      variant="secondary"
                      className="h-9"
                      onClick={() => navigator.clipboard.writeText(`${window.location.origin}/?room=${room.code}`)}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              ) : null}
              <Separator className="my-1" />
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
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  size="lg"
                  disabled={!canPlay || !room || !room.isHost}
                  className="h-12 w-full text-base font-bold"
                  onClick={startFriends}
                >
                  {room?.isHost ? 'Start race' : 'Menunggu host…'}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  disabled={!room}
                  className="h-12 w-full text-base font-bold"
                  onClick={() => void leaveRoom()}
                >
                  Keluar room
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        <aside className="space-y-4">
          <Card className="border-black/8 bg-white/90 shadow-lg backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Trophy className="size-4 text-amber-500" /> Leaderboard
              </CardTitle>
              <CardDescription>Skor terbaik global</CardDescription>
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
          <AdSlot
            slot="landing-sidebar"
            format="auto"
            className="min-h-[100px] rounded-xl border border-black/8 bg-white/90 p-2 shadow-lg backdrop-blur"
          />
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
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
                ? 'border-primary ring-1 ring-primary/30'
                : 'border-black/8 hover:border-black/20',
              disabled && 'opacity-50',
            )}
          >
            <p className="font-display text-lg font-bold">{meta.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{meta.blurb}</p>
            <p className="mt-2 text-xs text-muted-foreground/80">{meta.tip}</p>
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
      <Label className="text-muted-foreground">Kesulitan</Label>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {(
          [
            ['easy', 'BRT'],
            ['medium', 'Integrasi'],
            ['hard', 'Mikrotrans'],
            ['krl', 'KRL'],
            ['mrt', 'MRT'],
            ['lrt-jabodebek', 'LRT Jabodebek'],
            ['lrt-jabodetabek', 'LRT Jabodetabek'],
            ['all', 'Semua'],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={difficulty === value ? 'default' : 'secondary'}
            className="rounded-full"
            onClick={() => setDifficulty(value)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  )
}
