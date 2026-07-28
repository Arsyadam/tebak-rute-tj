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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import StatusIndicator from '@/components/8starlabs-ui/status-indicator'
import { TransportBadge } from '@/components/8starlabs-ui/transport-badge'
import { RouteBadge } from '@/components/RouteBadge'
import { AdSlot } from '@/components/AdSlot'
import TransitGuessrHero from '@/components/landing/transitguessr/TransitGuessrHero'
import GameStartCard from '@/components/landing/GameStartCard'
import LeaderboardCard from '@/components/landing/LeaderboardCard'
import type { Difficulty, DifficultyLevel, GameData, GameMode, LeaderboardEntry, PlayStyle } from '@/types'
import { JAKARTA_CENTER, MODE_META } from '@/lib/game'
import { loadLeaderboard } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'
import { sound } from '@/lib/sound'
import { GameRoom } from '@/lib/multiplayer'
import type { RoomPlayer } from '@/lib/multiplayer'
import { Trophy, Users, User, Mail, LogIn } from 'lucide-react'

export type StartPayload = {
  mode: GameMode
  difficulty: Difficulty | 'all'
  difficultyLevel: DifficultyLevel
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
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>('gampang')
  const [playStyle, setPlayStyle] = useState<PlayStyle>('solo')
  const [roomCode, setRoomCode] = useState('')
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const autoJoinRef = useRef(false)
  const joinInFlightRef = useRef(false)
  const authInFlightRef = useRef(false)

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
    const safeColor = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(user.color) ? user.color : '#12452b'
    setPlayers([{ id: user.id, name: user.name, color: safeColor, score: 0 }])
  }, [user])

  const canPlay = Boolean(user)

  const safeUserColor = (c: string | null | undefined) => {
    if (!c) return '#12452b'
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c) ? c : '#12452b'
  }

  const safeErrorMessage = (err: unknown, fallback: string) => {
    const message = err instanceof Error ? err.message : ''
    const lower = message.toLowerCase()

    if (/(exist|already)/i.test(lower)) return 'Email sudah dipakai. Coba login.'
    if (/(invalid|unauthorized|wrong|credential)/i.test(lower)) return 'Email atau password salah.'
    if (/(min\s*8|password.*8|too\s*short.*8)/i.test(lower)) return 'Password minimal 8 karakter.'
    if (/(kode|room|code)/i.test(lower) && /(invalid|not found|missing)/i.test(lower)) return 'Kode room tidak valid.'

    return fallback
  }

  const submitGuest = async () => {
    if (authInFlightRef.current || authBusy) return
    authInFlightRef.current = true
    setAuthBusy(true)
    setAuthError('')
    try {
      sound.unlock()
      sound.join()
      const nameTrim = name.trim()
      if (!nameTrim) {
        setAuthError('Nama wajib diisi')
        return
      }
      if (nameTrim.length > 24) {
        setAuthError('Nama maksimal 24 karakter')
        return
      }
      await loginGuest(nameTrim)
    } catch (err) {
      setAuthError(safeErrorMessage(err, 'Belum bisa masuk. Coba lagi, ya.'))
    } finally {
      setAuthBusy(false)
      authInFlightRef.current = false
    }
  }

  const submitEmail = async () => {
    if (authInFlightRef.current || authBusy) return
    const trimmedEmail = email.trim()
    const trimmedPassword = password
    const nameTrim = name.trim()

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setAuthError('Email wajib diisi dengan format yang benar')
      return
    }

    if (!trimmedPassword || trimmedPassword.length < 8) {
      setAuthError('Password minimal 8 karakter')
      return
    }

    if (nameTrim.length > 24) {
      setAuthError('Nama maksimal 24 karakter')
      return
    }

    authInFlightRef.current = true
    setAuthBusy(true)
    setAuthError('')
    try {
      sound.unlock()
      sound.join()
      if (authMode === 'register') {
        const fallbackName = trimmedEmail.split('@')[0].slice(0, 24)
        const finalName = nameTrim || fallbackName
        if (!finalName) {
          setAuthError('Nama wajib diisi')
          return
        }
        await registerEmail(trimmedEmail, trimmedPassword, finalName)
      } else {
        await loginEmail(trimmedEmail, trimmedPassword)
      }
    } catch (err) {
      setAuthError(safeErrorMessage(err, 'Belum bisa masuk. Coba lagi, ya.'))
    } finally {
      setAuthBusy(false)
      authInFlightRef.current = false
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
      difficultyLevel,
      count: 5,
      playStyle: 'solo',
      room: null,
      seed: Date.now(),
    })
  }

  const startFriends = () => {
    if (!room || !room.isHost) return
    sound.unlock()
    room.startGame(Date.now(), mode, difficulty, difficultyLevel)
  }

  const createRoom = async () => {
    if (!user) return
    setBusy(true)
    setStatus('Lagi buat room…')
    try {
      sound.unlock()
      const r = await GameRoom.host(user, mode, difficulty)
      r.onRoster = (ps) => setPlayers(ps.map((p) => ({ ...p, color: safeUserColor(p.color) })))
      r.onStatus = setStatus
      r.onStart = ({ seed, mode: m, difficulty: d, difficultyLevel: dl }) => {
        onStart({
          mode: m as GameMode,
          difficulty: d as Difficulty | 'all',
          difficultyLevel: dl as DifficultyLevel,
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
      setStatus(safeErrorMessage(e, 'Belum bisa buat room. Coba lagi, ya.'))
    } finally {
      setBusy(false)
    }
  }

  const joinRoom = async (codeOverride?: string) => {
    const raw = (codeOverride || roomCode).trim().toUpperCase()
    const code = raw.replace(/[^A-Z0-9]/g, '')
    if (!user || !code || joinInFlightRef.current || room) return
    if (!/^[A-Z0-9]{5}$/.test(code)) {
      setStatus('Kode room harus 5 karakter (A-Z/0-9)')
      return
    }
    joinInFlightRef.current = true
    setBusy(true)
    setRoomCode(code)
    setPlayStyle('friends')
    setStatus(`Lagi gabung room ${code}…`)
    try {
      sound.unlock()
      const r = await GameRoom.join(user, code)
      r.onRoster = (ps) => setPlayers(ps.map((p) => ({ ...p, color: safeUserColor(p.color) })))
      r.onStatus = setStatus
      r.onStart = ({ seed, mode: m, difficulty: d, difficultyLevel: dl }) => {
        onStart({
          mode: m as GameMode,
          difficulty: d as Difficulty | 'all',
          difficultyLevel: dl as DifficultyLevel,
          count: 3,
          playStyle: 'friends',
          room: r,
          seed,
        })
      }
      setRoom(r)
      setStatus('Sudah gabung. Menunggu host…')
      sound.join()
    } catch (e) {
      autoJoinRef.current = false
      setStatus(safeErrorMessage(e, 'Belum bisa gabung room. Coba lagi, ya.'))
    } finally {
      joinInFlightRef.current = false
      setBusy(false)
    }
  }

  const leaveRoom = async () => {
    if (!room) return
    room.destroy()
    setRoom(null)
    setPlayers(user ? [{ id: user.id, name: user.name, color: safeUserColor(user.color), score: 0 }] : [])
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
        Lagi memuat sesi…
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-[#f4f5f7]">
      <div className="pointer-events-none fixed inset-0">
          <Map
            center={JAKARTA_CENTER}
            zoom={11}
            className="pointer-events-none h-full w-full opacity-80"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#f4f5f7]/90 via-[#f4f5f7]/55 to-[#f4f5f7]" />
        </div>

      <TransitGuessrHero startCard={<GameStartCard>
          <section className="flex flex-col">
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
                        autoComplete="nickname"
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
                        autoComplete="email"
                        onKeyDown={(e) => e.key === 'Enter' && submitEmail()}
                      />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        autoComplete="current-password"
                        onKeyDown={(e) => e.key === 'Enter' && submitEmail()}
                      />
                      <Button className="w-full bg-primary" onClick={submitEmail} disabled={authBusy}>
                        Masuk
                      </Button>
                    </TabsContent>

                    <TabsContent value="register" className="mt-4 space-y-3">
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nama"
                        autoComplete="nickname"
                        onKeyDown={(e) => e.key === 'Enter' && submitEmail()}
                      />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        autoComplete="email"
                        onKeyDown={(e) => e.key === 'Enter' && submitEmail()}
                      />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        autoComplete="new-password"
                        onKeyDown={(e) => e.key === 'Enter' && submitEmail()}
                      />
                      <Button className="w-full bg-primary" onClick={submitEmail} disabled={authBusy}>
                        Buat akun
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
                    Lanjut dengan Google
                  </Button>

                  {authError ? <p className="text-sm text-rose-500">{authError}</p> : null}
                </CardContent>
              </Card>
            ) : (
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-black/8 bg-white/90 px-4 py-3 shadow backdrop-blur">
                <Avatar>
                  <AvatarFallback style={{ background: safeUserColor(user.color) }} className="text-white">
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
                  <Users className="size-3.5" /> Bareng teman
                </TabsTrigger>
              </TabsList>

              <TabsContent value="solo" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Mode</Label>
                  <Select value={mode} onValueChange={(v) => setMode(v as GameMode)} disabled={!canPlay}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(MODE_META) as GameMode[]).map((m) => (
                        <SelectItem key={m} value={m}>
                          {MODE_META[m]?.title ?? m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Moda</Label>
                  <Select
                    value={difficulty}
                    onValueChange={(v) => setDifficulty(v as Difficulty | 'all')}
                    disabled={!canPlay}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Difficulty</Label>
                  <Select
                    value={difficultyLevel}
                    onValueChange={(v) => setDifficultyLevel(v as typeof difficultyLevel)}
                    disabled={!canPlay}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gampang">Gampang</SelectItem>
                      <SelectItem value="agak-sulit">Agak Sulit</SelectItem>
                      <SelectItem value="sulit-banget">Sulit Banget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="lg"
                  disabled={!canPlay}
                  className="h-12 w-full text-base font-bold"
                  onClick={startSolo}
                >
                  Mulai solo
                </Button>
              </TabsContent>

              <TabsContent value="friends" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Mode</Label>
                  <Select value={mode} onValueChange={(v) => setMode(v as GameMode)} disabled={!canPlay}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(MODE_META) as GameMode[]).map((m) => (
                        <SelectItem key={m} value={m}>
                          {MODE_META[m]?.title ?? m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Moda</Label>
                  <Select
                    value={difficulty}
                    onValueChange={(v) => setDifficulty(v as Difficulty | 'all')}
                    disabled={!canPlay}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Difficulty</Label>
                  <Select
                    value={difficultyLevel}
                    onValueChange={(v) => setDifficultyLevel(v as typeof difficultyLevel)}
                    disabled={!canPlay}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gampang">Gampang</SelectItem>
                      <SelectItem value="agak-sulit">Agak Sulit</SelectItem>
                      <SelectItem value="sulit-banget">Sulit Banget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button disabled={!canPlay || busy} onClick={createRoom}>
                    Buat room
                  </Button>
                  <div className="flex gap-2">
                    <Input
                      value={roomCode}
                      onChange={(e) =>
                        setRoomCode(
                          e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, '')
                            .slice(0, 5),
                        )
                      }
                      placeholder="Kode room"
                      className="tracking-widest"
                      maxLength={5}
                      autoComplete="off"
                    />
                    <Button disabled={!canPlay || busy} variant="secondary" onClick={() => void joinRoom()}>
                      Gabung
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
                        Salin
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
                    {room?.isHost ? 'Mulai race' : 'Menunggu host…'}
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
        </GameStartCard>}
        sideCard={<LeaderboardCard>
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
                    <p className="text-sm text-[#667085]">Belum ada skor. Main dulu, yuk.</p>
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
        </LeaderboardCard>}
      />
    </div>
  )
}

// (ModePicker & DifficultyPicker sudah diganti Select di UI card mulai game.)
