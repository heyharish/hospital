/**
 * FactorBar — displays a single SHAP feature contribution bar
 * impact > 0 means it pushes toward readmission (red)
 * impact < 0 means it pushes away (green)
 */
export default function FactorBar({ feature, impact, maxImpact }) {
  const pct = maxImpact > 0 ? (Math.abs(impact) / maxImpact) * 100 : 0
  const isPositive = impact >= 0
  const label = feature.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div className="factor-bar">
      <span className="factor-name">{label}</span>
      <div className="factor-bar-track">
        <div
          className={`factor-bar-fill ${isPositive ? 'positive' : 'negative'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="factor-value" style={{ color: isPositive ? '#f43f5e' : '#10b981' }}>
        {isPositive ? '+' : ''}{impact.toFixed(3)}
      </span>
    </div>
  )
}
