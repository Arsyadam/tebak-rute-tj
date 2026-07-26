"use client"

import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Imperative API. Attach `ref` to an element and call `shake()` to replay a
 * Stripe-style perspective error wobble.
 */
export function useShake<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const shake = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.classList.remove('shake-error')
    void el.offsetWidth
    el.classList.add('shake-error')
  }, [])
  return { ref, shake }
}

interface ShakeProps {
  signal: unknown
  children: ReactNode
  className?: string
}

/** Declarative wrapper. Replays the shake whenever `signal` changes to a new truthy value. */
export default function Shake({ signal, children, className }: ShakeProps) {
  const { ref, shake } = useShake<HTMLDivElement>()
  const prev = useRef(signal)

  useEffect(() => {
    if (prev.current !== signal && signal) shake()
    prev.current = signal
  }, [signal, shake])

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  )
}
