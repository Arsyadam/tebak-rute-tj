import { cn } from '@/lib/utils'
import { krlBadgeCode } from '@/components/8starlabs-ui/transport-badge'

/** Official Transjakarta corridor colors (Koridor 1–13) */
export const KORIDOR_COLORS: Record<string, string> = {
  '1': '#d02127',
  '2': '#294a99',
  '3': '#fbc71f',
  '4': '#502d5f',
  '5': '#cc6128',
  '6': '#2ca74a',
  '7': '#e82860',
  '8': '#d73492',
  '9': '#43a09a',
  '10': '#961f22',
  '11': '#2e3192',
  '12': '#77bb79',
  '13': '#783378',
  '14': '#F5AB6E',
}

/** Text color for yellow corridors that need dark text */
function corridorTextColor(hex: string) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.65 ? '#0C1B2A' : '#FFFFFF'
}

const JAK_CYAN = '#00A9E0'

const KRL_SIGNAGE: Record<string, string> = {
  RED: 'KRL Lin Sentral.svg',
  BLU: 'KRL Lin Cikarang.svg',
  GRN: 'KRL Lin Rangkasbitung.svg',
  BRN: 'KRL Lin Tangerang.svg',
  PNK: 'KRL Lin Tanjung Priok.svg',
}

/** Display title from signage / corridor naming — matches public/signage filenames */
export function routeDisplayName(code: string, agency?: string, name?: string): string {
  if (agency === 'mrt') return 'MRT Lin Utara Selatan'
  if (agency === 'lrt-jabodebek') {
    const c = code.toUpperCase()
    if (c === 'BK' || c.includes('BEKASI')) return 'LRT Jabodebek Lin Bekasi'
    if (c === 'CB' || c.includes('CIBUBUR')) return 'LRT Jabodebek Lin Cibubur'
    return 'LRT Jabodebek'
  }
  if (agency === 'lrt-jabodetabek') return 'LRT Jakarta Lin 1'
  if (agency === 'krl' || /^(red|blue|green|brown|pink)/i.test(code)) {
    const key = krlBadgeCode(code)
    const file = KRL_SIGNAGE[key]
    return file ? file.replace(/\.svg$/i, '') : 'KRL'
  }
  const jakMatch = code.match(/^JAK\.?(\d+)$/i)
  if (jakMatch) return `JAK ${jakMatch[1]}`
  const corridorMatch = code.match(/^(\d{1,2})([A-Z]?)$/i)
  if (corridorMatch) {
    const num = corridorMatch[1]!
    const letter = corridorMatch[2] || ''
    return letter ? `Koridor ${num}${letter.toUpperCase()}` : `Koridor ${num}`
  }
  return name || code
}

const sizePx: Record<'xs' | 'sm' | 'md' | 'lg', number> = {
  xs: 28,
  sm: 36,
  md: 48,
  lg: 64,
}

function signageSrc(agency?: string, code?: string): string | null {
  if (!agency && !code) return null
  if (agency === 'krl' || /^(red|blue|green|brown|pink)/i.test(code || '')) {
    const key = krlBadgeCode(code || '')
    const file = KRL_SIGNAGE[key]
    return file ? `/signage/${encodeURIComponent(file)}` : '/signage/KRL.svg'
  }
  if (agency === 'mrt') {
    return `/signage/${encodeURIComponent('MRT Lin Utara Selatan.svg')}`
  }
  if (agency === 'lrt-jabodebek') {
    const c = (code || '').toUpperCase()
    if (c === 'BK' || c.includes('BEKASI')) {
      return `/signage/${encodeURIComponent('LRT Jabodebek Lin Bekasi.svg')}`
    }
    if (c === 'CB' || c.includes('CIBUBUR')) {
      return `/signage/${encodeURIComponent('LRT Jabodebek Lin Cibubur.svg')}`
    }
    return '/signage/LRT.svg'
  }
  if (agency === 'lrt-jabodetabek') {
    return `/signage/${encodeURIComponent('LRT Jakarta Lin 1.svg')}`
  }
  return null
}

