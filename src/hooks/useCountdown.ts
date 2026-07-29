import { useCallback, useEffect, useRef, useState } from 'react'
import type { DifficultyLevel } from '@/types'
import { sound } from '@/lib/sound'

export const HARD_TIMER_MS = 40_000
export const URGENT_THRESHOLD_S = 10

export function hasHardTimer(level?: DifficultyLevel) {
  return level === 'sulit-banget'
}

export function canUseHints(level?: DifficultyLevel) {
  return level === 'gampang'
}

export function shouldHideMapLabels(level?: DifficultyLevel) {
  return level === 'sulit-banget'
}

/** Format remaining ms as M:SS */
export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Countdown timer for sulit-banget.
 * - Resets to 40s via `reset()`
 * - Calls `onTimeout` once when it hits 0
 * - Plays urgentTick each second under 10s
 */
export function useCountdown({
  enabled,
  onTimeout,
  paused = false,
}: {
  enabled: boolean
  onTimeout: () => void
  paused?: boolean
}) {
  const [remainingMs, setRemainingMs] = useState(HARD_TIMER_MS)
  const deadlineRef = useRef(Date.now() + HARD_TIMER_MS)
  const timedOutRef = useRef(false)
  const lastUrgentSecRef = useRef<number | null>(null)
  const onTimeoutRef = useRef(onTimeout)
  onTimeoutRef.current = onTimeout

  const reset = useCallback(() => {
    timedOutRef.current = false
    lastUrgentSecRef.current = null
    deadlineRef.current = Date.now() + HARD_TIMER_MS
    setRemainingMs(HARD_TIMER_MS)
  }, [])

  useEffect(() => {
    if (!enabled) {
      setRemainingMs(HARD_TIMER_MS)
      return
    }
    reset()
  }, [enabled, reset])

  useEffect(() => {
    if (!enabled || paused) return
    const id = window.setInterval(() => {
      const left = Math.max(0, deadlineRef.current - Date.now())
      setRemainingMs(left)

      const secLeft = Math.ceil(left / 1000)
      if (secLeft > 0 && secLeft <= URGENT_THRESHOLD_S) {
        if (lastUrgentSecRef.current !== secLeft) {
          lastUrgentSecRef.current = secLeft
          sound.urgentTick()
        }
      }

      if (left <= 0 && !timedOutRef.current) {
        timedOutRef.current = true
        sound.timeout()
        onTimeoutRef.current()
      }
    }, 100)
    return () => window.clearInterval(id)
  }, [enabled, paused])

  const isUrgent = enabled && remainingMs > 0 && remainingMs <= URGENT_THRESHOLD_S * 1000

  return {
    remainingMs,
    isUrgent,
    reset,
    label: formatCountdown(remainingMs),
  }
}
