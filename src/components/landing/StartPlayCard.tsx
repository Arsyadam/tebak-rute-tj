import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import StatusIndicator from '@/components/8starlabs-ui/status-indicator'
import type { Difficulty, DifficultyLevel, GameMode, PlayStyle } from '@/types'
import type { UserProfile } from '@/types'
import { MODE_META } from '@/lib/game'
import type { RoomPlayer, GameRoom } from '@/lib/multiplayer'
import { Users, User, Mail } from 'lucide-react'

export type StartCardStep = 'chooser' | 'guest-name' | 'login' | 'register' | 'play'

type Props = {
  step: StartCardStep
  setStep: (step: StartCardStep) => void
  user: UserProfile | null
  routeCount: number
  stopCount: number
  authBusy: boolean
  authError: string
  name: string
  setName: (v: string) => void
  email: string
  setEmail: (v: string) => void
  password: string
  setPassword: (v: string) => void
  submitGuest: () => void
  submitEmail: () => void
  googleLogin: () => void
  doLogout: () => void
  safeUserColor: (c: string | null | undefined) => string
  playStyle: PlayStyle
  setPlayStyle: (v: PlayStyle) => void
  mode: GameMode
  setMode: (v: GameMode) => void
  difficulty: Difficulty | 'all'
  setDifficulty: (v: Difficulty | 'all') => void
  difficultyLevel: DifficultyLevel
  setDifficultyLevel: (v: DifficultyLevel) => void
  canPlay: boolean
  busy: boolean
  roomCode: string
  setRoomCode: (v: string) => void
  room: GameRoom | null
  players: RoomPlayer[]
  status: string
  createRoom: () => void
  joinRoom: () => void
  leaveRoom: () => void
  startSolo: () => void
  startFriends: () => void
}

const shell =
  'space-y-4 rounded-[28px] border border-white/10 bg-[#1a1638] p-5 text-white shadow-[0_24px_48px_rgba(17,24,39,0.28)]'
const titleClass = 'font-display text-center text-2xl font-extrabold italic tracking-tight text-white'
const pillWhite =
  'h-11 w-full rounded-full border-0 bg-white font-bold italic text-[#1a1638] hover:bg-white/95'
const pillOutline =
  'h-11 w-full rounded-full border border-white/35 bg-transparent font-bold italic text-white hover:bg-white/10'
const pillGreen =
  'h-11 w-full rounded-full border-0 bg-[#108043] font-bold italic text-white hover:bg-[#12452b]'
const field =
  'h-11 rounded-full border-white/25 bg-[#120f28] text-white placeholder:text-white/45 focus-visible:border-[#f9a01b] focus-visible:ring-[#f9a01b]/30'
const labelMuted = 'text-white/70'

function AuthFooter({
  prompt,
  actionLabel,
  onAction,
}: {
  prompt: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-sm italic text-white/65">
      <span>{prompt}</span>
      <button
        type="button"
        onClick={onAction}
        className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white hover:bg-white/25"
      >
        {actionLabel}
      </button>
    </div>
  )
}

function ModeFields({
  mode,
  setMode,
  difficulty,
  setDifficulty,
  difficultyLevel,
  setDifficultyLevel,
  canPlay,
}: Pick<
  Props,
  | 'mode'
  | 'setMode'
  | 'difficulty'
  | 'setDifficulty'
  | 'difficultyLevel'
  | 'setDifficultyLevel'
  | 'canPlay'
>) {
  return (
    <>
      <div className="space-y-2">
        <Label className={labelMuted}>Mode</Label>
        <Select value={mode} onValueChange={(v) => setMode(v as GameMode)} disabled={!canPlay}>
          <SelectTrigger className="rounded-full border-white/25 bg-[#120f28] text-white">
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
        <Label className={labelMuted}>Moda</Label>
        <Select
          value={difficulty}
          onValueChange={(v) => setDifficulty(v as Difficulty | 'all')}
          disabled={!canPlay}
        >
          <SelectTrigger className="rounded-full border-white/25 bg-[#120f28] text-white">
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
        <Label className={labelMuted}>Difficulty</Label>
        <Select
          value={difficultyLevel}
          onValueChange={(v) => setDifficultyLevel(v as DifficultyLevel)}
          disabled={!canPlay}
        >
          <SelectTrigger className="rounded-full border-white/25 bg-[#120f28] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gampang">Gampang</SelectItem>
            <SelectItem value="agak-sulit">Agak Sulit</SelectItem>
            <SelectItem value="sulit-banget">Sulit Banget</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  )
}

