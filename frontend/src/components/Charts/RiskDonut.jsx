/**
 * RiskDonut — pure SVG donut chart showing LOW/MEDIUM/HIGH distribution
 */
export default function RiskDonut({ low = 0, medium = 0, high = 0 }) {
  const total = low + medium + high
  if (total === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
        No prediction data yet
      </div>
    )
  }

  const size = 200
  const cx = size / 2
  const cy = size / 2
  const r = 72
  const stroke = 22
  const circumference = 2 * Math.PI * r

  const segments = [
    { value: high,   color: '#f43f5e', label: 'HIGH' },
    { value: medium, color: '#f59e0b', label: 'MEDIUM' },
    { value: low,    color: '#10b981', label: 'LOW' },
  ]

  let offset = 0
  const slices = segments.map((seg) => {
    const frac = seg.value / total
    const dash = frac * circumference
    const slice = { ...seg, dash, offset, frac }
    offset += dash
    return slice
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background track */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
          />
          {/* Segments */}
          {slices.map((sl, i) => (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={sl.color}
              strokeWidth={stroke}
              strokeDasharray={`${sl.dash} ${circumference - sl.dash}`}
              strokeDashoffset={-sl.offset}
              className="prob-ring"
              style={{ transition: 'stroke-dasharray 0.8s ease', filter: `drop-shadow(0 0 6px ${sl.color}66)` }}
            />
          ))}
        </svg>
        {/* Center label */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{total}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Total</div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {segments.map(seg => (
          <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: seg.color, display: 'inline-block' }} />
            <span style={{ color: 'var(--text-secondary)' }}>{seg.label}</span>
            <span style={{ color: 'var(--text-muted)' }}>
              ({total > 0 ? Math.round(seg.value / total * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
