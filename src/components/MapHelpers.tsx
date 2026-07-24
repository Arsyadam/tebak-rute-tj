import { useEffect } from 'react'
import { useMap } from '@/components/ui/map'

/** Slow cinematic pan along route stops */
export function RouteTour({
  stops,
  enabled,
  intervalMs = 3200,
}: {
  stops: Array<{ lon: number; lat: number }>
  enabled: boolean
  intervalMs?: number
}) {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!map || !isLoaded || !enabled || stops.length === 0) return
    let i = 0
    const fly = () => {
      const s = stops[i % stops.length]!
      map.flyTo({
        center: [s.lon, s.lat],
        zoom: Math.max(map.getZoom(), 13),
        speed: 0.55,
        curve: 1.2,
        essential: true,
      })
      i++
    }
    fly()
    const id = window.setInterval(fly, intervalMs)
    return () => window.clearInterval(id)
  }, [map, isLoaded, enabled, stops, intervalMs])

  return null
}

export function FitRoute({ path }: { path: [number, number][] }) {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!map || !isLoaded || path.length < 2) return
    const lngs = path.map((p) => p[0])
    const lats = path.map((p) => p[1])
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 72, duration: 800 },
    )
  }, [map, isLoaded, path])

  return null
}

/** Snap camera to a just-found stop */
export function FlyToStop({
  stop,
  nonce,
}: {
  stop: { lon: number; lat: number } | null
  nonce: number
}) {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!map || !isLoaded || !stop || !nonce) return
    map.flyTo({
      center: [stop.lon, stop.lat],
      zoom: 15,
      speed: 1.1,
      curve: 1.2,
      essential: true,
    })
  }, [map, isLoaded, stop, nonce])

  return null
}
