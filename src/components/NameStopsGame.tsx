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
import { Badge } from '@/components/ui/badge'
import { FitRoute, FlyToStop } from '@/components/MapHelpers'
import { RouteBadge } from '@/components/RouteBadge'
import PartitionBar, {
  PartitionBarSegment,
  PartitionBarSegmentTitle,
  PartitionBarSegmentValue,
} from '@/components/8starlabs-ui/partition-bar'
import Shake from '@/components/8starlabs-ui/shake'
import StatusIndicator from '@/components/8starlabs-ui/status-indicator'
import { matchStopName, racePoints, type RouteRound, HINT_PENALTY } from '@/lib/game'
import { sound } from '@/lib/sound'
import type { GameRoom, RoomPlayer } from '@/lib/multiplayer'
import { cn } from '@/lib/utils'
import { Check, X, Lightbulb } from 'lucide-react'
import type { DifficultyLevel, GameResult } from '@/types'

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
  const [shakeSignal, setShakeSignal] = useState(0)
  const [localScore, setLocalScore] = useState(0)
  const [done, setDone] = useState(false)
  const [toast, setToast] = useState<HitToast | null>(null)
  const [focusStopId, setFocusStopId] = useState<string | null>(null)
  const [flyNonce, setFlyNonce] = useState(0)
  const [hintUsed, setHintUsed] = useState(false)
  const startedAt = useRef(Date.now())
  const claimedRef = useRef(new Set<string>())
  const inputRef = useRef<HTMLInputElement>(null)
  const roundScoresRef = useRef<Record<number, { score: number; hintUsed: boolean }>>({})
  const roundRecordsRef = useRef<{ roundIndex: number; correctAnswer: string; score: number; hintUsed: boolean }[]>([])

  const round = rounds[roundIndex]
  const routeColor = round?.route.color || '#0b5ea8'
  const score = room ? room.self.score : localScore

  useEffect(() => {
    startedAt.current = Date.now()
    claimedRef.current = new Set()
    setGuessed(new Set())
    setInput('')
    setToast(null)
    setFocusStopId(null)
    setHintUsed(false)
    inputRef.current?.focus()
    if (!roundScoresRef.current[roundIndex]) {
      roundScoresRef.current[roundIndex] = { score: 0, hintUsed: false }
    }
  }, [roundIndex])

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

  if (!round) {
    return (
      <div className="flex h-full items-center justify-center gap-3">
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
      setShakeSignal((n) => n + 1)
      sound.wrong()
      window.setTimeout(() => setFlash(null), 350)
      return
    }

    if (claimedRef.current.has(hit.id)) {
      setFlash('bad')
      setShakeSignal((n) => n + 1)
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
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#14171c] text-white">
        <p className="text-sm tracking-[0.2em] text-white/45 uppercase">Selesai</p>
        <h2 className="font-display text-5xl font-extrabold">{score.toLocaleString('id-ID')}</h2>
        <Button onClick={onExit} className="bg-[var(--tj)] hover:bg-[#094a86]">
          Kembali ke menu
        </Button>
      </div>
    )
  }

  const sidePanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start gap-2 border-b border-border/60 px-4 py-3">
        <Button
          size="icon"
          variant="secondary"
          className="mt-0.5 shrink-0 rounded-full"
          onClick={onExit}
          disableHoverPop
        >
          <X className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <RouteBadge
              code={round.route.code}
              name={round.route.name}
              color={routeColor}
              agency={round.route.agency}
              size="sm"
            />
            <Badge variant="secondary" className="tabular-nums">
              {roundIndex + 1}/{rounds.length}
            </Badge>
          </div>
          <h1 className="mt-1.5 font-display text-xl font-bold leading-tight">
            Ada halte apa saja di rute ini?
          </h1>
          <p className="mt-1 truncate text-sm text-muted-foreground">{round.route.name}</p>
        </div>
        <span className="shrink-0 text-sm font-bold tabular-nums">{score.toLocaleString('id-ID')}</span>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div className="space-y-3 rounded-xl border border-border/60 bg-card p-3">
          <StatusIndicator
            state={allDone ? 'active' : 'fixing'}
            label={`${guessed.size} / ${round.stops.length} halte ketemu`}
            size="sm"
          />
          <PartitionBar size="sm" gap={1}>
            <PartitionBarSegment num={Math.max(guessed.size, 0.01)} variant="default" alignment="left">
              <PartitionBarSegmentTitle>Ketemu</PartitionBarSegmentTitle>
              <PartitionBarSegmentValue>{guessed.size}</PartitionBarSegmentValue>
            </PartitionBarSegment>
            <PartitionBarSegment
              num={Math.max(round.stops.length - guessed.size, 0.01)}
              variant="muted"
              alignment="right"
            >
              <PartitionBarSegmentTitle>Sisa</PartitionBarSegmentTitle>
              <PartitionBarSegmentValue>
                {round.stops.length - guessed.size}
              </PartitionBarSegmentValue>
            </PartitionBarSegment>
          </PartitionBar>
        </div>

        {players.length > 1 ? (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Race
            </p>
            {players
              .slice()
              .sort((a, b) => b.score - a.score)
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 rounded-lg bg-muted px-2.5 py-1.5 text-sm"
                >
                  <span className="size-2 rounded-full" style={{ background: p.color }} />
                  <span className={cn('min-w-0 flex-1 truncate', p.id === selfId && 'font-bold')}>
                    {p.name}
                  </span>
                  <span className="tabular-nums text-muted-foreground">{p.score}</span>
                </div>
              ))}
          </div>
        ) : null}

        {guessed.size > 0 ? (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Ketemu
            </p>
            <ul className="space-y-1">
              {round.stops
                .filter((s) => guessed.has(s.id))
                .map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-foreground"
                  >
                    <Check className="size-3.5 shrink-0" style={{ color: routeColor }} />
                    <span className="truncate">{s.name}</span>
                  </li>
                ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Ketik nama halte di bawah. Zoom/geser peta kalau jalur kurang kebaca.
          </p>
        )}
      </div>

      <div className="border-t border-border/60 p-4">
        {allDone ? (
          <div className="space-y-2">
            <p className="text-sm text-foreground">Semua halte ketemu!</p>
            <Button className="h-11 w-full" onClick={nextRound} withArrow>
              {roundIndex + 1 >= rounds.length ? 'Lihat skor' : 'Rute berikutnya'}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Shake signal={shakeSignal}>
              <form onSubmit={submit} className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ketik nama halte…"
                  className="h-11 bg-background text-base"
                  autoComplete="off"
                  autoFocus
                  aria-invalid={flash === 'bad' || undefined}
                />
                <Button type="submit" className="h-11 px-5 font-bold" withArrow>
                  Tebak
                </Button>
              </form>
            </Shake>
            <Button
              variant="outline"
              className="h-10 w-full gap-2"
              disabled={hintUsed || room !== null}
              onClick={useHint}
            >
              <Lightbulb className="size-4" />
              {hintUsed ? 'Bantuan sudah dipakai' : room ? 'Bantuan cuma buat solo' : 'Bantuan (-75% poin)'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[#e9ecef]">
      <aside className="absolute inset-x-0 bottom-0 z-20 flex max-h-[48%] flex-col overflow-hidden rounded-t-2xl border border-black/8 bg-white shadow-[0_-8px_28px_rgba(0,0,0,0.12)] lg:static lg:inset-auto lg:z-auto lg:h-full lg:max-h-none lg:w-[380px] lg:shrink-0 lg:rounded-none lg:border-r lg:border-b-0 lg:shadow-[8px_0_24px_rgba(0,0,0,0.06)] xl:w-[420px]">
        {sidePanel}
      </aside>

      <div className="relative min-h-0 min-w-0 flex-1 pb-[min(48%,26rem)] lg:pb-0">
        <Map
          key={round.id}
          theme="light"
          center={round.center}
          zoom={round.zoom}
          className="h-full w-full"
        >
          <MapControls showZoom showCompass position="bottom-right" />
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
                          : 'size-3 border-white/90 bg-[#2a2f3a]',
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
                  <MarkerLabel className="rounded-md bg-[#1c1f26]/92 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
                    {s.name}
                  </MarkerLabel>
                ) : null}
              </MapMarker>
            )
          })}
        </Map>

        {toast ? (
          <div className="toast-in pointer-events-none absolute top-6 left-1/2 z-30 w-[min(90%,20rem)] -translate-x-1/2">
            <div className="rounded-2xl border border-black/10 bg-white/95 px-4 py-3 text-center shadow-2xl backdrop-blur">
              <p className="text-xs font-semibold tracking-wide text-[#667085] uppercase">
                Halte ketemu · {toast.by}
              </p>
              <p className="mt-1 font-display text-xl font-bold text-[#1c1f26]">{toast.name}</p>
              <p className="mt-1 text-lg font-extrabold" style={{ color: routeColor }}>
                +{toast.points.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
