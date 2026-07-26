import { api } from '@/api/client'
import type { GameRoundRecord, LeaderboardEntry, UserProfile } from '@/types'

export async function me(): Promise<{ user: UserProfile }> {
  return api('/auth/me')
}

export async function registerEmail(email: string, password: string, name: string): Promise<{ user: UserProfile }> {
  return api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  })
}

export async function signInEmail(email: string, password: string): Promise<{ user: UserProfile }> {
  return api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function signInGuest(name: string): Promise<{ user: UserProfile }> {
  return api('/auth/guest', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function signOut(): Promise<{ ok: boolean }> {
  return api('/auth/logout', { method: 'POST' })
}

export async function loadLeaderboard(mode?: string): Promise<LeaderboardEntry[]> {
  const qs = mode ? `?mode=${encodeURIComponent(mode)}` : ''
  return api(`/leaderboard${qs}`)
}

export async function pushScore(payload: {
  mode: string
  difficulty: string
  score: number
  playStyle: string
  hintCount: number
  rounds: GameRoundRecord[]
}): Promise<{ id: string }> {
  return api('/games', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
