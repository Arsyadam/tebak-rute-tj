import {
  TransportBadge,
  krlBadgeCode,
  type CustomLine,
} from '@/components/8starlabs-ui/transport-badge'

/** Route chip for TJ (GTFS color) or KRL color lines */
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
  if (agency === 'krl' || /^(red|blue|green|brown|pink)/i.test(code)) {
    return (
      <TransportBadge
        system="JK"
        stationCode={krlBadgeCode(code)}
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
