import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Floating Transit-style chrome for in-map game HUD */
export const gameHud = {
  panel:
    'rounded-[24px] border border-white/15 bg-[#003324]/92 text-white shadow-[0_18px_40px_rgba(0,51,36,0.35)] backdrop-blur-md',
  pill:
    'inline-flex items-center justify-center rounded-full border border-white/15 bg-[#003324]/92 px-4 py-2 font-bold text-white shadow-[0_12px_28px_rgba(0,51,36,0.3)] backdrop-blur-md',
  accent: 'text-[#F9A01B]',
  muted: 'text-white/80',
  input:
    'h-12 rounded-full border-white/20 bg-[#12452b]/95 text-base text-white placeholder:text-white/55 focus-visible:border-[#F9A01B] focus-visible:ring-[#F9A01B]/35',
  cta: 'h-12 rounded-full bg-[#108043] px-5 font-bold italic text-white hover:bg-[#27a559]',
  iconBtn:
    'size-12 shrink-0 rounded-full border border-white/20 bg-[#003324]/92 text-white shadow-[0_12px_28px_rgba(0,51,36,0.3)] backdrop-blur-md hover:bg-[#12452b]',
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
