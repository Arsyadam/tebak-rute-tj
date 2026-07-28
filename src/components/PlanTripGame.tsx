import { useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Map,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
} from '@/components/ui/map'
import { Button } from '@/components/ui/button'
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
import type { DifficultyLevel, GameData, Route } from '@/types'
import {
  distractorRoutes,
  distractorStops,
  type Journey,
} from '@/lib/journey'
import { sound } from '@/lib/sound'
import { cn } from '@/lib/utils'
import { ArrowRight, LogOut } from 'lucide-react'
import type { GameRoundRecord, GameResult } from '@/types'
import { GameHudShell, HudBlock, gameHud } from '@/components/game/GameHud'

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
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#ebf4f9] text-[#003324]">
        <p className="text-sm font-bold tracking-[0.18em] text-[#19483f] uppercase">Selesai</p>
        <h2 className="font-display text-5xl font-bold">{score.toLocaleString('id-ID')}</h2>
        <Button onClick={onExit} className="rounded-full bg-[#108043] px-6 font-bold text-white hover:bg-[#12452b]">
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

    const correctAnswer = needsTransfer
      ? `${leg1.routeCode} → ${journey.transferName ?? ''} → ${journey.legs[1]?.routeCode ?? ''}`
      : leg1.routeCode

    roundsRef.current.push({
      roundIndex: index,
      correctAnswer,
      score: points,
      hintUsed: false,
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

  const finishOrNext = () => {
    if (index + 1 >= journeys.length) {
      setPhase('done')
      sound.win()
      onFinished({
        score: scoreRef.current,
        hintCount: 0,
        rounds: roundsRef.current,
      })
      return
    }
    setIndex((i) => i + 1)
    setFirstRoute('')
    setTransfer('')
    setSecondRoute('')
    setPhase('play')
    sound.click()
  }

  const canSubmit =
    Boolean(firstRoute) && (!needsTransfer || (Boolean(transfer) && Boolean(secondRoute)))

  const step = !firstRoute ? 1 : needsTransfer && !transfer ? 2 : needsTransfer && !secondRoute ? 3 : 4

  const answerPanel = (
    <div className={cn(gameHud.panel, 'flex max-h-[min(70vh,36rem)] w-[min(100%,24rem)] flex-col overflow-hidden')}>
      <div className="shrink-0 space-y-2 border-b border-[rgba(18,69,43,0.12)] p-3.5 sm:p-4">
        <div className="flex items-center gap-3">
          <div className={gameHud.badge}>{index + 1}</div>
          <div className="min-w-0 flex-1">
            <p className={cn('text-[11px] font-bold uppercase tracking-wide', gameHud.muted)}>
              Ronde {index + 1}/{journeys.length} · {needsTransfer ? '1x transit' : 'Direct'}
            </p>
            <h1 className="font-display text-lg font-bold leading-tight text-[#003324] sm:text-xl">
              Dari A ke B, naik apa?
            </h1>
          </div>
        </div>
        <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          <span className="rounded-full bg-[#108043] px-2 py-0.5 text-white">A · {journey.from.name}</span>
          <ArrowRight className={cn('size-3.5 shrink-0', gameHud.muted)} />
          <span className="rounded-full bg-[#F9A01B] px-2 py-0.5 text-[#003324]">B · {journey.to.name}</span>
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3.5 sm:p-4">
        {phase === 'reveal' ? (
          <div className="space-y-3">
            <p className={cn('font-display text-xl font-bold', lastOk ? 'text-[#108043]' : 'text-rose-500')}>
              {lastOk ? 'Benar!' : 'Belum tepat'}
            </p>
            <Timeline orientation="vertical" noCards alternating={false} className="w-full text-[#003324]">
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
          <div className="space-y-3">
            <p className={cn('text-xs font-medium leading-relaxed', gameHud.muted)}>
              Jawab berurutan. Pilih opsi, jalur preview muncul di peta.
            </p>

            <Field
              label="1. Naik dulu"
              hint={step === 1 ? 'Pilih rute pertama' : undefined}
              active={step === 1}
            >
              <Select
                value={firstRoute}
                onValueChange={(v) => {
                  setFirstRoute(v)
                  sound.click()
                }}
              >
                <SelectTrigger className={cn(gameHud.input, 'w-full')}>
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
                    <SelectTrigger className={cn(gameHud.input, 'w-full')}>
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
                  hint={!transfer ? 'Isi langkah 2 dulu' : step === 3 ? 'Pilih rute lanjutan' : undefined}
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
                    <SelectTrigger className={cn(gameHud.input, 'w-full')}>
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
              <p className={cn('rounded-xl bg-[#EBF4F9] px-3 py-2 text-xs font-semibold', gameHud.muted)}>
                Perjalanan langsung - tanpa transit.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-[rgba(18,69,43,0.12)] p-3">
        {phase === 'reveal' ? (
          <Button className={cn(gameHud.cta, 'w-full')} onClick={finishOrNext}>
            {index + 1 >= journeys.length ? 'Lihat skor' : 'Lanjut'}
          </Button>
        ) : (
          <Button className={cn(gameHud.cta, 'w-full')} disabled={!canSubmit} onClick={submit}>
            Tebak
          </Button>
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
    <div className="relative h-full w-full overflow-hidden bg-[#ebf4f9]">
      {mapPane}
      <GameHudShell>
        <div className="flex items-start justify-between gap-3">
          <HudBlock>{answerPanel}</HudBlock>
          <div className="flex items-center gap-2">
            <HudBlock className={cn(gameHud.pill, 'min-w-[5rem] tabular-nums')}>
              <span className={cn('mr-1 text-[10px] font-bold uppercase tracking-wide', gameHud.muted)}>
                Poin
              </span>
              {score.toLocaleString('id-ID')}
            </HudBlock>
            <HudBlock>
              <Button size="icon" aria-label="Keluar" className={gameHud.iconBtn} onClick={onExit}>
                <LogOut className="size-5" />
              </Button>
            </HudBlock>
          </div>
        </div>
        <div />
      </GameHudShell>
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
        'space-y-1.5 rounded-2xl border p-2.5 transition',
        active ? 'border-[#F9A01B] bg-[#FFF6E8]' : 'border-[rgba(18,69,43,0.12)] bg-[#EBF4F9]',
        locked && 'opacity-45',
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-bold tracking-wide text-[#003324] uppercase">{label}</span>
        {hint ? <span className="text-[11px] font-semibold text-[#FF6B00]">{hint}</span> : null}
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
