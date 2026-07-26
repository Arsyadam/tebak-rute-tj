import type { Difficulty, GameData, Route, Stop } from '@/types'
import { normalizeStopName } from '@/lib/game'
import { loadRecentJourneys, rememberJourneys } from '@/lib/recent'

export type JourneyLeg = {
  routeId: string
  routeCode: string
  routeName: string
  routeColor: string
  fromStopId: string
  fromStopName: string
  toStopId: string
  toStopName: string
  /** [lng, lat] */
  path: [number, number][]
}

export type Journey = {
  id: string
  from: Stop
  to: Stop
  legs: JourneyLeg[]
  transferName?: string
  transferStopId?: string
}

type IndexedPattern = {
  route: Route
  tripId: string
  stopIds: string[]
  indexOf: Map<string, number>
  nameIndex: Map<string, number>
  nameStopId: Map<string, string>
  shape: [number, number][]
}

function toLngLat(latLon: [number, number]): [number, number] {
  return [latLon[1], latLon[0]]
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

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]!
}

function sliceShape(
  shape: [number, number][],
  fromRatio: number,
  toRatio: number,
): [number, number][] {
  if (shape.length < 2) return shape.map(toLngLat)
  const a = Math.max(0, Math.floor(fromRatio * (shape.length - 1)))
  const b = Math.min(shape.length - 1, Math.ceil(toRatio * (shape.length - 1)))
  const slice = shape.slice(Math.min(a, b), Math.max(a, b) + 1)
  return (slice.length >= 2 ? slice : shape).map(toLngLat)
}

let cachedIndex: { dataRef: GameData; patterns: IndexedPattern[] } | null = null

function buildIndex(data: GameData, difficulty: Difficulty | 'all'): IndexedPattern[] {
  if (cachedIndex?.dataRef !== data) {
    const patterns: IndexedPattern[] = []
    for (const route of Object.values(data.routes)) {
      for (const pattern of route.patterns) {
        if (pattern.stopIds.length < 4) continue
        const indexOf = new Map<string, number>()
        const nameIndex = new Map<string, number>()
        const nameStopId = new Map<string, string>()
        pattern.stopIds.forEach((id, i) => {
          indexOf.set(id, i)
          const stop = data.stops[id]
          if (!stop) return
          const key = normalizeStopName(stop.name)
          if (!key) return
          if (!nameIndex.has(key)) {
            nameIndex.set(key, i)
            nameStopId.set(key, id)
          }
        })
        patterns.push({
          route,
          tripId: pattern.tripId,
          stopIds: pattern.stopIds,
          indexOf,
          nameIndex,
          nameStopId,
          shape: pattern.shape,
        })
      }
    }
    cachedIndex = { dataRef: data, patterns }
  }
  return cachedIndex.patterns.filter(
    (p) => difficulty === 'all' || p.route.difficulty === difficulty,
  )
}

function makeDirect(
  data: GameData,
  pat: IndexedPattern,
  fromId: string,
  toId: string,
): Journey | null {
  const fromIdx = pat.indexOf.get(fromId)
  const toIdx = pat.indexOf.get(toId)
  if (fromIdx == null || toIdx == null || toIdx - fromIdx < 3) return null
  const from = data.stops[fromId]
  const to = data.stops[toId]
  if (!from || !to) return null
  const ratioFrom = fromIdx / Math.max(1, pat.stopIds.length - 1)
  const ratioTo = toIdx / Math.max(1, pat.stopIds.length - 1)
  return {
    id: `dir-${pat.route.id}-${fromId}-${toId}`,
    from,
    to,
    legs: [
      {
        routeId: pat.route.id,
        routeCode: pat.route.code,
        routeName: pat.route.name,
        routeColor: pat.route.color,
        fromStopId: fromId,
        fromStopName: from.name,
        toStopId: toId,
        toStopName: to.name,
        path: sliceShape(pat.shape, ratioFrom, ratioTo),
      },
    ],
  }
}

