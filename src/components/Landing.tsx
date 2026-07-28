import { useEffect, useRef, useState } from 'react'
import { AdSlot } from '@/components/AdSlot'
import TransitGuessrHero from '@/components/landing/transitguessr/TransitGuessrHero'
import GameStartCard from '@/components/landing/GameStartCard'
import LeaderboardCard from '@/components/landing/LeaderboardCard'
import { StartPlayCard, type StartCardStep } from '@/components/landing/StartPlayCard'
import { ROOM_PIN_LENGTH } from '@/components/landing/RoomPinInput'
import type { Difficulty, DifficultyLevel, GameData, GameMode, LeaderboardEntry, PlayStyle } from '@/types'
import { MODE_META } from '@/lib/game'
import { loadLeaderboard } from '@/lib/auth'
import { api } from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'
import { sound } from '@/lib/sound'
import { GameRoom } from '@/lib/multiplayer'
import type { RoomPlayer } from '@/lib/multiplayer'
import { Trophy } from 'lucide-react'

export type StartPayload = {
  mode: GameMode
  difficulty: Difficulty | 'all'
  difficultyLevel: DifficultyLevel
  count: number
  playStyle: PlayStyle
  room: GameRoom | null
  seed: number
}

interface Props {
  data: GameData
  onStart: (payload: StartPayload) => void
}

