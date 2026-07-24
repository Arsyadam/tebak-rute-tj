/**
 * Build compact quiz dataset from Transjakarta GTFS.
 * Source of truth: data/gtfs (official https://gtfs.transjakarta.co.id/files/file_gtfs.zip)
 *
 * Uses route_list.txt for canonical trip per route+direction.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const gtfsDir = path.join(root, 'data', 'gtfs')
const outDir = path.join(root, 'public', 'data')
const outFile = path.join(outDir, 'game-data.json')

const MAX_SHAPE_POINTS = 80

function parseCsvLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (c === '"') {
        inQuotes = false
      } else {
        cur += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      out.push(cur)
      cur = ''
    } else {
      cur += c
    }
  }
  out.push(cur)
  return out
}

async function readCsv(filePath) {
  const rl = createInterface({
    input: createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })
  let headers = null
  const rows = []
  for await (const raw of rl) {
    const line = raw.replace(/^\uFEFF/, '')
    if (!line.trim()) continue
    const cols = parseCsvLine(line)
    if (!headers) {
      headers = cols
      continue
    }
    const row = {}
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? ''
    })
    rows.push(row)
  }
  return rows
}

function difficultyFromDesc(desc) {
  if (desc === 'BRT') return 'easy'
  if (desc === 'Angkutan Umum Integrasi' || desc === 'Transjabodetabek') return 'medium'
  return 'hard'
}

/** Ramer–Douglas–Peucker simplification in lat/lon degrees */
function simplifyRdp(points, epsilon) {
  if (points.length <= 2) return points

  const sq = (n) => n * n
  const segDist = (p, a, b) => {
    let x = a[0]
    let y = a[1]
    let dx = b[0] - x
    let dy = b[1] - y
    if (dx !== 0 || dy !== 0) {
      const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy)
      if (t > 1) {
        x = b[0]
        y = b[1]
      } else if (t > 0) {
        x += dx * t
        y += dy * t
      }
    }
    return sq(p[0] - x) + sq(p[1] - y)
  }

  const recurse = (pts) => {
    if (pts.length <= 2) return pts
    let maxDist = 0
    let idx = 0
    const a = pts[0]
    const b = pts[pts.length - 1]
    for (let i = 1; i < pts.length - 1; i++) {
      const d = segDist(pts[i], a, b)
      if (d > maxDist) {
        maxDist = d
        idx = i
      }
    }
    if (maxDist > epsilon * epsilon) {
      const left = recurse(pts.slice(0, idx + 1))
      const right = recurse(pts.slice(idx))
      return left.slice(0, -1).concat(right)
    }
    return [a, b]
  }

  return recurse(points)
}

function downsampleShape(points) {
  if (points.length <= MAX_SHAPE_POINTS) return points
  // ~50–80m tolerance in degrees (~0.0005 ≈ 55m near equator)
  let epsilon = 0.0004
  let simplified = simplifyRdp(points, epsilon)
  while (simplified.length > MAX_SHAPE_POINTS && epsilon < 0.01) {
    epsilon *= 1.4
    simplified = simplifyRdp(points, epsilon)
  }
  if (simplified.length > MAX_SHAPE_POINTS) {
    const step = Math.ceil(simplified.length / MAX_SHAPE_POINTS)
    const forced = []
    for (let i = 0; i < simplified.length; i += step) forced.push(simplified[i])
    const last = simplified[simplified.length - 1]
    if (forced[forced.length - 1] !== last) forced.push(last)
    return forced
  }
  return simplified
}

