/**
 * Build synthetic GTFS files for MRT + LRT Jabodebek + LRT Jabodetabek.
 * Sources:
 *   - MRT Jakarta: Jakarta GIS (Titik_Transportasi_Umum_Jakarta_v3) + manual corrections.
 *   - LRT Jabodebek: Jakarta GIS (partial) + manual coordinates for Bekasi/Depok stations.
 *   - LRT Jabodetabek: LRT Jakarta OSM relation 10693161 (Velodrome–Pegangsaan Dua).
 *
 * Writes to:
 *   data/gtfs-mrt
 *   data/gtfs-lrt-jabodebek
 *   data/gtfs-lrt-jabodetabek
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const SERVICE_ID = 'weekday'

const GIS_URL =
  'https://gis-dpmptsp.jakarta.go.id/arcgis/rest/services/Hosted/Titik_Transportasi_Umum_Jakarta_v3/FeatureServer/26/query'

const SYSTEMS = [
  {
    id: 'mrt',
    agency: { agency_id: 'mrt', agency_name: 'MRT Jakarta', agency_url: 'https://www.jakartamrt.co.id', agency_timezone: 'Asia/Jakarta' },
    lines: [
      {
        id: 'MRT-M1',
        short: 'M1',
        long: 'MRT North-South Line',
        color: 'CA1F47',
        text: 'FFFFFF',
        stops: [
          { id: 'MRT-BHI', name: 'Bundaran HI Bank Jakarta', lat: -6.19266, lon: 106.82307 },
          { id: 'MRT-DKA', name: 'Dukuh Atas BNI', lat: -6.19938, lon: 106.82332 },
          { id: 'MRT-STB', name: 'Setiabudi Astra', lat: -6.20927, lon: 106.82134 },
          { id: 'MRT-BNH', name: 'Bendungan Hilir', lat: -6.21508, lon: 106.81744 },
          { id: 'MRT-IST', name: 'Istora Mandiri', lat: -6.2221, lon: 106.80937 },
          { id: 'MRT-SNY', name: 'Senayan Mastercard', lat: -6.22691, lon: 106.80268 },
          { id: 'MRT-ASE', name: 'ASEAN', lat: -6.23859, lon: 106.79844 },
          { id: 'MRT-BLM', name: 'Blok M BCA', lat: -6.24484, lon: 106.79808 },
          { id: 'MRT-BLA', name: 'Blok A', lat: -6.25568, lon: 106.79723 },
          { id: 'MRT-HNW', name: 'Haji Nawi', lat: -6.26632, lon: 106.79736 },
          { id: 'MRT-CPR', name: 'Cipete Raya', lat: -6.27851, lon: 106.79741 },
          { id: 'MRT-FTM', name: 'Fatmawati', lat: -6.29249, lon: 106.79255 },
          { id: 'MRT-LBB', name: 'Lebak Bulus Grab', lat: -6.3030, lon: 106.7972 },
        ],
      },
    ],
  },
  {
    id: 'lrt-jabodebek',
    agency: { agency_id: 'lrt-jabodebek', agency_name: 'LRT Jabodebek', agency_url: 'https://lrtjabodebek.kai.id', agency_timezone: 'Asia/Jakarta' },
    lines: [
      {
        id: 'LRT-CB',
        short: 'CB',
        long: 'Cibubur Line',
        color: 'E3000F',
        text: 'FFFFFF',
        stops: [
          { id: 'LRTJ-DKA', name: 'Dukuh Atas BNI', lat: -6.20486, lon: 106.82564 },
          { id: 'LRTJ-STB', name: 'Setiabudi', lat: -6.20927, lon: 106.83044 },
          { id: 'LRTJ-RSN', name: 'Rasuna Said', lat: -6.22173, lon: 106.83226 },
          { id: 'LRTJ-KUN', name: 'Kuningan', lat: -6.23151, lon: 106.83294 },
          { id: 'LRTJ-PNC', name: 'Pancoran Bank BJB', lat: -6.24208, lon: 106.8384 },
          { id: 'LRTJ-CKK', name: 'Cikoko', lat: -6.24343, lon: 106.86352 },
          { id: 'LRTJ-CLW', name: 'Ciliwung', lat: -6.2435, lon: 106.8675 },
          { id: 'LRTJ-CAW', name: 'Cawang', lat: -6.24595, lon: 106.87143 },
          { id: 'LRTJ-TMI', name: 'TMII', lat: -6.29262, lon: 106.88039 },
          { id: 'LRTJ-KMR', name: 'Kampung Rambutan', lat: -6.30847, lon: 106.88428 },
          { id: 'LRTJ-CIR', name: 'Ciracas', lat: -6.32371, lon: 106.88674 },
          { id: 'LRTJ-HJM', name: 'Harjamukti', lat: -6.3238, lon: 106.8866 },
        ],
      },
      {
        id: 'LRT-BK',
        short: 'BK',
        long: 'Bekasi Line',
        color: '0057A0',
        text: 'FFFFFF',
        stops: [
          { id: 'LRTJ-DKA', name: 'Dukuh Atas BNI', lat: -6.20486, lon: 106.82564 },
          { id: 'LRTJ-STB', name: 'Setiabudi', lat: -6.20927, lon: 106.83044 },
          { id: 'LRTJ-RSN', name: 'Rasuna Said', lat: -6.22173, lon: 106.83226 },
          { id: 'LRTJ-KUN', name: 'Kuningan', lat: -6.23151, lon: 106.83294 },
          { id: 'LRTJ-PNC', name: 'Pancoran Bank BJB', lat: -6.24208, lon: 106.8384 },
          { id: 'LRTJ-CKK', name: 'Cikoko', lat: -6.24343, lon: 106.86352 },
          { id: 'LRTJ-CLW', name: 'Ciliwung', lat: -6.2435, lon: 106.8675 },
          { id: 'LRTJ-CAW', name: 'Cawang', lat: -6.24595, lon: 106.87143 },
          { id: 'LRTJ-HLM', name: 'Halim', lat: -6.24587, lon: 106.88745 },
          { id: 'LRTJ-JBB', name: 'Jati Bening Baru', lat: -6.246, lon: 106.93 },
          { id: 'LRTJ-CN1', name: 'Cikunir 1', lat: -6.246, lon: 106.955 },
          { id: 'LRTJ-CN2', name: 'Cikunir 2', lat: -6.246, lon: 106.968 },
          { id: 'LRTJ-BKB', name: 'Bekasi Barat', lat: -6.247, lon: 106.985 },
          { id: 'LRTJ-JTM', name: 'Jati Mulya', lat: -6.248, lon: 107.003 },
        ],
      },
    ],
  },
  {
    id: 'lrt-jabodetabek',
    agency: { agency_id: 'lrt-jabodetabek', agency_name: 'LRT Jabodetabek', agency_url: 'https://www.lrtjakarta.co.id', agency_timezone: 'Asia/Jakarta' },
    lines: [
      {
        id: 'LRT-JT',
        short: 'JT',
        long: 'LRT Jakarta',
        color: 'F16227',
        text: 'FFFFFF',
        stops: [
          { id: 'LRTT-VEL', name: 'Velodrome', lat: -6.19213, lon: 106.89115 },
          { id: 'LRTT-EQU', name: 'Equestrian', lat: -6.18406, lon: 106.89124 },
          { id: 'LRTT-PLM', name: 'Pulomas', lat: -6.1773, lon: 106.89337 },
          { id: 'LRTT-BLS', name: 'Boulevard Selatan', lat: -6.16898, lon: 106.89999 },
          { id: 'LRTT-BLU', name: 'Boulevard Utara', lat: -6.15962, lon: 106.90581 },
          { id: 'LRTT-PGD', name: 'Pegangsaan Dua', lat: -6.15721, lon: 106.91428 },
        ],
      },
    ],
  },
]

function csv(rows, headers) {
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(
      headers
        .map((h) => {
          const val = row[h] ?? ''
          const str = String(val)
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        })
        .join(','),
    )
  }
  return lines.join('\n')
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'transit-guessr/1.0 (rail GTFS builder)',
      Accept: 'application/json',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  return res.json()
}

async function fetchGisStations(where) {
  const url = `${GIS_URL}?where=${encodeURIComponent(where)}&outFields=nama,lat,long&returnGeometry=true&outSR=4326&f=json`
  const data = await fetchJson(url)
  return (data.features || []).map((f) => ({
    name: f.attributes.nama,
    lat: f.geometry?.y ?? f.attributes.lat,
    lon: f.geometry?.x ?? f.attributes.long,
  }))
}

function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/stasiun\s+/g, '')
    .replace(/lrt\s+/g, '')
    .replace(/mrt\s+/g, '')
    .replace(/st\.\s*/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

