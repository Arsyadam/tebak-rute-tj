#!/usr/bin/env node
/** Fetch KRL station list + OSM coords into data/krl/ */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'data', 'krl')
fs.mkdirSync(out, { recursive: true })

async function download(url, file, init) {
  console.log('GET', url)
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(file, buf)
  console.log('  →', file, `(${buf.length} bytes)`)
}

await download(
  'https://api.comuline.com/v1/station',
  path.join(out, 'stations-comuline.json'),
)

const query = `[out:json][timeout:90];
(
  node["railway"="station"](-7.1,106.3,-5.9,107.6);
  node["railway"="halt"](-7.1,106.3,-5.9,107.6);
);
out body;`

await download(
  'https://overpass.kumi.systems/api/interpreter',
  path.join(out, 'osm-stations.json'),
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ data: query }),
  },
)

console.log('Done. Next: npm run build:krl && npm run build:data')