export function Landing({ data, onStart }: Props) {
  const { user, loading: authLoading, loginGuest, loginEmail, registerEmail, logout } = useAuth()
  const [cardStep, setCardStep] = useState<StartCardStep>('chooser')
  const [authMode, setAuthMode] = useState<'guest' | 'login' | 'register'>('guest')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)

  const [mode, setMode] = useState<GameMode>('name-stops')
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('easy')
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>('gampang')
  const [playStyle, setPlayStyle] = useState<PlayStyle>('solo')
  const [roomCode, setRoomCode] = useState('')
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const autoJoinRef = useRef(false)
  const joinInFlightRef = useRef(false)
  const authInFlightRef = useRef(false)

  useEffect(() => {
    if (user) setCardStep('play')
    else if (cardStep === 'play') setCardStep('chooser')
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps -- sync step when auth changes

  useEffect(() => {
    if (cardStep === 'login') setAuthMode('login')
    else if (cardStep === 'register') setAuthMode('register')
    else if (cardStep === 'guest-name') setAuthMode('guest')
  }, [cardStep])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('room')
    if (code) {
      setRoomCode(code.toUpperCase())
      setPlayStyle('friends')
    }
  }, [])

  useEffect(() => {
    loadLeaderboard()
      .then((list) => setLeaderboard(list || []))
      .catch(() => setLeaderboard([]))
  }, [user])

  useEffect(() => {
    if (!user) {
      setPlayers([])
      autoJoinRef.current = false
      return
    }
    const safeColor = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(user.color) ? user.color : '#12452b'
    setPlayers([{ id: user.id, name: user.name, color: safeColor, score: 0 }])
  }, [user])

  const canPlay = Boolean(user)

  const safeUserColor = (c: string | null | undefined) => {
    if (!c) return '#12452b'
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c) ? c : '#12452b'
  }

  const safeErrorMessage = (err: unknown, fallback: string) => {
    const message = err instanceof Error ? err.message : ''
    const lower = message.toLowerCase()

    if (/(exist|already)/i.test(lower)) return 'Email sudah dipakai. Coba login.'
    if (/(invalid|unauthorized|wrong|credential)/i.test(lower)) return 'Email atau password salah.'
    if (/(min\s*8|password.*8|too\s*short.*8)/i.test(lower)) return 'Password minimal 8 karakter.'
    if (/(kode|room|code)/i.test(lower) && /(invalid|not found|missing)/i.test(lower)) return 'Kode room tidak valid.'

    return fallback
  }

  const submitGuest = async () => {
    if (authInFlightRef.current || authBusy) return
    authInFlightRef.current = true
    setAuthBusy(true)
    setAuthError('')
    try {
      sound.unlock()
      sound.join()
      const nameTrim = name.trim()
      if (!nameTrim) {
        setAuthError('Nama wajib diisi')
        return
      }
      if (nameTrim.length > 24) {
        setAuthError('Nama maksimal 24 karakter')
        return
      }
      await loginGuest(nameTrim)
    } catch (err) {
      setAuthError(safeErrorMessage(err, 'Belum bisa masuk. Coba lagi, ya.'))
    } finally {
      setAuthBusy(false)
      authInFlightRef.current = false
    }
  }

  const submitEmail = async () => {
    if (authInFlightRef.current || authBusy) return
    const trimmedEmail = email.trim()
    const trimmedPassword = password
    const nameTrim = name.trim()

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setAuthError('Email wajib diisi dengan format yang benar')
      return
    }

    if (!trimmedPassword || trimmedPassword.length < 8) {
      setAuthError('Password minimal 8 karakter')
      return
    }

    if (nameTrim.length > 24) {
      setAuthError('Nama maksimal 24 karakter')
      return
    }

    authInFlightRef.current = true
    setAuthBusy(true)
    setAuthError('')
    try {
      sound.unlock()
      sound.join()
      if (authMode === 'register') {
        const fallbackName = trimmedEmail.split('@')[0].slice(0, 24)
        const finalName = nameTrim || fallbackName
        if (!finalName) {
          setAuthError('Nama wajib diisi')
          return
        }
        await registerEmail(trimmedEmail, trimmedPassword, finalName)
      } else {
        await loginEmail(trimmedEmail, trimmedPassword)
      }
    } catch (err) {
      setAuthError(safeErrorMessage(err, 'Belum bisa masuk. Coba lagi, ya.'))
    } finally {
      setAuthBusy(false)
      authInFlightRef.current = false
    }
  }

  const doLogout = async () => {
    if (room) {
      room.destroy()
      setRoom(null)
    }
    await logout()
    setPlayers([])
    setRoomCode('')
    sound.click()
  }

  const googleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || '/api'
    window.location.href = `${apiUrl}/auth/google`
  }

  const startSolo = () => {
    if (!canPlay) return
    sound.unlock()
    onStart({
      mode,
      difficulty,
      difficultyLevel,
      count: 5,
      playStyle: 'solo',
      room: null,
      seed: Date.now(),
    })
  }

  const startFriends = () => {
    if (!room || !room.isHost) return
    sound.unlock()
    room.startGame(Date.now(), mode, difficulty, difficultyLevel)
  }

  const createRoom = async () => {
    if (!user) return
    setBusy(true)
    setStatus('Lagi buat room…')
    try {
      sound.unlock()
      const r = await GameRoom.host(user, mode, difficulty)
      r.onRoster = (ps) => setPlayers(ps.map((p) => ({ ...p, color: safeUserColor(p.color) })))
      r.onStatus = setStatus
      r.onStart = ({ seed, mode: m, difficulty: d, difficultyLevel: dl }) => {
        onStart({
          mode: m as GameMode,
          difficulty: d as Difficulty | 'all',
          difficultyLevel: dl as DifficultyLevel,
          count: 3,
          playStyle: 'friends',
          room: r,
          seed,
        })
      }
      setRoom(r)
      setPlayStyle('friends')
      setStatus(`Kode room: ${r.code}`)
      sound.join()
    } catch (e) {
      setStatus(safeErrorMessage(e, 'Belum bisa buat room. Coba lagi, ya.'))
    } finally {
      setBusy(false)
    }
  }

  const joinRoom = async (codeOverride?: string): Promise<boolean> => {
    const raw = (codeOverride || roomCode).trim().toUpperCase()
    const code = raw.replace(/[^A-Z0-9]/g, '')
    if (!user || !code || joinInFlightRef.current) return false
    if (room?.code === code) return true
    if (room) return false
    if (!/^[A-Z0-9]{5}$/.test(code)) {
      setStatus('Kode room harus 5 karakter (A-Z/0-9)')
      return false
    }
    joinInFlightRef.current = true
    setBusy(true)
    setRoomCode(code)
    setPlayStyle('friends')
    setStatus(`Lagi gabung room ${code}…`)
    try {
      sound.unlock()
      const r = await GameRoom.join(user, code)
      r.onRoster = (ps) => setPlayers(ps.map((p) => ({ ...p, color: safeUserColor(p.color) })))
      r.onStatus = setStatus
      r.onStart = ({ seed, mode: m, difficulty: d, difficultyLevel: dl }) => {
        onStart({
          mode: m as GameMode,
          difficulty: d as Difficulty | 'all',
          difficultyLevel: dl as DifficultyLevel,
          count: 3,
          playStyle: 'friends',
          room: r,
          seed,
        })
      }
      setRoom(r)
      setStatus('Sudah gabung. Menunggu host…')
      sound.join()
      return true
    } catch (e) {
      autoJoinRef.current = false
      setStatus(safeErrorMessage(e, 'Belum bisa gabung room. Coba lagi, ya.'))
      return false
    } finally {
      joinInFlightRef.current = false
      setBusy(false)
    }
  }

  const leaveRoom = async () => {
    if (!room) return
    room.destroy()
    setRoom(null)
    setPlayers(user ? [{ id: user.id, name: user.name, color: safeUserColor(user.color), score: 0 }] : [])
    setStatus('')
    setRoomCode('')
    setPlayStyle('solo')
    autoJoinRef.current = false
    joinInFlightRef.current = false
    sound.click()
  }

  // Deep-link: once authenticated with ?room=CODE, join automatically.
  useEffect(() => {
    if (!user || room || busy || authLoading) return
    if (!roomCode || autoJoinRef.current) return
    const params = new URLSearchParams(window.location.search)
    if (!params.get('room')) return
    autoJoinRef.current = true
    void joinRoom(roomCode)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- join once per auth+deeplink
  }, [user, room, roomCode, busy, authLoading])

  const onPinComplete = async (code: string) => {
    if (code.length !== ROOM_PIN_LENGTH) return
    setRoomCode(code)
    setPlayStyle('friends')
    setPinError(null)
    try {
      await api(`/rooms/${code}`)
    } catch {
      setPinError('Kode tidak ditemukan')
      return
    }
    if (!user) {
      setPinError('Masuk dulu untuk gabung')
      setCardStep('chooser')
      return
    }
    const ok = await joinRoom(code)
    if (!ok) setPinError('Kode tidak ditemukan')
  }

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#ebf4f9] text-[#19483f]">
        Lagi memuat sesi…
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-[#ebf4f9]">
      <TransitGuessrHero
        stickyStartCard={Boolean(user) && playStyle === 'friends'}
        pinValue={roomCode}
        pinError={pinError}
        pinDisabled={busy}
        onPinChange={(code) => {
          setRoomCode(code)
          if (code.length < ROOM_PIN_LENGTH) setPinError(null)
        }}
        onPinComplete={(code) => void onPinComplete(code)}
        onClearPinError={() => setPinError(null)}
        onLoginClick={() => {
          setAuthError('')
          setCardStep(user ? 'play' : 'login')
        }}
        onSignUpClick={() => {
          setAuthError('')
          setCardStep(user ? 'play' : 'register')
        }}
        startCard={
          <GameStartCard>
            <StartPlayCard
              step={user ? 'play' : cardStep}
              setStep={setCardStep}
              user={user}
              routeCount={data.meta.routeCount}
              stopCount={data.meta.stopCount}
              authBusy={authBusy}
              authError={authError}
              name={name}
              setName={setName}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              submitGuest={() => void submitGuest()}
              submitEmail={() => void submitEmail()}
              googleLogin={googleLogin}
              doLogout={() => void doLogout()}
              safeUserColor={safeUserColor}
              playStyle={playStyle}
              setPlayStyle={setPlayStyle}
              mode={mode}
              setMode={setMode}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              difficultyLevel={difficultyLevel}
              setDifficultyLevel={setDifficultyLevel}
              canPlay={canPlay}
              busy={busy}
              roomCode={roomCode}
              setRoomCode={setRoomCode}
              room={room}
              players={players}
              status={status}
              createRoom={() => void createRoom()}
              joinRoom={() => void joinRoom()}
              leaveRoom={() => void leaveRoom()}
              startSolo={startSolo}
              startFriends={startFriends}
            />
          </GameStartCard>
        }
      />

      <section className="relative z-20 mx-auto mt-10 w-full max-w-[1120px] px-4 pb-16 pt-6 sm:mt-14 sm:px-5 sm:pt-8">
        <LeaderboardCard>
          <aside className="space-y-4">
            <div className="rounded-[32px] border border-[rgba(18,69,43,0.10)] bg-white p-6 shadow-[0_18px_40px_rgba(17,24,39,0.10)] sm:p-8">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display flex items-center gap-2 text-2xl font-bold text-[#003324]">
                    <Trophy className="size-5 text-[#f9a01b]" />
                    Leaderboard
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-[#19483f]/75">Skor terbaik global</p>
                </div>
                <p className="text-xs font-semibold text-[#19483f]/55">
                  {data.meta.routeCount} rute {data.meta.stopCount} halte
                </p>
              </div>
              <div className="max-h-80 overflow-auto pr-1">
                {leaderboard.length === 0 ? (
                  <div className="rounded-[24px] bg-[#ffeee6] px-5 py-10 text-center">
                    <p className="font-display text-lg font-bold text-[#003324]">Belum ada skor</p>
                    <p className="mt-1 text-sm font-semibold text-[#19483f]/75">Main dulu, yuk - biar namamu muncul di sini.</p>
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {leaderboard.slice(0, 15).map((e, i) => (
                      <li
                        key={e.id}
                        className="flex items-center gap-3 rounded-[20px] bg-[#ffeee6] px-3.5 py-3"
                      >
                        <span className="flex size-8 items-center justify-center rounded-full bg-white text-sm font-extrabold text-[#108043] shadow-sm">
                          {i + 1}
                        </span>
                        <span className="size-2.5 rounded-full" style={{ background: e.color }} />
                        <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#003324]">{e.name}</span>
                        <span className="hidden text-xs font-semibold text-[#19483f]/70 sm:inline">
                          {MODE_META[e.mode]?.title ?? e.mode}
                        </span>
                        <span className="text-sm font-extrabold tabular-nums text-[#108043]">
                          {e.score.toLocaleString('id-ID')}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <AdSlot
              slot="landing-sidebar"
              format="auto"
              className="min-h-[100px] rounded-[28px] border border-[rgba(18,69,43,0.10)] bg-white p-3 shadow-[0_18px_40px_rgba(17,24,39,0.08)]"
            />
          </aside>
        </LeaderboardCard>
      </section>
    </div>
  )
}

// (ModePicker & DifficultyPicker sudah diganti Select di UI card mulai game.)