/** Circular BRT corridor marker — white number on official corridor color */
function KoridorCircle({
  number,
  color,
  size,
  className,
}: {
  number: string
  color: string
  size: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}) {
  const px = sizePx[size]
  const fg = corridorTextColor(color)
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold tabular-nums',
        className,
      )}
      style={{
        width: px,
        height: px,
        backgroundColor: color,
        color: fg,
        fontSize: px * (number.length > 2 ? 0.32 : 0.42),
      }}
      title={`Koridor ${number}`}
    >
      {number}
    </span>
  )
}

/** Mikrotrans JAK circular badge — "JAK" over large number, cyan */
function JakCircle({
  number,
  size,
  className,
}: {
  number: string
  size: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}) {
  const px = sizePx[size]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 flex-col items-center justify-center rounded-full font-bold leading-none text-white',
        className,
      )}
      style={{
        width: px,
        height: px,
        backgroundColor: JAK_CYAN,
      }}
      title={`JAK ${number}`}
    >
      <span style={{ fontSize: px * 0.18, letterSpacing: '0.04em' }}>JAK</span>
      <span style={{ fontSize: px * 0.36 }} className="tabular-nums">
        {number}
      </span>
    </span>
  )
}

/** Rectangular TJ route chip for non-corridor / non-JAK codes */
function TjRectBadge({
  code,
  color,
  size,
  className,
}: {
  code: string
  color: string
  size: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}) {
  const pad =
    size === 'xs'
      ? 'px-1.5 py-0.5 text-[10px]'
      : size === 'sm'
        ? 'px-2 py-0.5 text-xs'
        : size === 'md'
          ? 'px-2.5 py-1 text-sm'
          : 'px-3 py-1.5 text-base'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md font-bold text-white',
        pad,
        className,
      )}
      style={{ backgroundColor: color }}
      title={code}
    >
      {code}
    </span>
  )
}

function SignageImg({
  src,
  alt,
  size,
  className,
}: {
  src: string
  alt: string
  size: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}) {
  const px = sizePx[size]
  return (
    <img
      src={src}
      alt={alt}
      width={px}
      height={px}
      className={cn('inline-block shrink-0 object-contain', className)}
      style={{ width: px, height: px }}
      draggable={false}
    />
  )
}

/** Route chip for TJ, KRL, MRT, LRT — uses official corridor circles + signage SVGs */
export function RouteBadge({
  code,
  name,
  color,
  agency,
  size = 'md',
  showName = false,
  className,
}: {
  code: string
  name?: string
  color?: string
  agency?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showName?: boolean
  className?: string
}) {
  const svg = signageSrc(agency, code)
  if (svg) {
    return (
      <span className={cn('inline-flex items-center gap-2', className)}>
        <SignageImg src={svg} alt={name || code} size={size} />
        {showName && name ? (
          <span className="text-sm font-bold text-[#0C1B2A]">{name}</span>
        ) : null}
      </span>
    )
  }

  // Mikrotrans JAK.XX
  const jakMatch = code.match(/^JAK\.?(\d+)$/i)
  if (jakMatch) {
    return (
      <span className={cn('inline-flex items-center gap-2', className)}>
        <JakCircle number={jakMatch[1]!} size={size} />
        {showName ? (
          <span className="text-sm font-bold text-[#0C1B2A]">
            {name || `JAK ${jakMatch[1]}`}
          </span>
        ) : null}
      </span>
    )
  }

  // BRT corridor number (1–14) or lettered feeder like 2A — show base corridor circle + code
  const corridorMatch = code.match(/^(\d{1,2})([A-Z]?)$/i)
  if (corridorMatch) {
    const num = corridorMatch[1]!
    const letter = corridorMatch[2] || ''
    const bg = KORIDOR_COLORS[num] || color || '#0B5EA8'
    const label = letter ? `${num}${letter.toUpperCase()}` : num
    return (
      <span className={cn('inline-flex items-center gap-2', className)}>
        <KoridorCircle number={label} color={bg} size={size} />
        {showName ? (
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-[#0C1B2A]">
              {/^\d{1,2}$/.test(code) ? `Koridor ${code}` : code}
            </span>
            {name ? (
              <span className="text-xs font-normal text-[#0C1B2A]/70">{name}</span>
            ) : null}
          </span>
        ) : null}
      </span>
    )
  }

  // Fallback rectangular TJ badge
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <TjRectBadge code={code} color={color || '#0B5EA8'} size={size} />
      {showName && name ? (
        <span className="text-sm font-bold text-[#0C1B2A]">{name}</span>
      ) : null}
    </span>
  )
}
