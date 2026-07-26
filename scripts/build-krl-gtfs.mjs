/**
 * Build a minimal GTFS for KRL Jabodetabek from:
 * - station list (comuline / official codes)
 * - coordinates (OpenStreetMap)
 * - corridor stop order (KAI Commuter map)
 *
 * Not an official GTFS — for game geometry & stop names only.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const krlDir = path.join(root, 'data', 'krl')
const outDir = path.join(root, 'data', 'gtfs-krl')

const ALIASES = {
  'JURANG MANGU': ['Jurangmangu', 'Jurang Mangu'],
  'PARUNG PANJANG': ['Parungpanjang', 'Parung Panjang'],
  'TANJUNG PRIOK': ['Tanjung Priuk', 'Tanjung Priok'],
  'UNIV. INDONESIA': ['Universitas Indonesia'],
  'UNIV. PANCASILA': ['Universitas Pancasila'],
  'SUDIRMAN BARU': ['BNI City', 'Sudirman Baru'],
  'RANGKASBITUNG': ['Rangkasbitung'],
  'RAWA BUNTU': ['Rawa Buntu', 'Rawabuntu'],
  'BOJONGGEDE': ['Bojong Gede', 'Bojonggede'],
  'METLAND TELAGAMURNI': ['Metland Telaga Murni', 'Telaga Murni', 'Metland Telagamurni'],
  'GANG SENTIONG': ['Gang Sentiong'],
  'PONDOK RAJEG': ['Pondok Rajeg'],
}

/** Manual coords when OSM match fails (approx station position) */
const MANUAL = {
  RANGKASBITUNG: [-6.3525, 106.2517],
  'SUDIRMAN BARU': [-6.2016, 106.8197],
  'JURANG MANGU': [-6.2886, 106.7291],
  'PARUNG PANJANG': [-6.3443, 106.5698],
  'TANJUNG PRIOK': [-6.1107, 106.8815],
  'UNIV. INDONESIA': [-6.3604, 106.8318],
  'UNIV. PANCASILA': [-6.3393, 106.8343],
}

/**
 * Corridor patterns — station codes from KAI / comuline.
 * Only Jabodetabek lines (skip Yogya / Merak lokal).
 */
