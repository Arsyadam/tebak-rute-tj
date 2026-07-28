import { useEffect, useState } from 'react'
import type { GameData } from '@/types'

let cache: GameData | null = null

export function useGameData() {
  const [data, setData] = useState<GameData | null>(cache)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(!cache)

  useEffect(() => {
    if (cache) return
    let cancelled = false
    fetch('/data/game-data.json')
      .then((r) => {
        if (!r.ok) throw new Error(`Belum bisa memuat data (${r.status})`)
        return r.json() as Promise<GameData>
      })
      .then((json) => {
        if (cancelled) return
        cache = json
        setData(json)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Belum bisa memuat GTFS')
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { data, error, loading }
}
