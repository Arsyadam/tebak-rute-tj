import { useMemo, useRef, useState } from 'react'
import {
  Map,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
} from '@/components/ui/map'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FitRoute } from '@/components/MapHelpers'
import type { GameData } from '@/types'
import { type RouteRound } from '@/lib/game'
import { sound } from '@/lib/sound'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface Props {
  data: GameData
  rounds: RouteRound[]
  onExit: () => void
  onFinished: (score: number) => void
}

export function GuessRouteGame({ data, rounds, onExit, onFinished }: Props) {
  const [index, setIndex] = useState(0)
  const [choice, setChoice] = useState<string>('')
  const [phase, setPhase] = useState<'play' | 'reveal' | 'done'>('play')
  const [score, setScore] = useState(0)
  const [lastOk, setLastOk] = useState(false)
  const scoreRef = useRef(0)

  const round = rounds[index]
  const routeColor = round?.route.color || '#0b5ea8'

  const routeByCode = useMemo(() => {
    const dict = new globalThis.Map<string, string>()
    for (const r of Object.values(data.routes)) dict.set(r.code, r.name)
    return dict
  }, [data])

  const options = useMemo(() => {
    if (!round) return []
    const codes = new Set<string>([round.route.code])
    const pool = Object.values(data.routes)
      .filter((r) => r.desc === round.route.desc || r.difficulty === round.route.difficulty)
      .map((r) => r.code)
    for (const c of pool) {
      if (codes.size >= 8) break
      codes.add(c)
    }
    for (const r of Object.values(data.routes)) {
      if (codes.size >= 8) break
      codes.add(r.code)
    }
    return [...codes].sort((a, b) => a.localeCompare(b, 'id'))
  }, [data, round])

  if (!round) {
    return (
      <div className="flex h-full items-center justify-center gap-3">
        Tidak ada rute.
        <Button onClick={onExit}>Keluar</Button>
      </div>
    )
  }

  if (phase === 'done') {
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

  const submit = () => {
    if (!choice || phase !== 'play') return
    sound.guess()
    const ok = choice === round.route.code
    setLastOk(ok)
    if (ok) {
      const next = scoreRef.current + 1000
      scoreRef.current = next
      setScore(next)
      sound.correct()
    } else sound.wrong()
    setPhase('reveal')
  }

  const finishOrNext = () => {
    if (index + 1 >= rounds.length) {
      setPhase('done')
      sound.win()
      onFinished(scoreRef.current)
      return
    }
    setIndex((i) => i + 1)
    setChoice('')
    setPhase('play')
    sound.click()
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
          <MapRoute
            coordinates={round.path}
            color={routeColor}
            width={6}
            opacity={0.95}
            interactive={false}
          />
          {round.stops.map((s) => (
            <MapMarker key={s.id} longitude={s.lon} latitude={s.lat}>
              <MarkerContent>
                <div
                  className="size-3 rounded-full border-2 border-white shadow"
                  style={{ background: phase === 'reveal' ? routeColor : '#2a2f3a' }}
                />
              </MarkerContent>
            </MapMarker>
          ))}
        </Map>
      </div>

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
            <div className="flex items-center gap-2">
              <Badge className="bg-[#2a2f3a] text-white hover:bg-[#2a2f3a]">
                Round {index + 1}/{rounds.length}
              </Badge>
              <span className="ml-auto text-sm font-bold tabular-nums">
                {score.toLocaleString('id-ID')} pts
              </span>
            </div>
            <h1 className="mt-1 font-display text-lg font-bold sm:text-xl">
              Jalur ini rute apa?
            </h1>
            <p className="text-sm text-[#667085]">Pilih kode rute dari daftar.</p>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-30 p-3 sm:p-4">
        <div className="mx-auto max-w-xl rounded-2xl border border-black/8 bg-white/95 p-3 shadow-2xl backdrop-blur-md">
          {phase === 'reveal' ? (
            <div className="space-y-3">
              <p
                className={cn(
                  'font-display text-xl font-bold',
                  lastOk ? 'text-emerald-600' : 'text-rose-600',
                )}
              >
                {lastOk ? 'Benar!' : 'Belum tepat'}
              </p>
              <p className="text-sm text-[#2a2f3a]">
                Itu rute{' '}
                <span className="font-bold" style={{ color: routeColor }}>
                  {round.route.code}
                </span>{' '}
                — {round.route.name}
              </p>
              <Button className="w-full bg-[var(--tj)] hover:bg-[#094a86]" onClick={finishOrNext}>
                {index + 1 >= rounds.length ? 'Lihat skor' : 'Next'}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select value={choice} onValueChange={setChoice}>
                <SelectTrigger className="h-12 flex-1 border-[#d8dde6] bg-white">
                  <SelectValue placeholder="Pilih kode rute…" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {options.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                      {routeByCode.get(code) ? ` — ${routeByCode.get(code)}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="h-12 bg-[var(--tj)] px-6 font-bold hover:bg-[#094a86]"
                disabled={!choice}
                onClick={submit}
              >
                Guess
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
