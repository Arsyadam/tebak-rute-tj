import type { LeaderboardEntry, UserProfile } from '@/types'

const USER_KEY = 'tj-user'
const LB_KEY = 'tj-leaderboard'

const COLORS = ['#3b82f6', '#2563eb', '#0ea5e9', '#06b6d4', '#6366f1', '#8b5cf6']

function uid() {
  return crypto.randomUUID()
}

export function loadUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as UserProfile) : null
  } catch {
    return null
  }
}

export function saveUser(user: UserProfile) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function signInGuest(name: string): UserProfile {
  const existing = loadUser()
  const trimmed = name.trim().slice(0, 24) || 'Pemain'
  const user: UserProfile = existing
    ? { ...existing, name: trimmed }
    : {
        id: uid(),
        name: trimmed,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
        createdAt: new Date().toISOString(),
      }
  saveUser(user)
  return user
}

export function signOut() {
  localStorage.removeItem(USER_KEY)
}

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LB_KEY)
    const list = raw ? (JSON.parse(raw) as LeaderboardEntry[]) : []
    return list.sort((a, b) => b.score - a.score).slice(0, 50)
  } catch {
    return []
  }
}

export function pushScore(entry: Omit<LeaderboardEntry, 'id' | 'at'>) {
  const list = loadLeaderboard()
  list.push({
    ...entry,
    id: uid(),
    at: new Date().toISOString(),
  })
  list.sort((a, b) => b.score - a.score)
  localStorage.setItem(LB_KEY, JSON.stringify(list.slice(0, 50)))
}
