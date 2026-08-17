/* Risk level badge */
const RISK_CONFIG = {
  LOW:    { cls: 'badge-low',    dot: '#10b981' },
  MEDIUM: { cls: 'badge-medium', dot: '#f59e0b' },
  HIGH:   { cls: 'badge-high',   dot: '#f43f5e' },
}

export default function RiskBadge({ level }) {
  const cfg = RISK_CONFIG[level?.toUpperCase()] ?? { cls: 'badge-gray', dot: '#94a3b8' }
  return (
    <span className={`badge ${cfg.cls}`}>
      <span style={{
        width: 6, height: 6,
        borderRadius: '50%',
        background: cfg.dot,
        display: 'inline-block',
        flexShrink: 0,
      }} />
      {level}
    </span>
  )
}
