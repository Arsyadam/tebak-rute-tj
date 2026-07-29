import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import type { DifficultyLevel, GameData } from '@/types'
import { type RouteRound } from '@/lib/game'
import { sound } from '@/lib/sound'
import { cn } from '@/lib/utils'
import { LogOut } from 'lucide-react'
import type { GameResult, GameRoundRecord } from '@/types'
import { GameHudShell, HudBlock, HudTopBar, gameHud } from '@/components/game/GameHud'
import { hasHardTimer, shouldHideMapLabels, useCountdown } from '@/hooks/useCountdown'

interface Props {
  data: GameData
  rounds: RouteRound[]
  difficultyLevel?: DifficultyLevel
  onExit: () => void
  onFinished: (result: GameResult) => void
}

export function GuessRouteGame({
  data,
  rounds,
  difficultyLevel = 'gampang',
  onExit,
  onFinished,
}: Props) {
  const hard = hasHardTimer(difficultyLevel)
  const hideLabels = shouldHideMapLabels(difficultyLevel)

  const [index, setIndex] = useState(0)
  const [choice, setChoice] = useState<string>('')
  const [phase, setPhase] = useState<'play' | 'reveal' | 'done'>('play')
  const [score, setScore] = useState(0)
  const [lastOk, setLastOk] = useState(false)
  const [failReason, setFailReason] = useState<'wrong' | 'timeout' | null>(null)
  const scoreRef = useRef(0)
  const roundRecordsRef = useRef<GameRoundRecord[]>([])

  const round = rounds[index]
  const routeColor = round?.route.color || '#108043'
  const playing = phase === 'play'

  const failRound = useCallback(() => {
    if (!round || phase !== 'play') return
    roundRecordsRef.current.push({
      roundIndex: index,
      correctAnswer: round.route.code,
      score: 0,
      hintUsed: false,
    })
    setLastOk(false)
    setFailReason('timeout')
    setPhase('reveal')
  }, [round, phase, index])

  const countdown = useCountdown({
    enabled: hard && phase !== 'done',
    onTimeout: failRound,
    paused: !playing,
  })
  const resetCountdown = countdown.reset

  useEffect(() => {
    if (hard && phase === 'play') resetCountdown()
  }, [index, hard, phase, resetCountdown])

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
      <div className="flex h-full items-center justify-center gap-3 bg-[#ebf4f9] text-[#003324]">
        Belum ada rute nih.
        <Button onClick={onExit}>Keluar</Button>
      </div>
    )
  }

  if (phase === 'done') {
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

  const submit = () => {
    if (!choice || phase !== 'play') return
    sound.guess()
    const ok = choice === round.route.code
    const points = ok ? 1000 : 0
    roundRecordsRef.current.push({
      roundIndex: index,
      correctAnswer: round.route.code,
      score: points,
      hintUsed: false,
    })
    setLastOk(ok)
    setFailReason(ok ? null : 'wrong')
    if (points > 0) {
      const next = scoreRef.current + points
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
      onFinished({
        score: scoreRef.current,
        hintCount: 0,
        rounds: roundRecordsRef.current,
      })
      return
    }
    setIndex((i) => i + 1)
    setChoice('')
    setFailReason(null)
    setPhase('play')
    sound.click()
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#ebf4f9]">
      <Map
        key={round.id}
        theme="light"
        center={round.center}
        zoom={round.zoom}
        className="h-full w-full"
        hideLabels={hideLabels && phase === 'play'}
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
                style={{ background: phase === 'reveal' ? routeColor : '#003324' }}
              />
            </MarkerContent>
          </MapMarker>
        ))}
      </Map>

      <GameHudShell>
        <HudTopBar
          left={
            <HudBlock className={cn(gameHud.panel, 'w-[min(100%,22rem)] p-3.5 sm:p-4')}>
              <div className="flex items-center gap-3">
                <div className={gameHud.badge}>{index + 1}</div>
                <div className="min-w-0 flex-1">
                  <p className={cn('text-[11px] font-bold uppercase tracking-wide', gameHud.muted)}>
                    Ronde {index + 1}/{rounds.length}
                  </p>
                  <h1 className="font-display text-lg font-bold leading-tight text-[#003324] sm:text-xl">
                    Jalur ini rute apa, nih?
                  </h1>
                  <p className={cn('mt-0.5 text-xs font-semibold', gameHud.muted)}>
                    Pilih kode rute yang paling cocok.
                  </p>
                </div>
              </div>
              {phase === 'reveal' ? (
                <div className="mt-3 space-y-2">
                  <p
                    className={cn(
                      'font-display text-xl font-bold',
                      lastOk ? 'text-[#108043]' : 'text-[#E4002B]',
                    )}
                  >
                    {lastOk
                      ? 'Bener banget!'
                      : failReason === 'timeout'
                        ? 'Waktu habis — gagal!'
                        : 'Hmm, belum pas…'}
                  </p>
                  <RouteBadge
                    code={round.route.code}
                    name={round.route.name}
                    color={routeColor}
                    agency={round.route.agency}
                    size="md"
                    showName
                  />
                </div>
              ) : null}
            </HudBlock>
          }
          center={
            hard ? (
              <HudBlock className={countdown.isUrgent ? gameHud.timerDanger : gameHud.timer}>
                {countdown.label}
              </HudBlock>
            ) : undefined
          }
          right={
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
          }
        />

        <div className="flex justify-center">
          <HudBlock className={cn(gameHud.panel, 'w-[min(100%,28rem)] space-y-2 p-3')}>
            {phase === 'reveal' ? (
              <Button className={cn(gameHud.cta, 'w-full')} onClick={finishOrNext}>
                {index + 1 >= rounds.length ? 'Lihat skor' : 'Lanjut yuk'}
              </Button>
            ) : (
              <>
                <Select value={choice} onValueChange={setChoice}>
                  <SelectTrigger className={cn(gameHud.input, 'w-full')}>
                    <SelectValue placeholder="Pilih kode rute" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {options.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                        {routeByCode.get(code) ? ` - ${routeByCode.get(code)}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className={cn(gameHud.cta, 'w-full')} disabled={!choice} onClick={submit}>
                  Tebak yuk
                </Button>
              </>
            )}
          </HudBlock>
        </div>
      </GameHudShell>
    </div>
  )
}