function makeTransfer(
  data: GameData,
  first: IndexedPattern,
  second: IndexedPattern,
  fromId: string,
  transferKey: string,
  toId: string,
): Journey | null {
  if (first.route.id === second.route.id) return null
  const fromIdx = first.indexOf.get(fromId)
  const tIdx1 = first.nameIndex.get(transferKey)
  const tIdx2 = second.nameIndex.get(transferKey)
  const toIdx = second.indexOf.get(toId)
  if (fromIdx == null || tIdx1 == null || tIdx2 == null || toIdx == null) return null
  if (tIdx1 - fromIdx < 2 || toIdx - tIdx2 < 2) return null

  const transferStopId1 = first.nameStopId.get(transferKey)
  const transferStopId2 = second.nameStopId.get(transferKey)
  if (!transferStopId1 || !transferStopId2) return null

  const from = data.stops[fromId]
  const to = data.stops[toId]
  const transfer = data.stops[transferStopId1]
  if (!from || !to || !transfer) return null

  const r1a = fromIdx / Math.max(1, first.stopIds.length - 1)
  const r1b = tIdx1 / Math.max(1, first.stopIds.length - 1)
  const r2a = tIdx2 / Math.max(1, second.stopIds.length - 1)
  const r2b = toIdx / Math.max(1, second.stopIds.length - 1)

  return {
    id: `x-${first.route.id}-${second.route.id}-${fromId}-${transferKey}-${toId}`,
    from,
    to,
    transferName: transfer.name,
    transferStopId: transferStopId1,
    legs: [
      {
        routeId: first.route.id,
        routeCode: first.route.code,
        routeName: first.route.name,
        routeColor: first.route.color,
        fromStopId: fromId,
        fromStopName: from.name,
        toStopId: transferStopId1,
        toStopName: transfer.name,
        path: sliceShape(first.shape, r1a, r1b),
      },
      {
        routeId: second.route.id,
        routeCode: second.route.code,
        routeName: second.route.name,
        routeColor: second.route.color,
        fromStopId: transferStopId2,
        fromStopName: transfer.name,
        toStopId: toId,
        toStopName: to.name,
        path: sliceShape(second.shape, r2a, r2b),
      },
    ],
  }
}

/** Generate varied A→B journeys (direct + 1-transfer) */
export function pickJourneys(
  data: GameData,
  difficulty: Difficulty | 'all',
  count: number,
  seed = Date.now(),
): Journey[] {
  const rand = mulberry32(seed ^ 0x9e3779b9)
  const patterns = shuffle(buildIndex(data, difficulty), rand)
  if (!patterns.length) return []

  const recent = new Set(loadRecentJourneys())
  const out: Journey[] = []
  const usedPair = new Set<string>()

  const tryAdd = (j: Journey | null, preferFresh: boolean) => {
    if (!j || out.length >= count) return false
    const pair = `${normalizeStopName(j.from.name)}|${normalizeStopName(j.to.name)}`
    if (usedPair.has(pair)) return false
    if (preferFresh && recent.has(j.id) && out.length + 2 < count) return false
    usedPair.add(pair)
    out.push(j)
    return true
  }

  let guard = 0
  while (out.length < count && guard < count * 100) {
    guard++
    const wantTransfer = rand() < 0.65

    if (wantTransfer) {
      const first = pick(patterns, rand)
      if (first.stopIds.length < 6) continue
      const fromPos = Math.floor(rand() * Math.max(1, Math.floor(first.stopIds.length * 0.35)))
      const fromId = first.stopIds[fromPos]!
      const transferCandidates: string[] = []
      for (const [nameKey, idx] of first.nameIndex) {
        if (idx >= fromPos + 2 && idx < first.stopIds.length - 2) transferCandidates.push(nameKey)
      }
      if (!transferCandidates.length) continue
      const tKey = pick(transferCandidates, rand)
      const seconds = patterns.filter(
        (p) => p.route.id !== first.route.id && p.nameIndex.has(tKey),
      )
      if (!seconds.length) continue
      const second = pick(seconds, rand)
      const tIdx2 = second.nameIndex.get(tKey)!
      const after = second.stopIds.slice(tIdx2 + 2)
      if (!after.length) continue
      const toId = pick(after, rand)
      tryAdd(makeTransfer(data, first, second, fromId, tKey, toId), true)
    } else {
      const pat = pick(patterns, rand)
      if (pat.stopIds.length < 6) continue
      const i = Math.floor(rand() * (pat.stopIds.length - 4))
      const span = pat.stopIds.length - i - 3
      const j = i + 3 + Math.floor(rand() * Math.max(1, span))
      tryAdd(makeDirect(data, pat, pat.stopIds[i]!, pat.stopIds[Math.min(j, pat.stopIds.length - 1)]!), true)
    }
  }

  guard = 0
  while (out.length < count && guard < count * 50) {
    guard++
    const pat = pick(patterns, rand)
    if (pat.stopIds.length < 6) continue
    const i = Math.floor(rand() * (pat.stopIds.length - 4))
    const j = i + 3 + Math.floor(rand() * (pat.stopIds.length - i - 3))
    tryAdd(makeDirect(data, pat, pat.stopIds[i]!, pat.stopIds[j]!), false)
  }

  rememberJourneys(out.map((j) => j.id))
  return out
}

export function distractorRoutes(data: GameData, correct: string[], n = 6, seed = Date.now()) {
  const rand = mulberry32(seed)
  const codes = new Set(correct)
  for (const c of shuffle(
    Object.values(data.routes).map((r) => r.code),
    rand,
  )) {
    if (codes.size >= n) break
    codes.add(c)
  }
  return shuffle([...codes], rand)
}

export function distractorStops(data: GameData, correctName: string, n = 6, seed = Date.now()) {
  const rand = mulberry32(seed ^ 12345)
  const names = new Set<string>([correctName])
  for (const name of shuffle(
    Object.values(data.stops)
      .map((s) => s.name)
      .filter(Boolean),
    rand,
  )) {
    if (names.size >= n) break
    names.add(name)
  }
  return shuffle([...names], rand)
}
