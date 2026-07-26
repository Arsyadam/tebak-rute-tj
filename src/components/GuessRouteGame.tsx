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
import { RouteBadge } from '@/components/RouteBadge'
import StatusIndicator from '@/components/8starlabs-ui/status-indicator'
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
            <Badge variant="secondary">
              Round {index + 1}/{rounds.length}
            </Badge>
            <StatusIndicator
              state={phase === 'reveal' ? (lastOk ? 'active' : 'down') : 'fixing'}
              size="sm"
              label={phase === 'reveal' ? (lastOk ? 'Benar' : 'Salah') : 'Tebak'}
            />
          </div>
          <h1 className="mt-1.5 font-display text-xl font-bold leading-tight">
            Jalur ini rute apa?
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Pilih kode rute dari daftar.</p>
        </div>
        <span className="shrink-0 text-sm font-bold tabular-nums">
          {score.toLocaleString('id-ID')}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {phase === 'reveal' ? (
          <div className="space-y-3">
            <p
              className={cn(
                'font-display text-2xl font-bold',
                lastOk ? 'text-emerald-600' : 'text-rose-600',
              )}
            >
              {lastOk ? 'Benar!' : 'Belum tepat'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <RouteBadge
                code={round.route.code}
                name={round.route.name}
                color={routeColor}
                agency={round.route.agency}
                size="md"
                showName
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Lihat bentuk jalur di peta, lalu pilih kode yang pas.
            </p>
            {choice ? (
              <RouteBadge
                code={choice}
                name={routeByCode.get(choice)}
                color={
                  Object.values(data.routes).find((r) => r.code === choice)?.color || routeColor
                }
                agency={Object.values(data.routes).find((r) => r.code === choice)?.agency}
                size="sm"
                showName
              />
            ) : null}
            <Select value={choice} onValueChange={setChoice}>
              <SelectTrigger className="h-11 w-full bg-background">
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
          </div>
        )}
      </div>

      <div className="border-t border-border/60 p-4">
        {phase === 'reveal' ? (
          <Button className="h-11 w-full" onClick={finishOrNext} withArrow>
            {index + 1 >= rounds.length ? 'Lihat skor' : 'Next'}
          </Button>
        ) : (
          <Button
            className="h-11 w-full font-bold"
            disabled={!choice}
            onClick={submit}
            withArrow
          >
            Guess
          </Button>
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
    </div>
  )
}
