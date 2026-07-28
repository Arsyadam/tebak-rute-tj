import { useMemo, useRef, useState } from 'react'
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
  difficultyLevel: _difficultyLevel,
  onExit,
  onFinished,
}: Props) {
  const [index, setIndex] = useState(0)
  const [choice, setChoice] = useState<string>('')
  const [phase, setPhase] = useState<'play' | 'reveal' | 'done'>('play')
  const [score, setScore] = useState(0)
  const [lastOk, setLastOk] = useState(false)
  const scoreRef = useRef(0)
  const roundRecordsRef = useRef<GameRoundRecord[]>([])

  const round = rounds[index]
  const routeColor = round?.route.color || '#108043'

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
        Tidak ada rute.
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
                    Jalur ini rute apa?
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
                      lastOk ? 'text-[#108043]' : 'text-rose-500',
                    )}
                  >
                    {lastOk ? 'Benar!' : 'Belum tepat'}
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
                {index + 1 >= rounds.length ? 'Lihat skor' : 'Lanjut'}
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
                  Tebak
                </Button>
              </>
            )}
          </HudBlock>
        </div>
      </GameHudShell>
    </div>
  )
}
