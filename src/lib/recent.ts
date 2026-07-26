const RECENT_ROUTES_KEY = 'tj-recent-routes'
const RECENT_JOURNEYS_KEY = 'tj-recent-journeys'
const MAX_RECENT = 40

function loadList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key)
    const list = raw ? (JSON.parse(raw) as string[]) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function saveList(key: string, ids: string[]) {
  const unique = [...new Set(ids)].slice(0, MAX_RECENT)
  localStorage.setItem(key, JSON.stringify(unique))
}

export function loadRecentRoutes() {
  return loadList(RECENT_ROUTES_KEY)
}

export function rememberRoutes(routeIds: string[]) {
  const prev = loadRecentRoutes()
  saveList(RECENT_ROUTES_KEY, [...routeIds, ...prev])
}

export function loadRecentJourneys() {
  return loadList(RECENT_JOURNEYS_KEY)
}

export function rememberJourneys(keys: string[]) {
  const prev = loadRecentJourneys()
  saveList(RECENT_JOURNEYS_KEY, [...keys, ...prev])
}
