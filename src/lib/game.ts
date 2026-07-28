import type { Difficulty, GameData, GameMode, Pattern, Route, Stop } from '@/types'
import { loadRecentRoutes, rememberRoutes } from '@/lib/recent'

export const HINT_PENALTY = 0.25

export interface RouteRound {
  id: string
  route: Route
  pattern: Pattern
  /** [lng, lat] */
  path: [number, number][]
  stops: Array<Stop & { sequence: number }>
  center: [number, number]
  zoom: number
}

function mulberry32(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

function toLngLat(latLon: [number, number]): [number, number] {
  return [latLon[1], latLon[0]]
}

function cameraForPath(path: [number, number][]) {
  const lngs = path.map((p) => p[0])
  const lats = path.map((p) => p[1])
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const center: [number, number] = [(minLng + maxLng) / 2, (minLat + maxLat) / 2]
  const span = Math.max(maxLng - minLng, maxLat - minLat)
  let zoom = 12
  if (span > 0.25) zoom = 10
  else if (span > 0.12) zoom = 11
  else if (span > 0.06) zoom = 12
  else if (span > 0.03) zoom = 13
  else zoom = 14
  return { center, zoom }
}

export function listPatterns(data: GameData, difficulty: Difficulty | 'all') {
  const out: Array<{ route: Route; pattern: Pattern }> = []
  for (const route of Object.values(data.routes)) {
    if (difficulty !== 'all' && route.difficulty !== difficulty) continue
    for (const pattern of route.patterns) {
      if (pattern.stopIds.length < 4 || pattern.shape.length < 4) continue
      out.push({ route, pattern })
    }
  }
  return out
}

export function buildRouteRound(
  data: GameData,
  route: Route,
  pattern: Pattern,
): RouteRound | null {
  const path = pattern.shape.map(toLngLat)
  if (path.length < 4) return null
  const stops: RouteRound['stops'] = []
  pattern.stopIds.forEach((id, sequence) => {
    const s = data.stops[id]
    if (!s) return
    stops.push({ ...s, sequence })
  })
  if (stops.length < 4) return null
  const cam = cameraForPath(path)
  return {
    id: `${route.id}-${pattern.tripId}`,
    route,
    pattern,
    path,
    stops,
    center: cam.center,
    zoom: cam.zoom,
  }
}

/**
 * Pick rounds with shuffle + avoid recently played routes (localStorage).
 * Prefers unique route IDs, then unique direction patterns.
 */
export function pickRouteRounds(
  data: GameData,
  difficulty: Difficulty | 'all',
  count: number,
  seed = Date.now(),
): RouteRound[] {
  const rand = mulberry32(seed ^ 0x85ebca6b)
  const patterns = shuffle(listPatterns(data, difficulty), rand)
  if (!patterns.length) return []

  const recent = new Set(loadRecentRoutes())
  const fresh = patterns.filter((p) => !recent.has(p.route.id))
  const pool = fresh.length >= count ? fresh : patterns

  const rounds: RouteRound[] = []
  const usedRoute = new Set<string>()
  const usedPattern = new Set<string>()

  // Pass 1: unique routes only
  for (const ref of pool) {
    if (rounds.length >= count) break
    if (usedRoute.has(ref.route.id)) continue
    const round = buildRouteRound(data, ref.route, ref.pattern)
    if (!round) continue
    usedRoute.add(ref.route.id)
    usedPattern.add(`${ref.route.id}-${ref.pattern.directionId}-${ref.pattern.tripId}`)
    rounds.push(round)
  }

  // Pass 2: allow other directions / patterns if still short
  for (const ref of shuffle(patterns, rand)) {
    if (rounds.length >= count) break
    const key = `${ref.route.id}-${ref.pattern.directionId}-${ref.pattern.tripId}`
    if (usedPattern.has(key)) continue
    const round = buildRouteRound(data, ref.route, ref.pattern)
    if (!round) continue
    usedPattern.add(key)
    rounds.push(round)
  }

  rememberRoutes(rounds.map((r) => r.route.id))
  return rounds
}

export function normalizeStopName(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Fuzzy-ish match: exact normalized, or includes either way with length guard */
export function matchStopName(input: string, stopName: string) {
  const a = normalizeStopName(input)
  const b = normalizeStopName(stopName)
  if (!a || a.length < 3) return false
  if (a === b) return true
  if (b.includes(a) && a.length >= Math.min(6, b.length)) return true
  if (a.includes(b) && b.length >= 5) return true
  const ta = new Set(a.split(' '))
  const tb = b.split(' ')
  const hit = tb.filter((t) => t.length > 2 && ta.has(t)).length
  return hit >= Math.min(2, tb.filter((t) => t.length > 2).length) && hit > 0 && a.length >= 5
}

/** Speed bonus: earlier guesses score more (max 1000) */
export function racePoints(elapsedMs: number, windowMs = 45000) {
  const ratio = Math.min(1, Math.max(0, elapsedMs / windowMs))
  return Math.round(1000 * Math.exp(-2.2 * ratio))
}

export const MODE_META: Record<
  GameMode,
  { title: string; blurb: string; tip: string }
> = {
  'name-stops': {
    title: 'Halte di Rute',
    blurb: 'Lihat rute + titik halte. Ketik nama halte secepat mungkin.',
    tip: 'Multiplayer: siapa duluan nebak dapat poin lebih besar.',
  },
  'guess-route': {
    title: 'Tebak dari jalur',
    blurb: 'Lihat bentuk jalur di peta, lalu pilih kode rutemu.',
    tip: 'Pilih jawaban dari daftar rute.',
  },
  'plan-trip': {
    title: 'Dari A ke B',
    blurb: 'Naik apa, transit di mana, lanjut naik apa.',
    tip: 'Direct atau 1x transit — disusun dari data GTFS.',
  },
}

export const JAKARTA_CENTER: [number, number] = [106.8456, -6.2088]
