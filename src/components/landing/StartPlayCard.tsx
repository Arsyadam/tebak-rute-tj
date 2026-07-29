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
import {
  Users,
  User,
  Mail,
  Bus,
  Gauge,
  LogOut,
  MapPinned,
  Route,
  Waypoints,
  Copy,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  'space-y-3.5 rounded-2xl border border-white/12 bg-[#1a1638] p-5 text-white shadow-[0_24px_48px_rgba(17,24,39,0.28)]'
const titleClass = 'font-display text-center text-2xl font-extrabold tracking-tight text-white'
const btnWhite =
  'h-11 w-full rounded-xl border-0 bg-white font-bold text-[#1a1638] hover:bg-white/95'
const btnOutline =
  'h-11 w-full rounded-xl border border-white/45 bg-transparent font-bold text-white hover:bg-white/10'
const btnGreen =
  'h-11 w-full rounded-xl border-0 bg-[#108043] font-bold text-white hover:bg-[#12452b]'
const field =
  'h-11 rounded-xl border-white/30 bg-[#120f28] text-white placeholder:text-white/55 focus-visible:border-[#f9a01b] focus-visible:ring-[#f9a01b]/30'
const labelMuted = 'text-sm font-semibold text-white/85'

const MODE_ICONS: Record<GameMode, typeof MapPinned> = {
  'name-stops': MapPinned,
  'guess-route': Route,
  'plan-trip': Waypoints,
}

const MODA_OPTIONS = [
  ['easy', 'BRT'],
  ['medium', 'Integrasi'],
  ['hard', 'Mikrotrans'],
  ['krl', 'KRL'],
  ['mrt', 'MRT'],
  ['lrt-jabodebek', 'LRT Jabodebek'],
  ['lrt-jabodetabek', 'LRT Jabodetabek'],
  ['all', 'Semua'],
] as const

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
    <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-sm italic text-white/80">
      <span>{prompt}</span>
      <button
        type="button"
        onClick={onAction}
        className="rounded-xl bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white hover:bg-white/30"
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
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className={labelMuted}>Mode</Label>
        <div className="grid grid-cols-1 gap-1.5" role="radiogroup" aria-label="Mode permainan">
          {(Object.keys(MODE_META) as GameMode[]).map((m) => {
            const Icon = MODE_ICONS[m]
            const active = mode === m
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={!canPlay}
                onClick={() => setMode(m)}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition',
                  active
                    ? 'border-[#108043] bg-[#108043] text-white shadow-[0_8px_20px_rgba(16,128,67,0.35)]'
                    : 'border-white/20 bg-[#120f28] text-white/90 hover:border-white/40 hover:bg-white/5',
                  !canPlay && 'opacity-50',
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="text-sm font-bold leading-none">{MODE_META[m].title}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1.5">
          <Label className={labelMuted}>Moda</Label>
          <Select
            value={difficulty}
            onValueChange={(v) => setDifficulty(v as Difficulty | 'all')}
            disabled={!canPlay}
          >
            <SelectTrigger className="h-11 rounded-xl border-white/30 bg-[#120f28] text-white">
              <span className="flex min-w-0 items-center gap-2">
                <Bus className="size-4 shrink-0 text-[#f9a01b]" />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              {MODA_OPTIONS.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className={labelMuted}>Difficulty</Label>
          <Select
            value={difficultyLevel}
            onValueChange={(v) => setDifficultyLevel(v as DifficultyLevel)}
            disabled={!canPlay}
          >
            <SelectTrigger className="h-11 rounded-xl border-white/30 bg-[#120f28] text-white">
              <span className="flex min-w-0 items-center gap-2">
                <Gauge className="size-4 shrink-0 text-[#f9a01b]" />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gampang">Gampang — ada hint</SelectItem>
              <SelectItem value="agak-sulit">Agak Sulit</SelectItem>
              <SelectItem value="sulit-banget">Sulit Banget — 40 detik</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
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
        <p className="text-center text-xs font-semibold text-white/75">
          {routeCount} rute {stopCount} halte
        </p>
        <div className="space-y-2.5 pt-1">
          <Button className={btnWhite} onClick={googleLogin} disabled={authBusy}>
            Continue with Google
          </Button>
          <Button className={btnOutline} onClick={() => setStep('register')} disabled={authBusy}>
            <Mail className="size-4" /> Continue with Email
          </Button>
          <div className="relative my-3">
            <div className="border-t border-dashed border-white/30" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1a1638] px-2 text-[11px] font-bold italic uppercase tracking-wider text-white/70">
              or
            </span>
          </div>
          <Button className={btnGreen} onClick={() => setStep('guest-name')} disabled={authBusy}>
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
        <Button className={btnGreen} onClick={submitGuest} disabled={authBusy}>
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
        <Button className={btnGreen} onClick={submitEmail} disabled={authBusy}>
          {isRegister ? 'Sign up' : 'Log in'}
        </Button>
        <Button className={btnWhite} onClick={googleLogin} disabled={authBusy}>
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
          className="mx-auto block text-xs italic text-white/70 hover:text-white"
          onClick={() => setStep('chooser')}
        >
          ← Back
        </button>
      </>
    )
  } else if (user) {
    body = (
      <>
        <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-3 py-2.5">
          <Avatar>
            <AvatarFallback style={{ background: safeUserColor(user.color) }} className="text-white">
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-white">{user.name}</p>
            <p className="text-xs font-medium text-white/80">
              {user.isGuest ? 'Main sebagai guest' : user.email || 'Akun tersimpan'}
            </p>
          </div>
          <Button variant="ghost" className="text-white hover:bg-white/15 hover:text-white" onClick={doLogout}>
            Ganti
          </Button>
        </div>

        <Tabs value={playStyle} onValueChange={(v) => setPlayStyle(v as PlayStyle)}>
          <TabsList className="w-full rounded-xl bg-[#120f28] p-1">
            <TabsTrigger
              value="solo"
              className="gap-1.5 rounded-lg text-white/75 data-[state=active]:bg-[#108043] data-[state=active]:text-white data-[state=inactive]:text-white/75"
            >
              <User className="size-3.5" /> Solo
            </TabsTrigger>
            <TabsTrigger
              value="friends"
              className="gap-1.5 rounded-lg text-white/75 data-[state=active]:bg-[#108043] data-[state=active]:text-white data-[state=inactive]:text-white/75"
            >
              <Users className="size-3.5" /> Bareng temen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="solo" className="mt-3 space-y-3.5">
            <ModeFields {...props} />
            <Button size="lg" disabled={!canPlay} className={btnGreen} onClick={startSolo}>
              Gas solo!
            </Button>
          </TabsContent>

          <TabsContent value="friends" className="mt-3 space-y-3">
            <ModeFields {...props} />

            <div className="flex items-center gap-2">
              <Button
                className="h-10 shrink-0 rounded-xl bg-[#108043] px-4 font-bold text-white hover:bg-[#12452b]"
                disabled={!canPlay || busy || Boolean(room)}
                onClick={createRoom}
              >
                Buat room
              </Button>
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
                className={`${field} h-10 min-w-0 flex-1 tracking-widest`}
                maxLength={5}
                autoComplete="off"
                disabled={Boolean(room)}
              />
              <Button
                disabled={!canPlay || busy || Boolean(room)}
                className="h-10 shrink-0 rounded-xl bg-white/18 px-3 font-bold text-white hover:bg-white/28"
                onClick={() => void joinRoom()}
              >
                Gabung
              </Button>
            </div>

            {status ? (
              <div className="rounded-xl bg-white/10 px-3 py-2 [&_*]:text-white/90">
                <StatusIndicator
                  state={busy ? 'fixing' : room ? 'active' : 'idle'}
                  label={status}
                  size="sm"
                  labelClassName="text-white/90"
                />
              </div>
            ) : null}

            {room?.isHost ? (
              <div className="rounded-2xl border border-white/20 bg-white/8 p-2.5">
                <p className="mb-1.5 text-xs font-semibold text-white/80">Bagikan link room ke temen</p>
                <div className="flex items-center gap-2">
                  <Input
                    value={`${window.location.origin}/?room=${room.code}`}
                    readOnly
                    className="h-9 rounded-xl border-white/25 bg-[#120f28] text-xs text-white"
                  />
                  <Button
                    size="icon"
                    className="size-9 shrink-0 rounded-xl bg-white/18 text-white hover:bg-white/28"
                    aria-label="Salin link room"
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/?room=${room.code}`)}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
            ) : null}

            {players.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {players.map((p) => (
                  <Badge
                    key={p.id}
                    variant="secondary"
                    className="gap-1.5 rounded-xl border-0 bg-white/15 px-2.5 py-1 text-white"
                  >
                    <span className="size-2 rounded-full" style={{ background: p.color }} />
                    {p.name}
                  </Badge>
                ))}
              </div>
            ) : null}

            <div className="flex items-center gap-2 pt-0.5">
              <Button
                size="icon"
                disabled={!room}
                aria-label="Keluar room"
                title="Keluar room"
                className="size-11 shrink-0 rounded-xl border border-white/40 bg-transparent text-white hover:bg-white/10 disabled:opacity-40"
                onClick={() => void leaveRoom()}
              >
                <LogOut className="size-4" />
              </Button>
              <Button
                size="lg"
                disabled={!canPlay || !room || !room.isHost}
                className={cn(btnGreen, 'h-11 flex-1 text-base')}
                onClick={startFriends}
              >
                {room?.isHost ? 'Gas race!' : 'Nunggu host…'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </>
    )
  }

  return <section className={shell}>{body}</section>
}
