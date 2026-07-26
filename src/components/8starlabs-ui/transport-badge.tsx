import { cn } from '@/lib/utils'

const SYSTEMS = {
  SG: {
    NS: { name: 'North South Line', short: 'NS', long: 'NSL', bg: '#e22726', fg: '#FFF' },
    EW: { name: 'East West Line', short: 'EW', long: 'EWL', bg: '#00964e', fg: '#FFF' },
    NE: { name: 'North East Line', short: 'NE', long: 'NEL', bg: '#8f4299', fg: '#FFF' },
    CE: { name: 'Circle Line', short: 'CE', long: 'CCL', bg: '#f99d26', fg: '#000' },
    DT: { name: 'Downtown Line', short: 'DT', long: 'DTL', bg: '#005ea8', fg: '#fff' },
    TE: {
      name: 'Thomson-East Coast Line',
      short: 'TE',
      long: 'TEL',
      bg: '#9d5b26',
      fg: '#FFF',
    },
  },
  HK: {
    KT: { name: 'Kwun Tong Line', short: 'KT', long: 'KTL', bg: '#399e48', fg: '#FFF' },
    AE: { name: 'Airport Express Line', short: 'AE', long: 'AEL', bg: '#39858d', fg: '#FFF' },
    TO: { name: 'Tseung Kwan O Line', short: 'TO', long: 'TKOL', bg: '#7a3d90', fg: '#000' },
    SI: { name: 'South Island Line', short: 'SI', long: 'SIL', bg: '#c7d536', fg: '#FFF' },
    TW: { name: 'Tsuen Wan Line', short: 'TW', long: 'TWL', bg: '#d5371f', fg: '#FFF' },
    IS: { name: 'Island Line', short: 'IS', long: 'ISL', bg: '#3d6fbe', fg: '#FFF' },
    TC: { name: 'Tung Chung Line', short: 'TC', long: 'TCL', bg: '#e6a03e', fg: '#000' },
    DR: { name: 'Disneyland Resort Line', short: 'DR', long: 'DRL', bg: '#df76a4', fg: '#000' },
    ER: { name: 'East Rail Line', short: 'ER', long: 'ERL', bg: '#78b2e5', fg: '#000' },
    TM: { name: 'Tuen Ma Line', short: 'TM', long: 'TML', bg: '#913a0e', fg: '#FFF' },
  },
  /** Jakarta — KRL color lines + Transjakarta */
  JK: {
    RED: { name: 'Red Line', short: 'Red', long: 'RED', bg: '#DA251D', fg: '#FFF' },
    BLU: { name: 'Blue Line', short: 'Blue', long: 'BLU', bg: '#1A4C8B', fg: '#FFF' },
    GRN: { name: 'Green Line', short: 'Green', long: 'GRN', bg: '#008C45', fg: '#FFF' },
    BRN: { name: 'Brown Line', short: 'Brown', long: 'BRN', bg: '#8B5A2B', fg: '#FFF' },
    PNK: { name: 'Pink Line', short: 'Pink', long: 'PNK', bg: '#E91E8C', fg: '#FFF' },
    TJ: { name: 'Transjakarta', short: 'TJ', long: 'TJ', bg: '#0B5EA8', fg: '#FFF' },
  },
} as const

type SystemKey = keyof typeof SYSTEMS
type BadgeSize = 'xs' | 'sm' | 'md' | 'lg'

const sizeClasses: Record<BadgeSize, string> = {
  xs: 'px-1 py-0.5 text-[10px]',
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-0.5 text-sm',
  lg: 'px-3 py-1 text-base',
}

type LineData = {
  name: string
  short: string
  long: string
  bg: string
  fg: string
} | null

export type CustomLine = {
  code: string
  name?: string
  bg: string
  fg?: string
}

interface TransportBadgeProps {
  stationCode?: string | string[]
  system?: SystemKey
  className?: string
  stationName?: string
  showStationName?: boolean
  size?: BadgeSize
  /** Override / ad-hoc line (e.g. TJ route with GTFS color) */
  custom?: CustomLine | CustomLine[]
}

const getLineDataFromStationCode = (code: string, system: SystemKey): LineData => {
  const match = code.match(/^[A-Z]+/)
  if (!match) return null
  const prefix = match[0] as string
  const lines = SYSTEMS[system] as Record<string, LineData>
  if (lines && prefix in lines) return lines[prefix]
  return null
}

/** Map game route codes → JK transport codes */
export function krlBadgeCode(routeCode: string): string {
  const c = routeCode.toLowerCase()
  if (c.includes('nambo') || c === 'red nambo') return 'RED'
  if (c === 'red' || c.includes('bogor')) return 'RED'
  if (c === 'blue' || c.includes('cikarang')) return 'BLU'
  if (c === 'green' || c.includes('rangkas')) return 'GRN'
  if (c === 'brown' || c.includes('tangerang')) return 'BRN'
  if (c === 'pink' || c.includes('priok') || c.includes('priuk')) return 'PNK'
  return 'RED'
}

export function TransportBadge({
  stationCode,
  system = 'JK',
  className,
  stationName,
  showStationName = false,
  size = 'md',
  custom,
}: TransportBadgeProps) {
  const customs = custom ? (Array.isArray(custom) ? custom : [custom]) : null
  const codes = customs
    ? customs.map((c) => c.code)
    : Array.isArray(stationCode)
      ? stationCode
      : stationCode
        ? [stationCode]
        : []
  const isMulti = codes.length > 1

  return (
    <span className={cn('inline-flex items-center', className)}>
      <span className={cn('inline-flex', isMulti ? 'gap-0' : 'gap-1')}>
        {codes.map((code, idx) => {
          const customLine = customs?.[idx]
          const line = customLine
            ? {
                name: customLine.name || customLine.code,
                short: customLine.code,
                long: customLine.code,
                bg: customLine.bg,
                fg: customLine.fg || '#FFF',
              }
            : getLineDataFromStationCode(code, system)

          if (!line) {
            return (
              <span
                key={`${code}-${idx}`}
                className={cn(
                  'inline-flex items-center rounded font-semibold bg-gray-300 text-gray-700',
                  sizeClasses[size],
                )}
              >
                {code || '?'}
              </span>
            )
          }

          const radius = isMulti
            ? idx === 0
              ? 'rounded-l'
              : idx === codes.length - 1
                ? 'rounded-r'
                : 'rounded-none'
            : 'rounded'

          const border =
            isMulti && idx > 0 ? 'border-l border-white/40 dark:border-black/40' : ''

          const label = customLine
            ? customLine.code
            : `${line.short}${code.replace(/^[A-Z]+/, '')}`

          return (
            <span
              key={`${code}-${idx}`}
              className={cn(
                'inline-flex items-center font-semibold',
                sizeClasses[size],
                radius,
                border,
              )}
              style={{ backgroundColor: line.bg, color: line.fg }}
              title={line.name}
            >
              <span className="font-bold">{label}</span>
            </span>
          )
        })}
      </span>
      {showStationName && stationName ? (
        <span
          className={cn(
            'ml-2 font-medium text-slate-700 dark:text-slate-200',
            size === 'xs' && 'text-[10px]',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base',
          )}
        >
          {stationName}
        </span>
      ) : null}
    </span>
  )
}

export default TransportBadge
