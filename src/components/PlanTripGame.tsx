import { useMemo, useRef, useState, type ReactNode } from 'react'
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
import Timeline, {
  TimelineItem,
  TimelineItemDate,
  TimelineItemDescription,
  TimelineItemTitle,
} from '@/components/8starlabs-ui/timeline'
import StatusIndicator from '@/components/8starlabs-ui/status-indicator'
import type { DifficultyLevel, GameData, Route } from '@/types'
import {
  distractorRoutes,
  distractorStops,
  type Journey,
} from '@/lib/journey'
import { sound } from '@/lib/sound'
import { cn } from '@/lib/utils'
import { HINT_PENALTY } from '@/lib/game'
import { ArrowRight, X, Lightbulb } from 'lucide-react'
import type { GameRoundRecord, GameResult } from '@/types'

interface Props {
  data: GameData
  journeys: Journey[]
  difficultyLevel?: DifficultyLevel
  onExit: () => void
  onFinished: (result: GameResult) => void
}

type PreviewLine = {
  key: string
  path: [number, number][]
  color: string
  width: number
  opacity: number
  dashArray?: [number, number]
}

function routeByCode(data: GameData, code: string): Route | undefined {
  return Object.values(data.routes).find((r) => r.code === code)
}

function longestPatternPath(route: Route): [number, number][] {
  let best = route.patterns[0]
  for (const p of route.patterns) {
    if (!best || p.shape.length > best.shape.length) best = p
  }
  if (!best || best.shape.length < 2) return []
  return best.shape.map(([lat, lon]) => [lon, lat] as [number, number])
}

function findStopByName(data: GameData, name: string) {
  const hit = Object.values(data.stops).find((s) => s.name === name)
  return hit ?? null
}

