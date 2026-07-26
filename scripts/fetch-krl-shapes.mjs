/**
 * Fetch KRL corridor geometries from OpenStreetMap route relations.
 * Sources: https://wiki.openstreetmap.org/wiki/Public_transport_in_Jakarta
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'data', 'krl')
fs.mkdirSync(outDir, { recursive: true })

/** route_master or direct route relation IDs from OSM wiki */
const RELATION_IDS = [
  16877214, // Bogor Line (master: Bogor + Nambo)
  15097508, // Cikarang Loop (master)
  17193464, // Tangerang (master)
  17193009, // Tanjung Priok (master)
  2922215, // Rangkasbitung dir A
  15094546, // Rangkasbitung dir B
]

const OVERPASS_ENDPOINTS = [
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

function haversine(a, b) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLon = toRad(b[1] - a[1])
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

/** Connect ordered OSM ways into one continuous [lat,lon][] polyline */
function waysToPolyline(ways) {
  if (!ways.length) return []
  const segs = ways
    .map((w) => {
      const geom = (w.geometry || [])
        .map((g) => [g.lat, g.lon])
        .filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))
      return geom.length >= 2 ? geom : null
    })
    .filter(Boolean)

  if (!segs.length) return []

  const path = [...segs[0]]
  for (let i = 1; i < segs.length; i++) {
    let seg = segs[i]
    const tip = path[path.length - 1]
    const dStart = haversine(tip, seg[0])
    const dEnd = haversine(tip, seg[seg.length - 1])
    if (dEnd < dStart) seg = [...seg].reverse()
    // skip duplicate join point
    const first = seg[0]
    if (haversine(tip, first) < 15) path.push(...seg.slice(1))
    else path.push(...seg)
  }
  return path
}

function downsample(points, maxPts = 200) {
  if (points.length <= maxPts) return points
  const step = Math.ceil(points.length / maxPts)
  const out = []
  for (let i = 0; i < points.length; i += step) out.push(points[i])
  const last = points[points.length - 1]
  if (out[out.length - 1] !== last) out.push(last)
  return out
}

function classifyRoute(tags = {}) {
  const blob = `${tags.name || ''} ${tags.ref || ''} ${tags.from || ''} ${tags.to || ''} ${tags.description || ''}`.toLowerCase()
  // Order matters — more specific first
  if (/priok|priuk/.test(blob)) return 'TPK'
  if (/nambo/.test(blob)) return 'NMO'
  if (/tangerang/.test(blob)) return 'TNG'
  if (/rangkas/.test(blob)) return 'RK'
  if (/cikarang|bekasi|lingkar|loop|racket|angke|manggarai feeder/.test(blob)) return 'CKR'
  if (/bogor|depok/.test(blob)) return 'BOO'
  return null
}

async function fetchOverpass(query) {
  let lastErr
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      console.log('POST', endpoint)
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'transit-guessr/1.0 (KRL shape fetch; contact: local-dev)',
          Accept: 'application/json',
        },
        body: new URLSearchParams({ data: query }),
      })
      const text = await res.text()
      if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 200)}`)
      if (text.trimStart().startsWith('<')) throw new Error(`HTML/XML error: ${text.slice(0, 160)}`)
      return JSON.parse(text)
    } catch (e) {
      lastErr = e
      console.warn('  failed:', e.message)
    }
  }
  throw lastErr
}

async function main() {
  const rawPath = path.join(outDir, 'osm-route-raw.json')
  let data
  if (process.argv.includes('--reuse') && fs.existsSync(rawPath)) {
    console.log('Reusing', rawPath)
    data = JSON.parse(fs.readFileSync(rawPath, 'utf8'))
  } else {
    const ids = RELATION_IDS.join(',')
    const query = `[out:json][timeout:180];
relation(id:${ids});
(._;>>;);
out geom;`
    data = await fetchOverpass(query)
    fs.writeFileSync(rawPath, JSON.stringify(data))
  }
  console.log('elements', data.elements?.length)

  const byId = new Map((data.elements || []).map((e) => [e.id, e]))

  /** @type {Record<string, {code:string, name:string, path:[number,number][], relationId:number}[]>} */
  const byCode = {}

  for (const el of data.elements || []) {
    if (el.type !== 'relation') continue
    const tags = el.tags || {}
    if (tags.type === 'route_master') continue
    if (tags.route !== 'train' && tags.route !== 'subway' && tags.route !== 'rail') continue

    const code = classifyRoute(tags)
    if (!code) {
      console.log('  skip unclassified', el.id, tags.name)
      continue
    }

    const ways = []
    for (const m of el.members || []) {
      if (m.type !== 'way') continue
      const way = byId.get(m.ref)
      if (way?.geometry?.length) ways.push(way)
    }
    const path = downsample(waysToPolyline(ways), 220)
    if (path.length < 4) {
      console.warn('  thin geometry', el.id, tags.name, path.length)
      continue
    }

    if (!byCode[code]) byCode[code] = []
    byCode[code].push({
      code,
      name: tags.name || String(el.id),
      path,
      relationId: el.id,
      from: tags.from || '',
      to: tags.to || '',
    })
    console.log(`✓ ${code} rel ${el.id} (${path.length} pts) ${tags.name}`)
  }

  // Prefer the most representative corridor geometry (not loops when a through-line exists)
  /** @type {Record<string, [number, number][]>} */
  const best = {}
  for (const [code, list] of Object.entries(byCode)) {
    const scored = list.map((item) => {
      let score = item.path.length
      const n = item.name.toLowerCase()
      if (code === 'CKR') {
        if (/full racket|loop/.test(n) && !/half/.test(n)) score -= 80
        if (/cikarang.*kampung bandan|kampung bandan.*cikarang/.test(n)) score += 40
        if (/via pasar senen|via manggarai/.test(n) && /half/.test(n)) score += 20
      }
      if (code === 'BOO' && /bogor/.test(n) && !/nambo|priuk|priok/.test(n)) score += 50
      if (code === 'NMO' && /nambo/.test(n)) score += 50
      if (code === 'TPK' && /priok|priuk/.test(n)) score += 50
      return { item, score }
    })
    scored.sort((a, b) => b.score - a.score)
    best[code] = scored[0].item.path
    console.log(`pick ${code}: ${scored[0].item.name} (${scored[0].item.path.length} pts)`)
  }

  const outFile = path.join(outDir, 'osm-route-shapes.json')
  fs.writeFileSync(outFile, JSON.stringify({ builtAt: new Date().toISOString(), shapes: best }, null, 2))
  console.log('Wrote', outFile, Object.keys(best))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