const LINES = [
  {
    id: 'KRL-BOGOR',
    code: 'Red',
    shapeKey: 'BOO',
    name: 'Red Line · Jakarta Kota–Bogor',
    desc: 'KRL',
    color: 'DA251D',
    text: 'FFFFFF',
    // Jakarta Kota → Bogor
    stops: [
      'JAKK',
      'JAY',
      'MGB',
      'SW',
      'JUA',
      'GDD',
      'CKI',
      'MRI',
      'TEB',
      'CW',
      'DRN',
      'PSMB',
      'PSM',
      'TNT',
      'LNA',
      'UP',
      'UI',
      'POC',
      'DPB',
      'DP',
      'CTA',
      'BJD',
      'CLT',
      'BOO',
    ],
  },
  {
    id: 'KRL-NAMBO',
    code: 'Red Nambo',
    shapeKey: 'NMO',
    name: 'Red Line · Citayam–Nambo',
    desc: 'KRL',
    color: 'DA251D',
    text: 'FFFFFF',
    stops: ['CTA', 'PDRG', 'CBN', 'NMO'],
  },
  {
    id: 'KRL-CIKARANG',
    code: 'Blue',
    shapeKey: 'CKR',
    name: 'Blue Line · Jakarta Kota–Cikarang',
    desc: 'KRL',
    color: '1A4C8B',
    text: 'FFFFFF',
    stops: [
      'JAKK',
      'KPB',
      'RJW',
      'KMO',
      'PSE',
      'GST',
      'KMT',
      'JNG',
      'KLD',
      'BUA',
      'KLDB',
      'CUK',
      'KRI',
      'BKS',
      'BKST',
      'TB',
      'CIT',
      'TLM',
      'CKR',
    ],
  },
  {
    id: 'KRL-RANGKAS',
    code: 'Green',
    shapeKey: 'RK',
    name: 'Green Line · Tanah Abang–Rangkasbitung',
    desc: 'KRL',
    color: '008C45',
    text: 'FFFFFF',
    stops: [
      'THB',
      'PLM',
      'KBY',
      'PDJ',
      'JMU',
      'SDM',
      'RU',
      'SRP',
      'CSK',
      'CC',
      'PRP',
      'CJT',
      'DAR',
      'TEJ',
      'TGS',
      'CKY',
      'MJ',
      'CTR',
      'RK',
    ],
  },
  {
    id: 'KRL-TANGERANG',
    code: 'Brown',
    shapeKey: 'TNG',
    name: 'Brown Line · Duri–Tangerang',
    desc: 'KRL',
    color: '8B5A2B',
    text: 'FFFFFF',
    stops: ['DU', 'GGL', 'PSG', 'TKO', 'BOI', 'RW', 'KDS', 'PI', 'BPR', 'TTI', 'TNG'],
  },
  {
    id: 'KRL-PRIOK',
    code: 'Pink',
    shapeKey: 'TPK',
    name: 'Pink Line · Jakarta Kota–Tanjung Priok',
    desc: 'KRL',
    color: 'E91E8C',
    text: 'FFFFFF',
    stops: ['JAKK', 'KPB', 'AC', 'TPK'],
  },
]

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function loadOsmIndex() {
  const osm = JSON.parse(fs.readFileSync(path.join(krlDir, 'osm-stations.json'), 'utf8'))
  const byNorm = new Map()
  for (const e of osm.elements || []) {
    if (e.type !== 'node' || !e.lat || !e.lon) continue
    if (e.lon < 106.2 || e.lon > 107.7 || e.lat > -5.8 || e.lat < -7.2) continue
    const name = e.tags?.name
    if (!name) continue
    const score = /Commuter/i.test(e.tags?.network || '')
      ? 3
      : /KAI/i.test(e.tags?.network || '')
        ? 2
        : e.tags?.railway === 'station'
          ? 1
          : 0
    const key = norm(name)
    const prev = byNorm.get(key)
    if (!prev || score > prev.score) {
      byNorm.set(key, {
        name,
        lat: e.lat,
        lon: e.lon,
        ref: e.tags?.ref || null,
        score,
      })
    }
  }
  return byNorm
}

function resolveCoords(station, byNorm) {
  const candidates = [
    station.name,
    ...(ALIASES[station.name] || []),
    station.name.replace(/\./g, ''),
    station.name.replace(/\s+/g, ''),
  ]
  for (const c of candidates) {
    const hit = byNorm.get(norm(c))
    if (hit) return { lat: hit.lat, lon: hit.lon, matched: hit.name }
  }
  // fuzzy: all tokens present
  const tokens = norm(station.name).split(' ').filter((t) => t.length > 2)
  if (tokens.length) {
    for (const [key, hit] of byNorm) {
      if (tokens.every((t) => key.includes(t))) return { lat: hit.lat, lon: hit.lon, matched: hit.name }
    }
  }
  if (MANUAL[station.name]) {
    const [lat, lon] = MANUAL[station.name]
    return { lat, lon, matched: 'manual' }
  }
  return null
}

function csvEscape(v) {
  const s = String(v ?? '')
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function writeCsv(file, headers, rows) {
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','))
  }
  fs.writeFileSync(file, lines.join('\n') + '\n')
}

