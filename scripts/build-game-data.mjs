/**
 * Build compact quiz dataset from Transjakarta GTFS + KRL + MRT + LRT GTFS.
 * TJ: data/gtfs (https://gtfs.transjakarta.co.id/files/file_gtfs.zip)
 * KRL: data/gtfs-krl (generated via npm run build:krl — OSM + corridor order)
 * MRT/LRT: data/gtfs-* (generated via npm run build:rail)
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
const outDir = path.join(root, 'public', 'data')
const outFile = path.join(outDir, 'game-data.json')

const MAX_SHAPE_POINTS = 80

const FEEDS = [
  {
    id: 'tj',
    dir: path.join(root, 'data', 'gtfs'),
    source: 'https://gtfs.transjakarta.co.id/files/file_gtfs.zip',
    required: true,
  },
  {
    id: 'krl',
    dir: path.join(root, 'data', 'gtfs-krl'),
    source: 'generated:KRL Jabodetabek (OSM + corridor order)',
    required: false,
  },
  {
    id: 'mrt',
    dir: path.join(root, 'data', 'gtfs-mrt'),
    source: 'generated:MRT Jakarta (Jakarta GIS + manual coordinates)',
    required: false,
  },
  {
    id: 'lrt-jabodebek',
    dir: path.join(root, 'data', 'gtfs-lrt-jabodebek'),
    source: 'generated:LRT Jabodebek (Jakarta GIS + manual coordinates)',
    required: false,
  },
  {
    id: 'lrt-jabodetabek',
    dir: path.join(root, 'data', 'gtfs-lrt-jabodetabek'),
    source: 'generated:LRT Jabodetabek (OSM relation 10693161)',
    required: false,
  },
]

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
  if (!fs.existsSync(filePath)) return []
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

function difficultyFromDesc(desc, feedId) {
  if (feedId === 'krl' || desc === 'KRL') return 'krl'
  if (feedId === 'mrt') return 'mrt'
  if (feedId === 'lrt-jabodebek') return 'lrt-jabodebek'
  if (feedId === 'lrt-jabodetabek') return 'lrt-jabodetabek'
  if (desc === 'BRT') return 'easy'
  if (desc === 'Angkutan Umum Integrasi' || desc === 'Transjabodetabek') return 'medium'
  return 'hard'
}

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

async function loadFeed(feed) {
  const gtfsDir = feed.dir
  if (!fs.existsSync(path.join(gtfsDir, 'routes.txt'))) {
    if (feed.required) throw new Error(`Missing required GTFS at ${gtfsDir}`)
    console.log(`Skipping optional feed ${feed.id} (not found)`)
    return null
  }

  console.log(`Reading GTFS [${feed.id}]…`)
  const [routes, trips, stops, routeList] = await Promise.all([
    readCsv(path.join(gtfsDir, 'routes.txt')),
    readCsv(path.join(gtfsDir, 'trips.txt')),
    readCsv(path.join(gtfsDir, 'stops.txt')),
    readCsv(path.join(gtfsDir, 'route_list.txt')),
  ])

  if (!routeList.length) {
    console.warn(`Feed ${feed.id}: no route_list.txt — skipping`)
    return null
  }

  const tripById = new Map(trips.map((t) => [t.trip_id, t]))
  const routeById = new Map(routes.map((r) => [r.route_id, r]))

  const stopById = new Map()
  for (const s of stops) {
    const id = feed.id === 'tj' ? s.stop_id : s.stop_id
    stopById.set(id, {
      id,
      name: s.stop_name.trim(),
      lat: Number(s.stop_lat),
      lon: Number(s.stop_lon),
      parent: s.parent_station || null,
      locationType: Number(s.location_type || 0),
    })
  }

  const canonicalTripIds = new Set(routeList.map((r) => r.trip_id))
  console.log(`  Canonical trips: ${canonicalTripIds.size}`)

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

  const neededShapes = new Set()
  for (const tripId of canonicalTripIds) {
    const trip = tripById.get(tripId)
    if (trip?.shape_id) neededShapes.add(trip.shape_id)
  }

  console.log(`  Loading ${neededShapes.size} shapes…`)
  const shapes = new Map()
  {
    const shapesPath = path.join(gtfsDir, 'shapes.txt')
    if (fs.existsSync(shapesPath)) {
      const rl = createInterface({
        input: createReadStream(shapesPath, { encoding: 'utf8' }),
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
  }

  const shapeCoords = new Map()
  for (const [sid, pts] of shapes) {
    pts.sort((a, b) => a.seq - b.seq)
    const coords = downsampleShape(pts.map((p) => [p.lat, p.lon]))
    shapeCoords.set(sid, coords)
  }

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
      stopIds.push(row.stopId)
      usedStopIds.add(row.stopId)
    }
    if (stopIds.length < 3) continue

    const first = stopById.get(stopIds[0])
    const last = stopById.get(stopIds[stopIds.length - 1])
    if (!first || !last) continue

    const routeKey = feed.id === 'tj' ? route.route_id : `${feed.id}:${route.route_id}`

    if (!gameRoutes[routeKey]) {
      gameRoutes[routeKey] = {
        id: routeKey,
        code: route.route_short_name || route.route_id,
        name: route.route_long_name,
        desc: route.route_desc || '',
        agency: feed.id,
        color: `#${(route.route_color || 'E31C23').replace(/^#/, '')}`,
        textColor: `#${(route.route_text_color || 'FFFFFF').replace(/^#/, '')}`,
        difficulty: difficultyFromDesc(route.route_desc || '', feed.id),
        patterns: [],
      }
    }

    const shape = trip.shape_id ? shapeCoords.get(trip.shape_id) || [] : []

    gameRoutes[routeKey].patterns.push({
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

  return {
    feed,
    routes: gameRoutes,
    stops: gameStops,
    patternCount: patterns,
  }
}

async function main() {
  /** @type {Record<string, any>} */
  const gameRoutes = {}
  /** @type {Record<string, any>} */
  const gameStops = {}
  const sources = []
  let patternCount = 0

  for (const feed of FEEDS) {
    const loaded = await loadFeed(feed)
    if (!loaded) continue
    sources.push(loaded.feed.source)
    Object.assign(gameRoutes, loaded.routes)
    Object.assign(gameStops, loaded.stops)
    patternCount += loaded.patternCount
  }

  const payload = {
    meta: {
      source: sources.join(' + '),
      builtAt: new Date().toISOString(),
      routeCount: Object.keys(gameRoutes).length,
      patternCount,
      stopCount: Object.keys(gameStops).length,
      agencies: [...new Set(Object.values(gameRoutes).map((r) => r.agency))],
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
  console.log(`  Agencies: ${payload.meta.agencies.join(', ')}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
