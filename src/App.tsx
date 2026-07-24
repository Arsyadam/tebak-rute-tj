import { useEffect, useMemo, useState } from 'react'
import type { UserProfile } from '@/types'
import { useGameData } from '@/hooks/useGameData'
import { pickRouteRounds } from '@/lib/game'
import { loadUser, pushScore } from '@/lib/auth'
import { sound } from '@/lib/sound'
import { Landing, type StartPayload } from '@/components/Landing'
import { NameStopsGame } from '@/components/NameStopsGame'
import { GuessRouteGame } from '@/components/GuessRouteGame'
import type { RoomPlayer } from '@/lib/multiplayer'

function App() {
  const { data, error, loading } = useGameData()
  const [session, setSession] = useState<StartPayload | null>(null)
  const [user] = useState<UserProfile | null>(() => loadUser())
  const [players, setPlayers] = useState<RoomPlayer[]>([])

  const rounds = useMemo(() => {
    if (!data || !session) return []
    return pickRouteRounds(data, session.difficulty, session.count, session.seed)
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
      // keep room alive only if they want rematch — destroy for simplicity
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

  if (session && rounds.length > 0) {
    const selfId = loadUser()?.id ?? user?.id ?? 'local'
    if (session.mode === 'name-stops') {
      return (
        <NameStopsGame
          key={session.seed}
          rounds={rounds}
          players={players}
          selfId={selfId}
          room={session.room}
          onExit={exit}
          onFinished={(score) => {
            finish(score)
          }}
        />
      )
    }
    return (
      <GuessRouteGame
        key={session.seed}
        data={data}
        rounds={rounds}
        onExit={exit}
        onFinished={(score) => {
          finish(score)
        }}
      />
    )
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
