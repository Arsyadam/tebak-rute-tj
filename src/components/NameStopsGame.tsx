import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Map,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  MarkerLabel,
} from '@/components/ui/map'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FitRoute, FlyToStop } from '@/components/MapHelpers'
import { matchStopName, racePoints, type RouteRound, HINT_PENALTY } from '@/lib/game'
import { sound } from '@/lib/sound'
import type { GameRoom, RoomPlayer } from '@/lib/multiplayer'
import { cn } from '@/lib/utils'
import { Check, Lightbulb, LogOut } from 'lucide-react'
import type { DifficultyLevel, GameResult } from '@/types'
import { GameHudShell, HudBlock, gameHud } from '@/components/game/GameHud'

interface Props {
  rounds: RouteRound[]
  players: RoomPlayer[]
  selfId: string
  room: GameRoom | null
  difficultyLevel?: DifficultyLevel
  onExit: () => void
  onFinished: (result: GameResult) => void
}

type HitToast = {
  stopId: string
  name: string
  points: number
  by: string
}

function formatElapsed(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function NameStopsGame({
  rounds,
  players,
  selfId,
  room,
  difficultyLevel: _difficultyLevel,
  onExit,
  onFinished,
}: Props) {
  const [roundIndex, setRoundIndex] = useState(0)
  const [guessed, setGuessed] = useState<Set<string>>(new Set())
  const [input, setInput] = useState('')
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null)
  const [localScore, setLocalScore] = useState(0)
  const [done, setDone] = useState(false)
  const [toast, setToast] = useState<HitToast | null>(null)
  const [focusStopId, setFocusStopId] = useState<string | null>(null)
  const [flyNonce, setFlyNonce] = useState(0)
  const [hintUsed, setHintUsed] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const startedAt = useRef(Date.now())
  const claimedRef = useRef(new Set<string>())
  const inputRef = useRef<HTMLInputElement>(null)
  const roundScoresRef = useRef<Record<number, { score: number; hintUsed: boolean }>>({})
  const roundRecordsRef = useRef<{ roundIndex: number; correctAnswer: string; score: number; hintUsed: boolean }[]>([])

  const round = rounds[roundIndex]
  const routeColor = round?.route.color || '#108043'
  const score = room ? room.self.score : localScore

  useEffect(() => {
    startedAt.current = Date.now()
    claimedRef.current = new Set()
    setGuessed(new Set())
    setInput('')
    setToast(null)
    setFocusStopId(null)
    setHintUsed(false)
    setElapsedMs(0)
    inputRef.current?.focus()
    if (!roundScoresRef.current[roundIndex]) {
      roundScoresRef.current[roundIndex] = { score: 0, hintUsed: false }
    }
  }, [roundIndex])

  useEffect(() => {
    if (done) return
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt.current)
    }, 250)
    return () => window.clearInterval(id)
  }, [roundIndex, done])

  const celebrate = (hit: HitToast) => {
    setToast(hit)
    setFocusStopId(hit.stopId)
    setFlyNonce((n) => n + 1)
    window.setTimeout(() => setToast((t) => (t?.stopId === hit.stopId ? null : t)), 2200)
  }

  useEffect(() => {
    if (!room) return
    room.onGuessStop = ({ playerId, stopId, points, name }) => {
      if (claimedRef.current.has(stopId)) return
      claimedRef.current.add(stopId)
      setGuessed(new Set(claimedRef.current))
      room.applyScore(playerId, points)
      const stopName = rounds[roundIndex]?.stops.find((s) => s.id === stopId)?.name ?? 'Halte'
      celebrate({ stopId, name: stopName, points, by: name })
      if (playerId === selfId) {
        setLocalScore((s) => s + points)
        roundScoresRef.current[roundIndex].score += points
        sound.correct()
      } else {
        sound.tick()
      }
    }
  }, [room, selfId, roundIndex, rounds])

  const remaining = useMemo(() => {
    if (!round) return []
    return round.stops.filter((s) => !guessed.has(s.id))
  }, [round, guessed])

  const focusStop = round?.stops.find((s) => s.id === focusStopId) ?? null
  const foundStops = useMemo(
    () => (round ? round.stops.filter((s) => guessed.has(s.id)) : []),
    [round, guessed],
  )
  const foundPct = round ? Math.round((guessed.size / Math.max(round.stops.length, 1)) * 100) : 0

  if (!round) {
    return (
      <div className="flex h-full items-center justify-center gap-3 bg-[#ebf4f9] text-[#003324]">
        Tidak ada rute.
        <Button onClick={onExit}>Keluar</Button>
      </div>
    )
  }

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text) return
    sound.guess()

    const hit = remaining.find((s) => matchStopName(text, s.name))
    if (!hit) {
      setFlash('bad')
      sound.wrong()
      window.setTimeout(() => setFlash(null), 350)
      return
    }

    if (claimedRef.current.has(hit.id)) {
      setFlash('bad')
      sound.wrong()
      return
    }

    const points = racePoints(Date.now() - startedAt.current)
    const applied = hintUsed ? Math.floor(points * HINT_PENALTY) : points
    setInput('')
    setFlash('ok')
    window.setTimeout(() => setFlash(null), 450)

    if (room) {
      room.sendGuessStop(hit.id, applied)
    } else {
      claimedRef.current.add(hit.id)
      setGuessed(new Set(claimedRef.current))
      setLocalScore((s) => s + applied)
      roundScoresRef.current[roundIndex].score += applied
      sound.correct()
      celebrate({ stopId: hit.id, name: hit.name, points: applied, by: 'Kamu' })
    }
  }

  const allDone = guessed.size >= round.stops.length

  const nextRound = () => {
    const summary = roundScoresRef.current[roundIndex] || { score: 0, hintUsed: false }
    roundRecordsRef.current.push({
      roundIndex,
      correctAnswer: round.route.code,
      score: summary.score,
      hintUsed: summary.hintUsed,
    })

    if (roundIndex + 1 >= rounds.length) {
      setDone(true)
      sound.win()
      onFinished({
        score: room ? room.self.score : localScore,
        hintCount: roundRecordsRef.current.filter((r) => r.hintUsed).length,
        rounds: roundRecordsRef.current,
      })
      return
    }
    setRoundIndex((i) => i + 1)
    sound.click()
  }

  const useHint = () => {
    if (room || hintUsed || allDone) return
    const remainingStops = round.stops.filter((s) => !guessed.has(s.id))
    if (remainingStops.length === 0) return
    const stop = remainingStops[Math.floor(Math.random() * remainingStops.length)]
    if (!stop) return
    claimedRef.current.add(stop.id)
    setGuessed(new Set(claimedRef.current))
    setFocusStopId(stop.id)
    setFlyNonce((n) => n + 1)
    setHintUsed(true)
    roundScoresRef.current[roundIndex].hintUsed = true
    sound.click()
  }

  if (done) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#ebf4f9] text-[#003324]">
        <p className="text-sm font-bold tracking-[0.18em] text-[#19483f] uppercase">Selesai</p>
        <h2 className="font-display text-5xl font-bold">{score.toLocaleString('id-ID')}</h2>
        <Button onClick={onExit} className="rounded-full bg-[#108043] px-6 font-bold text-white hover:bg-[#12452b]">
          Kembali ke menu
        </Button>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#ebf4f9]">
      <Map
        key={round.id}
        theme="light"
        center={round.center}
        zoom={round.zoom}
        className="h-full w-full"
      >
        <MapControls showZoom showCompass position="bottom-right" className="mb-20 mr-3 sm:mb-4" />
        <FitRoute path={round.path} />
        <FlyToStop stop={focusStop} nonce={flyNonce} />
        <MapRoute
          coordinates={round.path}
          color={routeColor}
          width={5}
          opacity={0.92}
          interactive={false}
        />
        {round.stops.map((s) => {
          const revealed = guessed.has(s.id)
          const justHit = focusStopId === s.id
          return (
            <MapMarker key={s.id} longitude={s.lon} latitude={s.lat}>
              <MarkerContent>
                <div className="relative flex items-center justify-center">
                  {justHit ? (
                    <span
                      className="hit-ring absolute size-5 rounded-full"
                      style={{ background: routeColor }}
                    />
                  ) : null}
                  <div
                    className={cn(
                      'relative z-[1] rounded-full border-2 shadow-md transition',
                      revealed
                        ? cn('size-5 border-white', justHit && 'hit-pop')
                        : 'size-3 border-white/90 bg-[#003324]',
                    )}
                    style={revealed ? { background: routeColor } : undefined}
                  >
                    {revealed ? (
                      <Check className="absolute inset-0 m-auto size-3 text-white" strokeWidth={3} />
                    ) : null}
                  </div>
                </div>
              </MarkerContent>
              {revealed ? (
                <MarkerLabel className="rounded-md bg-[#003324]/92 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                  {s.name}
                </MarkerLabel>
              ) : null}
            </MapMarker>
          )
        })}
      </Map>

      <GameHudShell>
        <div className="flex items-start justify-between gap-3">
          <HudBlock className={cn(gameHud.panel, 'w-[min(100%,22rem)] p-3.5 sm:p-4')}>
            <div className="flex items-start gap-3">
              <div
                className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white font-display text-xl font-bold tabular-nums text-[#003324] sm:size-14 sm:text-2xl"
                style={{ boxShadow: `inset 0 0 0 3px ${routeColor}` }}
              >
                {round.route.code.length <= 3 ? round.route.code : roundIndex + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-white/70">
                  Ronde {roundIndex + 1}/{rounds.length}
                </p>
                <h1 className="font-display text-lg font-bold leading-tight sm:text-xl">
                  Ada halte apa saja di rute ini?
                </h1>
                <p className="mt-0.5 truncate text-xs font-semibold text-white/75">{round.route.name}</p>
              </div>
            </div>

            <div className="mt-3 rounded-2xl bg-white/10 p-2.5">
              <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                <span className="text-white/90">
                  {guessed.size} / {round.stops.length} halte ketemu
                </span>
                <span className={gameHud.accent}>{foundPct}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-[#108043] transition-[width] duration-300 ease-out"
                  style={{ width: `${foundPct}%`, background: routeColor }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-white/75">
                <span>Ketemu {guessed.size}</span>
                <span>Sisa {round.stops.length - guessed.size}</span>
              </div>
            </div>

            {players.length > 1 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {players
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .map((p) => (
                    <span
                      key={p.id}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2 py-1 text-[11px] font-bold',
                        p.id === selfId && 'ring-1 ring-[#F9A01B]',
                      )}
                    >
                      <span className="size-1.5 rounded-full" style={{ background: p.color }} />
                      <span className="max-w-[6rem] truncate">{p.name}</span>
                      <span className="tabular-nums text-white/80">{p.score}</span>
                    </span>
                  ))}
              </div>
            ) : null}

            {foundStops.length > 0 ? (
              <p className="mt-3 line-clamp-2 text-xs font-semibold leading-relaxed text-white/90">
                {foundStops.map((s) => s.name).join(', ')}
              </p>
            ) : (
              <p className="mt-3 text-xs font-medium text-white/70">
                Ketik nama halte di bawah. Zoom/geser peta kalau jalur kurang kebaca.
              </p>
            )}
          </HudBlock>

          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-start">
            <HudBlock className={cn(gameHud.pill, 'min-w-[4.5rem] tabular-nums')}>
              {formatElapsed(elapsedMs)}
            </HudBlock>
            <HudBlock className={cn(gameHud.pill, 'min-w-[5rem] tabular-nums')}>
              <span className="mr-1 text-[10px] font-bold uppercase tracking-wide text-white/70">Poin</span>
              {score.toLocaleString('id-ID')}
            </HudBlock>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <HudBlock className={cn(gameHud.panel, 'w-[min(100%,28rem)] p-3')}>
            {allDone ? (
              <div className="space-y-2">
                <p className="text-sm font-bold text-white">Semua halte ketemu!</p>
                <Button className={cn(gameHud.cta, 'w-full')} onClick={nextRound}>
                  {roundIndex + 1 >= rounds.length ? 'Lihat skor' : 'Rute berikutnya'}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <form onSubmit={submit} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ketik nama halte…"
                    className={cn(gameHud.input, 'flex-1', flash === 'bad' && 'border-rose-400')}
                    autoComplete="off"
                    autoFocus
                    aria-invalid={flash === 'bad' || undefined}
                  />
                  <Button type="submit" className={gameHud.cta}>
                    Tebak
                  </Button>
                </form>
                <Button
                  variant="ghost"
                  className="h-9 w-full gap-2 rounded-full text-xs font-bold text-white/85 hover:bg-white/10 hover:text-white"
                  disabled={hintUsed || room !== null}
                  onClick={useHint}
                >
                  <Lightbulb className="size-3.5 text-[#F9A01B]" />
                  {hintUsed ? 'Bantuan sudah dipakai' : room ? 'Bantuan cuma buat solo' : 'Bantuan (-75% poin)'}
                </Button>
              </div>
            )}
          </HudBlock>

          <HudBlock>
            <Button
              size="icon"
              aria-label="Keluar"
              title="Keluar"
              className={gameHud.iconBtn}
              onClick={onExit}
            >
              <LogOut className="size-5" />
            </Button>
          </HudBlock>
        </div>
      </GameHudShell>

      {toast ? (
        <div className="toast-in pointer-events-none absolute top-[42%] left-1/2 z-30 w-[min(90%,18rem)] -translate-x-1/2 -translate-y-1/2">
          <div className={cn(gameHud.panel, 'px-4 py-3 text-center')}>
            <p className="text-[11px] font-bold tracking-wide text-white/70 uppercase">
              Halte ketemu · {toast.by}
            </p>
            <p className="mt-1 font-display text-xl font-bold text-white">{toast.name}</p>
            <p className="mt-1 text-lg font-extrabold text-[#F9A01B]">
              +{toast.points.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