export function StartPlayCard(props: Props) {
  const {
    step,
    setStep,
    user,
    routeCount,
    stopCount,
    authBusy,
    authError,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    submitGuest,
    submitEmail,
    googleLogin,
    doLogout,
    safeUserColor,
    playStyle,
    setPlayStyle,
    canPlay,
    busy,
    roomCode,
    setRoomCode,
    room,
    players,
    status,
    createRoom,
    joinRoom,
    leaveRoom,
    startSolo,
    startFriends,
  } = props

  let body: ReactNode = null

  if (step === 'chooser' && !user) {
    body = (
      <>
        <h2 className={titleClass}>Sign up to play</h2>
        <p className="text-center text-xs text-white/55">
          {routeCount} rute {stopCount} halte
        </p>
        <div className="space-y-2.5 pt-1">
          <Button className={pillWhite} onClick={googleLogin} disabled={authBusy}>
            Continue with Google
          </Button>
          <Button className={pillOutline} onClick={() => setStep('register')} disabled={authBusy}>
            <Mail className="size-4" /> Continue with Email
          </Button>
          <div className="relative my-3">
            <div className="border-t border-dashed border-white/25" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1a1638] px-2 text-[11px] font-bold italic uppercase tracking-wider text-white/50">
              or
            </span>
          </div>
          <Button className={pillGreen} onClick={() => setStep('guest-name')} disabled={authBusy}>
            <User className="size-4" /> Continue as Guest
          </Button>
        </div>
        <AuthFooter prompt="Already have an account?" actionLabel="Log in" onAction={() => setStep('login')} />
      </>
    )
  } else if (step === 'guest-name' && !user) {
    body = (
      <>
        <h2 className={titleClass}>What should we call you?</h2>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama panggilan"
          autoComplete="nickname"
          className={field}
          onKeyDown={(e) => e.key === 'Enter' && submitGuest()}
        />
        <Button className={pillGreen} onClick={submitGuest} disabled={authBusy}>
          Continue
        </Button>
        {authError ? <p className="text-center text-sm text-rose-300">{authError}</p> : null}
        <AuthFooter prompt="Mau pakai akun?" actionLabel="Back" onAction={() => setStep('chooser')} />
      </>
    )
  } else if ((step === 'login' || step === 'register') && !user) {
    const isRegister = step === 'register'
    body = (
      <>
        <h2 className={titleClass}>{isRegister ? 'Create account' : 'Log in'}</h2>
        {isRegister ? (
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama"
            autoComplete="nickname"
            className={field}
            onKeyDown={(e) => e.key === 'Enter' && submitEmail()}
          />
        ) : null}
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          className={field}
          onKeyDown={(e) => e.key === 'Enter' && submitEmail()}
        />
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          className={field}
          onKeyDown={(e) => e.key === 'Enter' && submitEmail()}
        />
        <Button className={pillGreen} onClick={submitEmail} disabled={authBusy}>
          {isRegister ? 'Sign up' : 'Log in'}
        </Button>
        <Button className={pillWhite} onClick={googleLogin} disabled={authBusy}>
          Continue with Google
        </Button>
        {authError ? <p className="text-center text-sm text-rose-300">{authError}</p> : null}
        <AuthFooter
          prompt={isRegister ? 'Already have an account?' : 'New here?'}
          actionLabel={isRegister ? 'Log in' : 'Sign up'}
          onAction={() => setStep(isRegister ? 'login' : 'register')}
        />
        <button
          type="button"
          className="mx-auto block text-xs italic text-white/45 hover:text-white/70"
          onClick={() => setStep('chooser')}
        >
          ← Back
        </button>
      </>
    )
  } else if (user) {
    body = (
      <>
        <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/8 px-3 py-2">
          <Avatar>
            <AvatarFallback style={{ background: safeUserColor(user.color) }} className="text-white">
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold italic text-white">{user.name}</p>
            <p className="text-xs text-white/60">{user.isGuest ? 'Guest' : user.email || 'Akun tersimpan'}</p>
          </div>
          <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={doLogout}>
            Ganti
          </Button>
        </div>

        <Tabs value={playStyle} onValueChange={(v) => setPlayStyle(v as PlayStyle)}>
          <TabsList className="w-full rounded-full bg-[#120f28]">
            <TabsTrigger
              value="solo"
              className="gap-1.5 rounded-full italic data-[state=active]:bg-[#108043] data-[state=active]:text-white"
            >
              <User className="size-3.5" /> Solo
            </TabsTrigger>
            <TabsTrigger
              value="friends"
              className="gap-1.5 rounded-full italic data-[state=active]:bg-[#108043] data-[state=active]:text-white"
            >
              <Users className="size-3.5" /> Bareng teman
            </TabsTrigger>
          </TabsList>

          <TabsContent value="solo" className="mt-4 space-y-4">
            <ModeFields {...props} />
            <Button size="lg" disabled={!canPlay} className={pillGreen} onClick={startSolo}>
              Mulai solo
            </Button>
          </TabsContent>

          <TabsContent value="friends" className="mt-4 space-y-4">
            <ModeFields {...props} />
            <div className="grid gap-2 sm:grid-cols-2">
              <Button className={pillGreen} disabled={!canPlay || busy} onClick={createRoom}>
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
                  placeholder="Kode"
                  className={`${field} tracking-widest`}
                  maxLength={5}
                  autoComplete="off"
                />
                <Button
                  disabled={!canPlay || busy}
                  className="rounded-full bg-white/15 font-bold italic text-white hover:bg-white/25"
                  onClick={() => void joinRoom()}
                >
                  Gabung
                </Button>
              </div>
            </div>
            {status ? (
              <StatusIndicator state={busy ? 'fixing' : room ? 'active' : 'idle'} label={status} size="sm" />
            ) : null}
            {room?.isHost ? (
              <div className="rounded-2xl border border-white/15 bg-white/8 p-3 text-sm">
                <p className="mb-1.5 text-xs text-white/60">Bagikan link room:</p>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/?room=${room.code}`}
                    readOnly
                    className="h-9 rounded-full border-white/20 bg-[#120f28] text-xs text-white"
                  />
                  <Button
                    className="h-9 rounded-full bg-white/15 text-white hover:bg-white/25"
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/?room=${room.code}`)}
                  >
                    Salin
                  </Button>
                </div>
              </div>
            ) : null}
            {players.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {players.map((p) => (
                  <Badge key={p.id} variant="secondary" className="gap-1.5 rounded-full bg-white/12 text-white">
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
                className={pillGreen}
                onClick={startFriends}
              >
                {room?.isHost ? 'Mulai race' : 'Menunggu host…'}
              </Button>
              <Button
                size="lg"
                disabled={!room}
                className={pillOutline}
                onClick={() => void leaveRoom()}
              >
                Keluar room
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </>
    )
  }

  return <section className={shell}>{body}</section>
}
