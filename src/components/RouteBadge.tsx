import {
  TransportBadge,
  krlBadgeCode,
  type CustomLine,
} from '@/components/8starlabs-ui/transport-badge'

function agencyBadgeCode(agency?: string, code?: string): string | undefined {
  if (agency === 'krl' || /^(red|blue|green|brown|pink)/i.test(code || '')) {
    return krlBadgeCode(code || '')
  }
  if (agency === 'mrt') return 'MRT'
  if (agency === 'lrt-jabodebek') return 'LRTJ'
  if (agency === 'lrt-jabodetabek') return 'LRTT'
  return undefined
}

/** Route chip for TJ, KRL, MRT, LRT Jabodebek, or LRT Jabodetabek */
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
  const systemCode = agencyBadgeCode(agency, code)
  if (systemCode) {
    return (
      <TransportBadge
        system="JK"
        stationCode={systemCode}
        stationName={showName ? name || code : undefined}
        showStationName={showName}
        size={size}
        className={className}
      />
    )
  }

  const custom: CustomLine = {
    code,
    name: name || code,
    bg: color || '#0B5EA8',
    fg: '#FFFFFF',
  }

  return (
    <TransportBadge
      custom={custom}
      stationName={showName ? name : undefined}
      showStationName={showName && Boolean(name)}
      size={size}
      className={className}
    />
  )
}
