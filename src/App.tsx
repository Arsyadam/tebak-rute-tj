import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useGameData } from '@/hooks/useGameData'
import { pickRouteRounds } from '@/lib/game'
import { pickJourneys } from '@/lib/journey'
import { pushScore } from '@/lib/auth'
import { sound } from '@/lib/sound'
import { Landing, type StartPayload } from '@/components/Landing'
import { NameStopsGame } from '@/components/NameStopsGame'
import { GuessRouteGame } from '@/components/GuessRouteGame'
import { PlanTripGame } from '@/components/PlanTripGame'
import { Button } from '@/components/ui/button'
import type { RoomPlayer } from '@/lib/multiplayer'
import type { GameResult } from '@/types'

function App() {
  const { data, error, loading } = useGameData()
  const { user } = useAuth()
  const [session, setSession] = useState<StartPayload | null>(null)
  const [players, setPlayers] = useState<RoomPlayer[]>([])

  const rounds = useMemo(() => {
    if (!data || !session) return []
    if (session.mode === 'plan-trip') return []
    return pickRouteRounds(data, session.difficulty, session.count, session.seed)
  }, [data, session])

  const journeys = useMemo(() => {
    if (!data || !session || session.mode !== 'plan-trip') return []
    return pickJourneys(data, session.difficulty, session.count, session.seed)
  }, [data, session])

  useEffect(() => {
    if (!session?.room) {
      setPlayers(user ? [{ id: user.id, name: user.name, color: user.color, score: 0 }] : [])
      return
    }
    const room = session.room
    setPlayers([...room.players.values()])
    room.onRoster = setPlayers
  }, [session, user])

  const finish = async ({ score, rounds, hintCount }: GameResult) => {
    if (user && session) {
      try {
        await pushScore({
          mode: session.mode,
          difficulty: session.difficulty,
          score,
          playStyle: session.playStyle,
          hintCount,
          rounds,
        })
      } catch (err) {
        console.error('Failed to save score', err)
      }
    }
    sound.win()
  }

  const exit = () => {
    if (session?.room) {
      session.room.destroy()
    }
    setSession(null)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#e9ecef] text-[#667085]">
        Memuat peta rute…
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-slate-950 text-white">
        <p className="text-rose-400">{error || 'Data tidak tersedia'}</p>
        <p className="text-sm text-sky-100/50">Jalankan npm run build:data</p>
      </div>
    )
  }

  if (session) {
    const selfId = user?.id ?? 'local'

    if (session.mode === 'plan-trip') {
      if (journeys.length === 0) {
        return (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#e9ecef]">
            <p className="text-[#667085]">Belum ketemu perjalanan untuk filter ini.</p>
            <Button onClick={exit}>Kembali</Button>
          </div>
        )
      }
      return (
        <PlanTripGame
          key={session.seed}
          data={data}
          journeys={journeys}
          onExit={exit}
          onFinished={finish}
        />
      )
    }

    if (session.mode === 'name-stops' && rounds.length > 0) {
      return (
        <NameStopsGame
          key={session.seed}
          rounds={rounds}
          players={players}
          selfId={selfId}
          room={session.room}
          onExit={exit}
          onFinished={finish}
        />
      )
    }

    if (session.mode === 'guess-route' && rounds.length > 0) {
      return (
        <GuessRouteGame
          key={session.seed}
          data={data}
          rounds={rounds}
          onExit={exit}
          onFinished={finish}
        />
      )
    }
  }

  return (
    <Landing
      data={data}
      onStart={(payload) => {
        setSession(payload)
      }}
    />
  )
}

export default App