export function PlanTripGame({
  data,
  journeys,
  difficultyLevel: _difficultyLevel,
  onExit,
  onFinished,
}: Props) {
  const [index, setIndex] = useState(0)
  const [firstRoute, setFirstRoute] = useState('')
  const [transfer, setTransfer] = useState('')
  const [secondRoute, setSecondRoute] = useState('')
  const [phase, setPhase] = useState<'play' | 'reveal' | 'done'>('play')
  const [score, setScore] = useState(0)
  const [lastOk, setLastOk] = useState(false)
  const [hintUsed, setHintUsed] = useState(false)
  const scoreRef = useRef(0)
  const roundsRef = useRef<GameRoundRecord[]>([])

  const journey = journeys[index]
  const needsTransfer = (journey?.legs.length ?? 0) > 1

  const routeOptions = useMemo(() => {
    if (!journey) return []
    const correct = journey.legs.map((l) => l.routeCode)
    return distractorRoutes(data, correct, 8, index * 9973 + 11)
  }, [data, journey, index])

  const transferOptions = useMemo(() => {
    if (!journey?.transferName) return []
    return distractorStops(data, journey.transferName, 8, index * 4243 + 7)
  }, [data, journey, index])

  const previewLines = useMemo((): PreviewLine[] => {
    if (!journey) return []
    if (phase === 'reveal') {
      return journey.legs.map((leg, i) => ({
        key: `reveal-${leg.routeId}-${i}`,
        path: leg.path,
        color: leg.routeColor,
        width: 5,
        opacity: 0.95,
      }))
    }

    const lines: PreviewLine[] = []
    if (firstRoute) {
      const route = routeByCode(data, firstRoute)
      if (route) {
        const isCorrectFirst = firstRoute === journey.legs[0]?.routeCode
        const path =
          isCorrectFirst && journey.legs[0]
            ? journey.legs[0].path
            : longestPatternPath(route)
        if (path.length >= 2) {
          lines.push({
            key: `preview-1-${firstRoute}`,
            path,
            color: route.color,
            width: 5,
            opacity: 0.9,
          })
        }
      }
    }
    if (secondRoute) {
      const route = routeByCode(data, secondRoute)
      if (route) {
        const isCorrectSecond = secondRoute === journey.legs[1]?.routeCode
        const path =
          isCorrectSecond && journey.legs[1]
            ? journey.legs[1].path
            : longestPatternPath(route)
        if (path.length >= 2) {
          lines.push({
            key: `preview-2-${secondRoute}`,
            path,
            color: route.color,
            width: 4,
            opacity: 0.85,
            dashArray: [1.8, 1.4],
          })
        }
      }
    }
    return lines
  }, [data, journey, phase, firstRoute, secondRoute])

  const fitPath = useMemo((): [number, number][] => {
    if (!journey) return []
    if (phase === 'reveal' || previewLines.length > 0) {
      const paths = previewLines.flatMap((l) => l.path)
      if (paths.length >= 2) return paths
    }
    return [
      [journey.from.lon, journey.from.lat],
      [journey.to.lon, journey.to.lat],
    ]
  }, [journey, phase, previewLines])

  const previewTransfer = useMemo(() => {
    if (phase === 'reveal') {
      if (!journey?.transferStopId) return null
      return data.stops[journey.transferStopId] ?? null
    }
    if (!transfer) return null
    return findStopByName(data, transfer)
  }, [data, journey, phase, transfer])

  if (!journey) {
    return (
      <div className="flex h-full items-center justify-center gap-3">
        Tidak ada perjalanan.
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
          Kembali ke menu
        </Button>
      </div>
    )
  }

  const submit = () => {
    if (phase !== 'play') return
    const leg1 = journey.legs[0]!
    const okFirst = firstRoute === leg1.routeCode
    let ok = okFirst
    let points = okFirst ? 600 : 0

    if (needsTransfer) {
      const leg2 = journey.legs[1]!
      const okTransfer = transfer === journey.transferName
      const okSecond = secondRoute === leg2.routeCode
      if (okTransfer) points += 500
      if (okSecond) points += 600
      ok = okFirst && okTransfer && okSecond
    }

    if (hintUsed) {
      points = Math.floor(points * HINT_PENALTY)
    }

    const correctAnswer = needsTransfer
      ? `${leg1.routeCode} → ${journey.transferName ?? ''} → ${journey.legs[1]?.routeCode ?? ''}`
      : leg1.routeCode

    roundsRef.current.push({
      roundIndex: index,
      correctAnswer,
      score: points,
      hintUsed,
    })

    setLastOk(ok)
    if (points > 0) {
      const next = scoreRef.current + points
      scoreRef.current = next
      setScore(next)
    }
    if (ok) sound.correct()
    else sound.wrong()
    setPhase('reveal')
  }

  const useHint = () => {
    if (phase !== 'play' || hintUsed) return
    const leg1 = journey.legs[0]!
    if (!firstRoute) {
      setFirstRoute(leg1.routeCode)
    } else if (needsTransfer && !transfer) {
      setTransfer(journey.transferName || '')
    } else if (needsTransfer && !secondRoute) {
      setTransfer(journey.transferName || '')
      setSecondRoute(journey.legs[1]?.routeCode || '')
    }
    setHintUsed(true)
    sound.click()
  }

  const finishOrNext = () => {
    if (index + 1 >= journeys.length) {
      setPhase('done')
      sound.win()
      onFinished({
        score: scoreRef.current,
        hintCount: roundsRef.current.filter((r) => r.hintUsed).length,
        rounds: roundsRef.current,
      })
      return
    }
    setIndex((i) => i + 1)
    setFirstRoute('')
    setTransfer('')
    setSecondRoute('')
    setHintUsed(false)
    setPhase('play')
    sound.click()
  }

  const canSubmit =
    Boolean(firstRoute) && (!needsTransfer || (Boolean(transfer) && Boolean(secondRoute)))

  const step = !firstRoute ? 1 : needsTransfer && !transfer ? 2 : needsTransfer && !secondRoute ? 3 : 4

  const answerPanel = (
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
              Ronde {index + 1}/{journeys.length}
            </Badge>
            <Badge variant="outline">{needsTransfer ? '1x transit' : 'Tanpa transit'}</Badge>
          </div>
          <h1 className="mt-1.5 font-display text-xl font-bold leading-tight">Dari A ke B, naik apa?</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm">
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">
                Titik A · {journey.from.name}
              </span>
              <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="rounded-md bg-rose-50 px-1.5 py-0.5 font-semibold text-rose-700">
                Titik B · {journey.to.name}
              </span>
            </p>
        </div>
        <span className="shrink-0 text-sm font-bold tabular-nums">
          {score.toLocaleString('id-ID')}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {phase === 'reveal' ? (
          <div className="space-y-3">
            <StatusIndicator
              state={lastOk ? 'active' : 'down'}
              label={lastOk ? 'Benar!' : 'Belum tepat'}
              size="md"
            />
            <Timeline orientation="vertical" noCards alternating={false} className="w-full">
              {journey.legs.map((leg, i) => (
                <TimelineItem key={`${leg.routeId}-${i}`} hollow={i > 0}>
                  <TimelineItemDate>{i === 0 ? 'Naik dulu' : 'Lanjut lagi'}</TimelineItemDate>
                  <TimelineItemTitle>
                    <RouteBadge
                      code={leg.routeCode}
                      name={leg.routeName}
                      color={leg.routeColor}
                      agency={data.routes[leg.routeId]?.agency}
                      size="sm"
                    />
                  </TimelineItemTitle>
                  <TimelineItemDescription>
                    {leg.fromStopName} → {leg.toStopName}
                    {i === 0 && needsTransfer && journey.transferName
                      ? ` · Transit di ${journey.transferName}`
                      : ''}
                  </TimelineItemDescription>
                </TimelineItem>
              ))}
            </Timeline>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Jawab berurutan. Pilih opsi → jalur preview muncul di peta.
            </p>

            {firstRoute ? (
              <RouteBadge
                code={firstRoute}
                color={routeByCode(data, firstRoute)?.color}
                agency={routeByCode(data, firstRoute)?.agency}
                size="sm"
                showName
              />
            ) : null}

            <Field
              label="1. Naik dulu"
              hint={step === 1 ? 'Pilih rute pertama yang paling cocok' : undefined}
              active={step === 1}
            >
              <Select
                value={firstRoute}
                onValueChange={(v) => {
                  setFirstRoute(v)
                  sound.click()
                }}
              >
                <SelectTrigger className="h-11 w-full bg-background">
                  <SelectValue placeholder="Pilih kode rute" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {routeOptions.map((code) => (
                    <SelectItem key={`f-${code}`} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {needsTransfer ? (
              <>
                <Field
                  label="2. Transit di"
                  hint={!firstRoute ? 'Isi langkah 1 dulu' : step === 2 ? 'Pilih halte transit' : undefined}
                  active={step === 2}
                  locked={!firstRoute}
                >
                  <Select
                    value={transfer}
                    onValueChange={(v) => {
                      setTransfer(v)
                      sound.click()
                    }}
                    disabled={!firstRoute}
                  >
                    <SelectTrigger className="h-11 w-full bg-background">
                      <SelectValue placeholder="Pilih halte transit" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {transferOptions.map((name) => (
                        <SelectItem key={`t-${name}`} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field
                  label="3. Lanjut naik"
                  hint={!transfer ? 'Isi langkah 2 dulu' : step === 3 ? 'Pilih rute lanjutan yang paling cocok' : undefined}
                  active={step === 3}
                  locked={!transfer}
                >
                  <Select
                    value={secondRoute}
                    onValueChange={(v) => {
                      setSecondRoute(v)
                      sound.click()
                    }}
                    disabled={!transfer}
                  >
                    <SelectTrigger className="h-11 w-full bg-background">
                      <SelectValue placeholder="Pilih kode rute" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {routeOptions.map((code) => (
                        <SelectItem key={`s-${code}`} value={code}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </>
            ) : (
              <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                Perjalanan langsung — tanpa transit.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border/60 p-4 space-y-2">
        {phase === 'reveal' ? (
          <Button className="h-11 w-full" onClick={finishOrNext} withArrow>
            {index + 1 >= journeys.length ? 'Lihat skor' : 'Lanjut'}
          </Button>
        ) : (
          <>
            <Button
              className="h-11 w-full font-bold"
              disabled={!canSubmit}
              onClick={submit}
              withArrow
            >
              Tebak
            </Button>
            <Button
              variant="outline"
              className="h-10 w-full gap-2"
              disabled={hintUsed}
              onClick={useHint}
            >
              <Lightbulb className="size-4" />
              {hintUsed ? 'Bantuan sudah dipakai' : 'Bantuan (-75% poin)'}
            </Button>
          </>
        )}
      </div>
    </div>
  )

  const mapPane = (
    <Map
      key={journey.id}
      theme="light"
      center={[(journey.from.lon + journey.to.lon) / 2, (journey.from.lat + journey.to.lat) / 2]}
      zoom={12}
      className="h-full w-full"
    >
      <MapControls showZoom showCompass position="bottom-right" />
      {fitPath.length >= 2 ? <FitRoute path={fitPath} /> : null}
      {previewLines.map((line) =>
        line.path.length >= 2 ? (
          <MapRoute
            key={line.key}
            coordinates={line.path}
            color={line.color}
            width={line.width}
            opacity={line.opacity}
            dashArray={line.dashArray}
            interactive={false}
          />
        ) : null,
      )}

      <MapMarker longitude={journey.from.lon} latitude={journey.from.lat}>
        <MarkerContent>
          <StopPin letter="A" name={journey.from.name} tone="from" />
        </MarkerContent>
      </MapMarker>
      <MapMarker longitude={journey.to.lon} latitude={journey.to.lat}>
        <MarkerContent>
          <StopPin letter="B" name={journey.to.name} tone="to" />
        </MarkerContent>
      </MapMarker>
      {previewTransfer ? (
        <MapMarker longitude={previewTransfer.lon} latitude={previewTransfer.lat}>
          <MarkerContent>
            <StopPin letter="T" name={previewTransfer.name} tone="transfer" />
          </MarkerContent>
        </MapMarker>
      ) : null}
    </Map>
  )

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[#e9ecef]">
      <aside className="absolute inset-x-0 bottom-0 z-20 flex max-h-[52%] flex-col overflow-hidden rounded-t-2xl border border-black/8 bg-white shadow-[0_-8px_28px_rgba(0,0,0,0.12)] lg:static lg:inset-auto lg:z-auto lg:h-full lg:max-h-none lg:w-[380px] lg:shrink-0 lg:rounded-none lg:border-r lg:border-b-0 lg:shadow-[8px_0_24px_rgba(0,0,0,0.06)] xl:w-[420px]">
        {answerPanel}
      </aside>
      <div className="relative min-h-0 min-w-0 flex-1 pb-[min(52%,28rem)] lg:pb-0">{mapPane}</div>
    </div>
  )
}

function Field({
  label,
  hint,
  active,
  locked,
  children,
}: {
  label: string
  hint?: string
  active?: boolean
  locked?: boolean
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'space-y-1.5 rounded-xl border p-3 transition',
        active ? 'border-primary/40 bg-primary/[0.04]' : 'border-transparent bg-transparent',
        locked && 'opacity-45',
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        {hint ? <span className="text-[11px] text-primary">{hint}</span> : null}
      </div>
      {children}
    </div>
  )
}

function StopPin({
  letter,
  name,
  tone,
}: {
  letter: string
  name: string
  tone: 'from' | 'to' | 'transfer'
}) {
  const badge =
    tone === 'from'
      ? 'bg-emerald-500 text-white'
      : tone === 'to'
        ? 'bg-rose-500 text-white'
        : 'bg-amber-400 text-[#1c1f26]'
  const label =
    tone === 'from'
      ? 'border-emerald-200 bg-white text-emerald-800'
      : tone === 'to'
        ? 'border-rose-200 bg-white text-rose-800'
        : 'border-amber-200 bg-white text-amber-900'

  return (
    <div className="flex -translate-y-1 flex-col items-center gap-1">
      <div
        className={cn(
          'max-w-[160px] truncate rounded-md border px-2 py-0.5 text-[11px] font-semibold shadow-md',
          label,
        )}
        title={name}
      >
        {name}
      </div>
      <div
        className={cn(
          'flex size-8 items-center justify-center rounded-full border-2 border-white text-xs font-bold shadow-lg',
          badge,
        )}
      >
        {letter}
      </div>
    </div>
  )
}
