import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { GameHudShell, HudBlock, HudTopBar, gameHud } from '@/components/game/GameHud'
import { RouteBadge } from '@/components/RouteBadge'
import {
  canUseHints,
  hasHardTimer,
  shouldHideMapLabels,
  useCountdown,
} from '@/hooks/useCountdown'

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

function partialHint(name: string) {
  const trimmed = name.trim()
  if (trimmed.length <= 3) return `${trimmed}…`
  return `${trimmed.slice(0, 3)}…`
}

export function NameStopsGame({
  rounds,
  players,
  selfId,
  room,
  difficultyLevel = 'gampang',
  onExit,
  onFinished,
}: Props) {
  const hard = hasHardTimer(difficultyLevel)
  const hintsOn = canUseHints(difficultyLevel)
  const hideLabels = shouldHideMapLabels(difficultyLevel)

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
  /** stopId → partial hint string shown on map */
  const [hints, setHints] = useState<Record<string, string>>({})
  const [elapsedMs, setElapsedMs] = useState(0)
  const [timedOut, setTimedOut] = useState(false)
  const startedAt = useRef(Date.now())
  const claimedRef = useRef(new Set<string>())
  const inputRef = useRef<HTMLInputElement>(null)
  const roundScoresRef = useRef<Record<number, { score: number; hintUsed: boolean }>>({})
  const roundRecordsRef = useRef<
    { roundIndex: number; correctAnswer: string; score: number; hintUsed: boolean }[]
  >([])

  const round = rounds[roundIndex]
  const routeColor = round?.route.color || '#108043'
  const score = room ? room.self.score : localScore
  const allDone = round ? guessed.size >= round.stops.length : false
  const paused = done || allDone || timedOut

  const advanceRound = useCallback(() => {
    if (!round) return
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
  }, [round, roundIndex, rounds.length, room, localScore, onFinished])

  const onTimeout = useCallback(() => {
    setTimedOut(true)
  }, [])

  const countdown = useCountdown({
    enabled: hard && !done,
    onTimeout,
    paused,
  })
  const resetCountdown = countdown.reset

  useEffect(() => {
    startedAt.current = Date.now()
    claimedRef.current = new Set()
    setGuessed(new Set())
    setInput('')
    setToast(null)
    setFocusStopId(null)
    setHintUsed(false)
    setHints({})
    setElapsedMs(0)
    setTimedOut(false)
    inputRef.current?.focus()
    if (!roundScoresRef.current[roundIndex]) {
      roundScoresRef.current[roundIndex] = { score: 0, hintUsed: false }
    }
    if (hard) resetCountdown()
  }, [roundIndex, hard, resetCountdown])

  useEffect(() => {
    if (done || hard) return
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt.current)
    }, 250)
    return () => window.clearInterval(id)
  }, [roundIndex, done, hard])

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
        if (hard) resetCountdown()
      } else {
        sound.tick()
      }
    }
  }, [room, selfId, roundIndex, rounds, hard, resetCountdown])

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
        Belum ada rute nih.
        <Button onClick={onExit}>Keluar</Button>
      </div>
    )
  }

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (timedOut || allDone) return
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

    // Reset speed clock + hard countdown after each correct halte
    startedAt.current = Date.now()
    setElapsedMs(0)
    if (hard) resetCountdown()

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

  const giveHint = () => {
    if (!hintsOn || remaining.length === 0) return
    const unhinted = remaining.filter((s) => !hints[s.id])
    const target = unhinted[0] ?? remaining[0]
    if (!target) return
    setHints((h) => ({ ...h, [target.id]: partialHint(target.name) }))
    setHintUsed(true)
    roundScoresRef.current[roundIndex].hintUsed = true
    setFocusStopId(target.id)
    setFlyNonce((n) => n + 1)
    sound.click()
  }

  const nextRound = () => {
    advanceRound()
  }

  if (done) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#ebf4f9] text-[#003324]">
        <p className="text-sm font-bold tracking-[0.18em] text-[#19483f] uppercase">Selesai!</p>
        <h2 className="font-display text-5xl font-bold">{score.toLocaleString('id-ID')}</h2>
        <p className="text-sm font-semibold text-[#19483f]/75">Mantap banget skornya</p>
        <Button
          onClick={onExit}
          className="rounded-xl bg-[#108043] px-6 font-bold text-white hover:bg-[#12452b]"
        >
          Balik ke menu
        </Button>
      </div>
    )
  }

  const timerNode = hard ? (
    <HudBlock className={countdown.isUrgent ? gameHud.timerDanger : gameHud.timer}>
      {countdown.label}
    </HudBlock>
  ) : (
    <HudBlock className={gameHud.timer}>
      {(() => {
        const total = Math.max(0, Math.floor(elapsedMs / 1000))
        return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
      })()}
    </HudBlock>
  )

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#ebf4f9]">
      <Map
        key={round.id}
        theme="light"
        center={round.center}
        zoom={round.zoom}
        className="h-full w-full"
        hideLabels={hideLabels}
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
          const hintLabel = hints[s.id]
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
              ) : hintLabel ? (
                <MarkerLabel className="rounded-md bg-[#F9A01B] px-1.5 py-0.5 text-[10px] font-bold text-[#003324] shadow">
                  {hintLabel}
                </MarkerLabel>
              ) : null}
            </MapMarker>
          )
        })}
      </Map>

      <GameHudShell>
        <HudTopBar
          left={
            <HudBlock className={cn(gameHud.panel, 'w-[min(100%,22rem)] p-3.5 sm:p-4')}>
              <div className="flex items-center gap-3">
                <RouteBadge
                  code={round.route.code}
                  name={round.route.name}
                  color={routeColor}
                  agency={round.route.agency}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className={cn('text-[11px] font-bold uppercase tracking-wide', gameHud.muted)}>
                    Ronde {roundIndex + 1}/{rounds.length}
                  </p>
                  <h1 className="font-display text-lg font-bold leading-tight text-[#003324] sm:text-xl">
                    Halte apa aja di rute ini?
                  </h1>
                  <p className={cn('mt-0.5 truncate text-xs font-semibold', gameHud.muted)}>
                    {round.route.name}
                  </p>
                </div>
              </div>

              <div className={cn('mt-3', gameHud.softWell)}>
                <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                  <span>
                    {guessed.size} / {round.stops.length} udah ketemu
                  </span>
                  <span className={gameHud.accent}>{foundPct}%</span>
                </div>
                <div className={gameHud.progressTrack}>
                  <div
                    className="h-full rounded-full bg-[#F9A01B] transition-[width] duration-300 ease-out"
                    style={{ width: `${foundPct}%` }}
                  />
                </div>
                <div className={cn('mt-1.5 flex justify-between text-[11px] font-semibold', gameHud.muted)}>
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
                          'inline-flex items-center gap-1.5 rounded-xl bg-[#EBF4F9] px-2 py-1 text-[11px] font-bold',
                          p.id === selfId && 'ring-2 ring-[#F9A01B]',
                        )}
                      >
                        <span className="size-1.5 rounded-full" style={{ background: p.color }} />
                        <span className="max-w-[6rem] truncate">{p.name}</span>
                        <span className={cn('tabular-nums', gameHud.muted)}>{p.score}</span>
                      </span>
                    ))}
                </div>
              ) : null}

              {foundStops.length > 0 ? (
                <p className="mt-3 line-clamp-2 text-xs font-semibold leading-relaxed text-[#003324]">
                  {foundStops.map((s) => s.name).join(', ')}
                </p>
              ) : (
                <p className={cn('mt-3 text-xs font-medium', gameHud.muted)}>
                  Ketik nama haltenya di bawah. Zoom/geser peta kalau jalurnya kurang kebaca.
                </p>
              )}
            </HudBlock>
          }
          center={timerNode}
          right={
            <div className="flex items-center gap-2">
              <HudBlock className={cn(gameHud.pill, 'min-w-[5rem] tabular-nums')}>
                <span className={cn('mr-1 text-[10px] font-bold uppercase tracking-wide', gameHud.muted)}>
                  Poin
                </span>
                {score.toLocaleString('id-ID')}
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
          }
        />

        <div className="flex justify-center">
          <HudBlock className={cn(gameHud.panel, 'w-[min(100%,28rem)] p-3')}>
            {timedOut ? (
              <div className="space-y-2">
                <p className="font-display text-lg font-bold text-[#E4002B]">Waktu habis — gagal!</p>
                <p className={cn('text-xs font-semibold', gameHud.muted)}>
                  Keburu kehabisan waktu. Gas ke ronde berikutnya ya.
                </p>
                <Button className={cn(gameHud.cta, 'w-full')} onClick={nextRound}>
                  {roundIndex + 1 >= rounds.length ? 'Lihat skor' : 'Rute berikutnya'}
                </Button>
              </div>
            ) : allDone ? (
              <div className="space-y-2">
                <p className="text-sm font-bold text-[#003324]">Wah, semua ketemu nih!</p>
                <Button className={cn(gameHud.cta, 'w-full')} onClick={nextRound}>
                  {roundIndex + 1 >= rounds.length ? 'Lihat skor' : 'Rute berikutnya'}
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ketik nama haltenya…"
                  className={cn(gameHud.input, 'flex-1', flash === 'bad' && 'border-rose-400')}
                  autoComplete="off"
                  autoFocus
                  aria-invalid={flash === 'bad' || undefined}
                />
                {hintsOn ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 shrink-0 rounded-xl border-[rgba(18,69,43,0.16)] bg-white px-3 font-bold text-[#003324] hover:bg-[#EBF4F9]"
                    onClick={giveHint}
                    title="Hint — 3 huruf pertama"
                  >
                    <Lightbulb className="size-4" />
                  </Button>
                ) : null}
                <Button type="submit" className={gameHud.cta}>
                  Tebak yuk
                </Button>
              </form>
            )}
          </HudBlock>
        </div>
      </GameHudShell>

      {toast ? (
        <div className="toast-in pointer-events-none absolute top-[42%] left-1/2 z-30 w-[min(90%,18rem)] -translate-x-1/2 -translate-y-1/2">
          <div className={cn(gameHud.panel, 'px-4 py-3 text-center')}>
            <p className={cn('text-[11px] font-bold tracking-wide uppercase', gameHud.muted)}>
              Halte ketemu · {toast.by}
            </p>
            <p className="mt-1 font-display text-xl font-bold text-[#003324]">{toast.name}</p>
            <p className="mt-1 text-lg font-extrabold text-[#FF6B00]">
              +{toast.points.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