async function main() {
  console.log('Reading GTFS…')
  const [routes, trips, stops, routeList] = await Promise.all([
    readCsv(path.join(gtfsDir, 'routes.txt')),
    readCsv(path.join(gtfsDir, 'trips.txt')),
    readCsv(path.join(gtfsDir, 'stops.txt')),
    readCsv(path.join(gtfsDir, 'route_list.txt')),
  ])

  const tripById = new Map(trips.map((t) => [t.trip_id, t]))
  const routeById = new Map(routes.map((r) => [r.route_id, r]))

  // Only boarding stops (location_type 0) for quiz names; keep stations too for coords
  const stopById = new Map()
  for (const s of stops) {
    stopById.set(s.stop_id, {
      id: s.stop_id,
      name: s.stop_name.trim(),
      lat: Number(s.stop_lat),
      lon: Number(s.stop_lon),
      parent: s.parent_station || null,
      locationType: Number(s.location_type || 0),
    })
  }

  const canonicalTripIds = new Set(routeList.map((r) => r.trip_id))
  console.log(`Canonical trips from route_list: ${canonicalTripIds.size}`)

  // Load stop_times only for canonical trips
  const stopsByTrip = new Map()
  {
    const rl = createInterface({
      input: createReadStream(path.join(gtfsDir, 'stop_times.txt'), { encoding: 'utf8' }),
      crlfDelay: Infinity,
    })
    let headers = null
    let idxTrip = 0
    let idxSeq = 1
    let idxStop = 2
    for await (const raw of rl) {
      const line = raw.replace(/^\uFEFF/, '')
      if (!line.trim()) continue
      const cols = parseCsvLine(line)
      if (!headers) {
        headers = cols
        idxTrip = headers.indexOf('trip_id')
        idxSeq = headers.indexOf('stop_sequence')
        idxStop = headers.indexOf('stop_id')
        continue
      }
      const tripId = cols[idxTrip]
      if (!canonicalTripIds.has(tripId)) continue
      if (!stopsByTrip.has(tripId)) stopsByTrip.set(tripId, [])
      stopsByTrip.get(tripId).push({
        seq: Number(cols[idxSeq]),
        stopId: cols[idxStop],
      })
    }
  }

  for (const [, arr] of stopsByTrip) {
    arr.sort((a, b) => a.seq - b.seq)
  }

  // Collect needed shape ids
  const neededShapes = new Set()
  for (const tripId of canonicalTripIds) {
    const trip = tripById.get(tripId)
    if (trip?.shape_id) neededShapes.add(trip.shape_id)
  }

  console.log(`Loading ${neededShapes.size} shapes…`)
  const shapes = new Map()
  {
    const rl = createInterface({
      input: createReadStream(path.join(gtfsDir, 'shapes.txt'), { encoding: 'utf8' }),
      crlfDelay: Infinity,
    })
    let headers = null
    let iId = 0
    let iSeq = 1
    let iLat = 2
    let iLon = 3
    for await (const raw of rl) {
      const line = raw.replace(/^\uFEFF/, '')
      if (!line.trim()) continue
      const cols = parseCsvLine(line)
      if (!headers) {
        headers = cols
        iId = headers.indexOf('shape_id')
        iSeq = headers.indexOf('shape_pt_sequence')
        iLat = headers.indexOf('shape_pt_lat')
        iLon = headers.indexOf('shape_pt_lon')
        continue
      }
      const sid = cols[iId]
      if (!neededShapes.has(sid)) continue
      if (!shapes.has(sid)) shapes.set(sid, [])
      shapes.get(sid).push({
        seq: Number(cols[iSeq]),
        lat: Number(cols[iLat]),
        lon: Number(cols[iLon]),
      })
    }
  }

  const shapeCoords = new Map()
  for (const [sid, pts] of shapes) {
    pts.sort((a, b) => a.seq - b.seq)
    const coords = downsampleShape(pts.map((p) => [p.lat, p.lon]))
    shapeCoords.set(sid, coords)
  }

  /** @type {Record<string, any>} */
  const gameRoutes = {}
  const usedStopIds = new Set()
  let patterns = 0

  for (const entry of routeList) {
    const route = routeById.get(entry.route_id)
    const trip = tripById.get(entry.trip_id)
    if (!route || !trip) continue

    const stopRows = stopsByTrip.get(entry.trip_id) || []
    if (stopRows.length < 3) continue

    const stopIds = []
    for (const row of stopRows) {
      const stop = stopById.get(row.stopId)
      if (!stop || !stop.name) continue
      // Prefer physical stops; skip parent stations if sequence already has children
      stopIds.push(row.stopId)
      usedStopIds.add(row.stopId)
    }
    if (stopIds.length < 3) continue

    const first = stopById.get(stopIds[0])
    const last = stopById.get(stopIds[stopIds.length - 1])
    if (!first || !last) continue

    if (!gameRoutes[route.route_id]) {
      gameRoutes[route.route_id] = {
        id: route.route_id,
        code: route.route_short_name || route.route_id,
        name: route.route_long_name,
        desc: route.route_desc || '',
        color: `#${(route.route_color || 'E31C23').replace(/^#/, '')}`,
        textColor: `#${(route.route_text_color || 'FFFFFF').replace(/^#/, '')}`,
        difficulty: difficultyFromDesc(route.route_desc || ''),
        patterns: [],
      }
    }

    const shape = trip.shape_id ? shapeCoords.get(trip.shape_id) || [] : []

    gameRoutes[route.route_id].patterns.push({
      tripId: entry.trip_id,
      directionId: Number(entry.direction_id || 0),
      headsign: entry.stop_headsign || trip.trip_headsign || '',
      startStopId: stopIds[0],
      endStopId: stopIds[stopIds.length - 1],
      startName: first.name,
      endName: last.name,
      stopIds,
      shape,
    })
    patterns++
  }

  // Deduplicate near-identical patterns (same stop sequence)
  for (const route of Object.values(gameRoutes)) {
    const seen = new Set()
    route.patterns = route.patterns.filter((p) => {
      const key = `${p.directionId}|${p.stopIds.join(',')}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  const gameStops = {}
  for (const id of usedStopIds) {
    const s = stopById.get(id)
    if (!s) continue
    gameStops[id] = { id: s.id, name: s.name, lat: s.lat, lon: s.lon }
  }

  const payload = {
    meta: {
      source: 'https://gtfs.transjakarta.co.id/files/file_gtfs.zip',
      builtAt: new Date().toISOString(),
      routeCount: Object.keys(gameRoutes).length,
      patternCount: patterns,
      stopCount: Object.keys(gameStops).length,
    },
    routes: gameRoutes,
    stops: gameStops,
  }

  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(outFile, JSON.stringify(payload))
  const mb = (fs.statSync(outFile).size / (1024 * 1024)).toFixed(2)
  console.log(
    `Wrote ${outFile} (${mb} MB) — ${payload.meta.routeCount} routes, ${payload.meta.patternCount} patterns, ${payload.meta.stopCount} stops`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
