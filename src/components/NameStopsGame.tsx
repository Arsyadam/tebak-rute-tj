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
import { matchStopName, racePoints, type RouteRound } from '@/lib/game'
import { sound } from '@/lib/sound'
import type { GameRoom, RoomPlayer } from '@/lib/multiplayer'
import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'

interface Props {
  rounds: RouteRound[]
  players: RoomPlayer[]
  selfId: string
  room: GameRoom | null
  onExit: () => void
  onFinished: (score: number) => void
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
  const startedAt = useRef(Date.now())
  const claimedRef = useRef(new Set<string>())
  const inputRef = useRef<HTMLInputElement>(null)

  const round = rounds[roundIndex]
  const routeColor = round?.route.color || '#0b5ea8'

  useEffect(() => {
    startedAt.current = Date.now()
    claimedRef.current = new Set()
    setGuessed(new Set())
    setInput('')
    setToast(null)
    setFocusStopId(null)
    inputRef.current?.focus()
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
    setInput('')
    setFlash('ok')
    window.setTimeout(() => setFlash(null), 450)

    if (room) {
      room.sendGuessStop(hit.id, points)
    } else {
      claimedRef.current.add(hit.id)
      setGuessed(new Set(claimedRef.current))
      setLocalScore((s) => s + points)
      sound.correct()
      celebrate({ stopId: hit.id, name: hit.name, points, by: 'Kamu' })
    }
  }

  const allDone = guessed.size >= round.stops.length

  const nextRound = () => {
    if (roundIndex + 1 >= rounds.length) {
      setDone(true)
      sound.win()
      onFinished(room ? room.self.score : localScore)
      return
    }
    setRoundIndex((i) => i + 1)
    sound.click()
  }

  if (done) {
    const score = room ? room.self.score : localScore
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#14171c] text-white">
        <p className="text-sm tracking-[0.2em] text-white/45 uppercase">Selesai</p>
        <h2 className="font-display text-5xl font-extrabold">{score.toLocaleString('id-ID')}</h2>
        <Button onClick={onExit} className="bg-[var(--tj)] hover:bg-[#094a86]">
          Kembali
        </Button>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#e9ecef]">
      <div className="absolute inset-0">
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
      </div>

      {/* Hit toast */}
      {toast ? (
        <div className="toast-in pointer-events-none absolute top-1/3 left-1/2 z-40 w-[min(90vw,22rem)] -translate-x-1/2">
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

      {/* HUD — GeoGuessr-like neutral panel */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 sm:p-4">
        <div className="pointer-events-auto mx-auto flex max-w-3xl items-start gap-3">
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full bg-white/95 shadow"
            onClick={onExit}
          >
            <X className="size-4" />
          </Button>
          <div className="min-w-0 flex-1 rounded-2xl border border-black/8 bg-white/92 px-4 py-3 shadow-xl backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className="border-0 text-white hover:opacity-90"
                style={{ background: routeColor }}
              >
                Rute {round.route.code}
              </Badge>
              <span className="text-xs text-[#667085]">
                {roundIndex + 1}/{rounds.length}
              </span>
              <span className="ml-auto text-sm font-bold text-[#1c1f26] tabular-nums">
                {(room ? room.self.score : localScore).toLocaleString('id-ID')} pts
              </span>
            </div>
            <h1 className="mt-1 font-display text-lg font-bold tracking-tight sm:text-xl">
              Ada halte apa saja di rute ini?
            </h1>
            <p className="truncate text-sm text-[#667085]">
              {round.route.name} · {guessed.size}/{round.stops.length} ketemu
            </p>
          </div>
        </div>
      </div>

      {players.length > 1 ? (
        <div className="absolute top-28 right-3 z-20 flex flex-col gap-1 sm:top-4">
          {players
            .slice()
            .sort((a, b) => b.score - a.score)
            .map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-full bg-white/92 px-2.5 py-1 text-xs shadow backdrop-blur"
              >
                <span className="size-2 rounded-full" style={{ background: p.color }} />
                <span className={cn(p.id === selfId && 'font-bold')}>{p.name}</span>
                <span className="tabular-nums text-[#667085]">{p.score}</span>
              </div>
            ))}
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-30 p-3 sm:p-4">
        <div
          className={cn(
            'mx-auto max-w-xl rounded-2xl border bg-white/95 p-3 shadow-2xl backdrop-blur-md transition',
            flash === 'ok' && 'border-amber-400 ring-2 ring-amber-400/35',
            flash === 'bad' && 'border-rose-400 ring-2 ring-rose-400/35',
            !flash && 'border-black/8',
          )}
        >
          {allDone ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <p className="flex-1 text-sm text-[#2a2f3a]">Semua halte ketemu!</p>
              <Button className="bg-[var(--tj)] hover:bg-[#094a86]" onClick={nextRound}>
                {roundIndex + 1 >= rounds.length ? 'Lihat skor' : 'Rute berikutnya'}
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ketik nama halte…"
                className="h-12 border-[#d8dde6] bg-white text-base"
                autoComplete="off"
                autoFocus
              />
              <Button type="submit" className="h-12 bg-[var(--tj)] px-6 font-bold hover:bg-[#094a86]">
                Tebak
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