function main() {
  if (!fs.existsSync(path.join(krlDir, 'osm-stations.json'))) {
    throw new Error('Missing data/krl/osm-stations.json — fetch OSM stations first')
  }
  if (!fs.existsSync(path.join(krlDir, 'stations-comuline.json'))) {
    throw new Error('Missing data/krl/stations-comuline.json')
  }

  const byNorm = loadOsmIndex()
  const com = JSON.parse(fs.readFileSync(path.join(krlDir, 'stations-comuline.json'), 'utf8'))
  const stationsByCode = new Map(com.data.map((s) => [s.id, { id: s.id, name: s.name }]))

  const usedStops = new Map()
  const agencyStops = []

  function ensureStop(code) {
    const mapped = stationsByCode.get(code)
    if (!mapped) {
      console.warn(`  ! unknown code ${code}`)
      return null
    }
    const stopId = `krl-${mapped.id}`
    if (usedStops.has(stopId)) return usedStops.get(stopId)

    const coords = resolveCoords(mapped, byNorm)
    if (!coords) {
      console.warn(`  ! no coords for ${mapped.id} ${mapped.name}`)
      return null
    }
    const row = {
      stop_id: stopId,
      stop_name: titleCase(mapped.name),
      stop_lat: coords.lat.toFixed(6),
      stop_lon: coords.lon.toFixed(6),
      location_type: 0,
    }
    usedStops.set(stopId, row)
    agencyStops.push(row)
    return row
  }

  function titleCase(name) {
    return name
      .toLowerCase()
      .split(' ')
      .map((w) => (w === 'univ.' ? 'Univ.' : w.charAt(0).toUpperCase() + w.slice(1)))
      .join(' ')
  }

  const routes = []
  const trips = []
  const routeList = []
  const stopTimes = []
  const shapes = []

  const shapeFile = path.join(krlDir, 'osm-route-shapes.json')
  /** @type {Record<string, [number, number][]>} */
  const osmShapes = fs.existsSync(shapeFile)
    ? JSON.parse(fs.readFileSync(shapeFile, 'utf8')).shapes || {}
    : {}

  function orientPath(pathPts, fromStop, toStop) {
    if (!pathPts?.length) return null
    const start = [Number(fromStop.stop_lat), Number(fromStop.stop_lon)]
    const end = [Number(toStop.stop_lat), Number(toStop.stop_lon)]
    const dStart0 = Math.hypot(pathPts[0][0] - start[0], pathPts[0][1] - start[1])
    const dStart1 = Math.hypot(
      pathPts[pathPts.length - 1][0] - start[0],
      pathPts[pathPts.length - 1][1] - start[1],
    )
    let oriented = dStart1 < dStart0 ? [...pathPts].reverse() : [...pathPts]
    // Prefer orientation that also ends nearer to destination
    const dEndA = Math.hypot(
      oriented[oriented.length - 1][0] - end[0],
      oriented[oriented.length - 1][1] - end[1],
    )
    const flipped = [...oriented].reverse()
    const dEndB = Math.hypot(
      flipped[flipped.length - 1][0] - end[0],
      flipped[flipped.length - 1][1] - end[1],
    )
    const dStartA = Math.hypot(oriented[0][0] - start[0], oriented[0][1] - start[1])
    const dStartB = Math.hypot(flipped[0][0] - start[0], flipped[0][1] - start[1])
    if (dStartB + dEndB < dStartA + dEndA) oriented = flipped
    return oriented
  }

  function pushShape(shapeId, pathPts) {
    pathPts.forEach((p, i) => {
      shapes.push({
        shape_id: shapeId,
        shape_pt_lat: Number(p[0]).toFixed(6),
        shape_pt_lon: Number(p[1]).toFixed(6),
        shape_pt_sequence: i + 1,
      })
    })
  }

  for (const line of LINES) {
    const stopRows = []
    for (const code of line.stops) {
      const row = ensureStop(code)
      if (row) stopRows.push(row)
    }
    if (stopRows.length < 3) {
      console.warn(`Skipping ${line.id}: only ${stopRows.length} stops resolved`)
      continue
    }

    routes.push({
      route_id: line.id,
      agency_id: 'KRL',
      route_short_name: line.code,
      route_long_name: line.name,
      route_desc: line.desc,
      route_type: 2,
      route_color: line.color,
      route_text_color: line.text,
    })

    const osmPath = orientPath(
      osmShapes[line.shapeKey || line.code],
      stopRows[0],
      stopRows[stopRows.length - 1],
    )
    const shapeSource = osmPath && osmPath.length >= 4 ? 'osm-rail' : 'station-line'
    const basePath =
      shapeSource === 'osm-rail'
        ? osmPath
        : stopRows.map((s) => [Number(s.stop_lat), Number(s.stop_lon)])

    for (const dir of [0, 1]) {
      const ordered = dir === 0 ? stopRows : [...stopRows].reverse()
      const tripId = `${line.id}-d${dir}`
      const shapeId = `shape-${line.id}-d${dir}`
      const headsign = ordered[ordered.length - 1].stop_name
      const dirPath =
        dir === 0 ? basePath : [...basePath].reverse()

      pushShape(shapeId, dirPath)

      trips.push({
        route_id: line.id,
        service_id: 'ALL',
        trip_id: tripId,
        trip_headsign: headsign,
        direction_id: dir,
        shape_id: shapeId,
      })
      routeList.push({
        route_id: line.id,
        trip_id: tripId,
        direction_id: dir,
        stop_headsign: headsign,
      })
      ordered.forEach((s, i) => {
        const hh = String(6 + Math.floor(i / 6)).padStart(2, '0')
        const mm = String((i * 3) % 60).padStart(2, '0')
        stopTimes.push({
          trip_id: tripId,
          arrival_time: `${hh}:${mm}:00`,
          departure_time: `${hh}:${mm}:00`,
          stop_id: s.stop_id,
          stop_sequence: i + 1,
        })
      })
    }

    console.log(
      `✓ ${line.code} ${line.name}: ${stopRows.length} stops · shape=${shapeSource} (${basePath.length} pts)`,
    )
  }

  fs.mkdirSync(outDir, { recursive: true })
  writeCsv(path.join(outDir, 'agency.txt'), ['agency_id', 'agency_name', 'agency_url', 'agency_timezone'], [
    {
      agency_id: 'KRL',
      agency_name: 'KAI Commuter',
      agency_url: 'https://commuterline.id',
      agency_timezone: 'Asia/Jakarta',
    },
  ])
  writeCsv(
    path.join(outDir, 'routes.txt'),
    [
      'route_id',
      'agency_id',
      'route_short_name',
      'route_long_name',
      'route_desc',
      'route_type',
      'route_color',
      'route_text_color',
    ],
    routes,
  )
  writeCsv(
    path.join(outDir, 'stops.txt'),
    ['stop_id', 'stop_name', 'stop_lat', 'stop_lon', 'location_type'],
    agencyStops,
  )
  writeCsv(
    path.join(outDir, 'trips.txt'),
    ['route_id', 'service_id', 'trip_id', 'trip_headsign', 'direction_id', 'shape_id'],
    trips,
  )
  writeCsv(
    path.join(outDir, 'stop_times.txt'),
    ['trip_id', 'arrival_time', 'departure_time', 'stop_id', 'stop_sequence'],
    stopTimes,
  )
  writeCsv(
    path.join(outDir, 'shapes.txt'),
    ['shape_id', 'shape_pt_lat', 'shape_pt_lon', 'shape_pt_sequence'],
    shapes,
  )
  writeCsv(
    path.join(outDir, 'route_list.txt'),
    ['route_id', 'trip_id', 'direction_id', 'stop_headsign'],
    routeList,
  )
  writeCsv(
    path.join(outDir, 'calendar.txt'),
    ['service_id', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'start_date', 'end_date'],
    [
      {
        service_id: 'ALL',
        monday: 1,
        tuesday: 1,
        wednesday: 1,
        thursday: 1,
        friday: 1,
        saturday: 1,
        sunday: 1,
        start_date: '20250101',
        end_date: '20261231',
      },
    ],
  )

  console.log(`Wrote GTFS KRL → ${outDir} (${agencyStops.length} stops, ${routes.length} routes)`)
}

main()
