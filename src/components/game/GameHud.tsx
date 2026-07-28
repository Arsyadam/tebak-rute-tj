import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Floating Transit-style chrome for in-map game HUD — light surfaces, flat color, no dark glass */
export const gameHud = {
  panel:
    'rounded-[20px] border border-[rgba(18,69,43,0.12)] bg-white text-[#003324] shadow-[0_18px_40px_rgba(17,24,39,0.10)]',
  pill:
    'inline-flex items-center justify-center rounded-full border border-[rgba(18,69,43,0.12)] bg-white px-4 py-2 font-bold text-[#003324] shadow-[0_12px_28px_rgba(17,24,39,0.10)]',
  /** Timer / countdown — orange secondary so it reads as the center focal */
  timer:
    'inline-flex min-w-[5.5rem] items-center justify-center rounded-full bg-[#F9A01B] px-5 py-2.5 font-display text-lg font-bold tabular-nums text-[#003324] shadow-[0_12px_28px_rgba(249,160,27,0.35)]',
  accent: 'text-[#FF6B00]',
  muted: 'text-[#19483f]/75',
  input:
    'h-12 rounded-full border-[rgba(18,69,43,0.16)] bg-[#EBF4F9] text-base text-[#003324] placeholder:text-[#19483f]/50 focus-visible:border-[#108043] focus-visible:ring-[#108043]/25',
  cta: 'h-12 rounded-full bg-[#108043] px-5 font-bold text-white hover:bg-[#0d6b37]',
  iconBtn:
    'size-12 shrink-0 rounded-full border border-[rgba(18,69,43,0.12)] bg-white text-[#003324] shadow-[0_12px_28px_rgba(17,24,39,0.10)] hover:bg-[#EBF4F9]',
  badge:
    'flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBF4F9] font-display text-xl font-bold tabular-nums text-[#003324] sm:size-14 sm:text-2xl',
  progressTrack: 'h-2.5 overflow-hidden rounded-full bg-[#EBF4F9]',
  softWell: 'rounded-2xl bg-[#EBF4F9] p-2.5',
}

export function GameHudShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 z-20', className)}>
      <div className="pointer-events-none flex h-full w-full flex-col justify-between p-3 sm:p-4">
        {children}
      </div>
    </div>
  )
}

export function HudBlock({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('pointer-events-auto', className)}>{children}</div>
}

/** Three-column top bar: left | center (timer) | right — keeps center truly centered */
export function HudTopBar({
  left,
  center,
  right,
}: {
  left: ReactNode
  center?: ReactNode
  right: ReactNode
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 sm:gap-3">
      <div className="min-w-0 justify-self-start">{left}</div>
      <div className="justify-self-center pt-1">{center}</div>
      <div className="justify-self-end">{right}</div>
    </div>
  )
}