function enrichStopsFromGis(lines, gisStops) {
  const byName = new Map()
  for (const s of gisStops) {
    if (!s.name || s.lat == null || s.lon == null) continue
    const key = normalizeName(s.name)
    if (!byName.has(key)) byName.set(key, s)
  }
  for (const line of lines) {
    for (const stop of line.stops) {
      const key = normalizeName(stop.name)
      const hit = byName.get(key)
      if (hit && hit.lat != null && hit.lon != null) {
        stop.lat = hit.lat
        stop.lon = hit.lon
      }
    }
  }
}

function buildGtfs(system) {
  const dir = path.join(root, 'data', `gtfs-${system.id}`)
  fs.mkdirSync(dir, { recursive: true })

  const stops = []
  const stopById = new Map()
  const routes = []
  const trips = []
  const stopTimes = []
  const shapes = []
  const routeList = []
  const calendar = [
    {
      service_id: SERVICE_ID,
      monday: 1,
      tuesday: 1,
      wednesday: 1,
      thursday: 1,
      friday: 1,
      saturday: 1,
      sunday: 1,
      start_date: '20240101',
      end_date: '20261231',
    },
  ]

  for (const line of system.lines) {
    routes.push({
      route_id: line.id,
      agency_id: system.agency.agency_id,
      route_short_name: line.short,
      route_long_name: line.long,
      route_type: 1, // subway/metro
      route_color: line.color,
      route_text_color: line.text,
    })

    const tripId = `${line.id}-0`
    const shapeId = `${line.id}-shape`
    trips.push({
      trip_id: tripId,
      route_id: line.id,
      service_id: SERVICE_ID,
      direction_id: 0,
      shape_id: shapeId,
    })
    routeList.push({
      route_id: line.id,
      trip_id: tripId,
      direction_id: 0,
      stop_headsign: '',
    })

    for (let i = 0; i < line.stops.length; i++) {
      const s = line.stops[i]
      if (!stopById.has(s.id)) {
        stopById.set(s.id, s)
        stops.push({
          stop_id: s.id,
          stop_name: s.name,
          stop_lat: s.lat,
          stop_lon: s.lon,
        })
      }
      stopTimes.push({
        trip_id: tripId,
        stop_sequence: i + 1,
        stop_id: s.id,
        arrival_time: '06:00:00',
        departure_time: '06:00:00',
      })
      shapes.push({
        shape_id: shapeId,
        shape_pt_lat: s.lat,
        shape_pt_lon: s.lon,
        shape_pt_sequence: i + 1,
      })
    }
  }

  fs.writeFileSync(path.join(dir, 'agency.txt'), csv([system.agency], Object.keys(system.agency)))
  fs.writeFileSync(path.join(dir, 'stops.txt'), csv(stops, ['stop_id', 'stop_name', 'stop_lat', 'stop_lon']))
  fs.writeFileSync(path.join(dir, 'routes.txt'), csv(routes, ['route_id', 'agency_id', 'route_short_name', 'route_long_name', 'route_type', 'route_color', 'route_text_color']))
  fs.writeFileSync(path.join(dir, 'trips.txt'), csv(trips, ['trip_id', 'route_id', 'service_id', 'direction_id', 'shape_id']))
  fs.writeFileSync(path.join(dir, 'stop_times.txt'), csv(stopTimes, ['trip_id', 'stop_sequence', 'stop_id', 'arrival_time', 'departure_time']))
  fs.writeFileSync(path.join(dir, 'shapes.txt'), csv(shapes, ['shape_id', 'shape_pt_lat', 'shape_pt_lon', 'shape_pt_sequence']))
  fs.writeFileSync(path.join(dir, 'calendar.txt'), csv(calendar, ['service_id', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'start_date', 'end_date']))
  fs.writeFileSync(path.join(dir, 'route_list.txt'), csv(routeList, ['route_id', 'trip_id', 'direction_id', 'stop_headsign']))

  console.log(`Built ${system.id}: ${stops.length} stops, ${routes.length} routes`)
}

async function main() {
  for (const system of SYSTEMS) {
    if (system.id === 'mrt' || system.id === 'lrt-jabodebek') {
      try {
        const where =
          system.id === 'mrt'
            ? "fungsi='STASIUN MRT - FASE 1'"
            : "fungsi='STASIUN LRT - JABODEBEK'"
        const gis = await fetchGisStations(where)
        enrichStopsFromGis(system.lines, gis)
      } catch (err) {
        console.warn(`Failed to fetch GIS for ${system.id}: ${err.message}. Using manual coordinates.`)
      }
    }
    buildGtfs(system)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
