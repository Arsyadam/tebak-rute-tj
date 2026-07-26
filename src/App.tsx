import { useEffect, useMemo, useState } from 'react'
import type { UserProfile } from '@/types'
import { useGameData } from '@/hooks/useGameData'
import { pickRouteRounds } from '@/lib/game'
import { pickJourneys } from '@/lib/journey'
import { loadUser, pushScore } from '@/lib/auth'
import { sound } from '@/lib/sound'
import { Landing, type StartPayload } from '@/components/Landing'
import { NameStopsGame } from '@/components/NameStopsGame'
import { GuessRouteGame } from '@/components/GuessRouteGame'
import { PlanTripGame } from '@/components/PlanTripGame'
import { Button } from '@/components/ui/button'
import type { RoomPlayer } from '@/lib/multiplayer'

function App() {
  const { data, error, loading } = useGameData()
  const [session, setSession] = useState<StartPayload | null>(null)
  const [user] = useState<UserProfile | null>(() => loadUser())
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
      const u = loadUser()
      setPlayers(u ? [{ id: u.id, name: u.name, color: u.color, score: 0 }] : [])
      return
    }
    const room = session.room
    setPlayers([...room.players.values()])
    room.onRoster = setPlayers
  }, [session])

  const finish = (score: number) => {
    const u = loadUser()
    if (u && session) {
      pushScore({
        name: u.name,
        color: u.color,
        score,
        mode: session.mode,
        playStyle: session.playStyle,
      })
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
        Memuat GTFS…
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
    const selfId = loadUser()?.id ?? user?.id ?? 'local'

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
          onFinished={(score) => finish(score)}
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
          onFinished={(score) => finish(score)}
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
          onFinished={(score) => finish(score)}
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
