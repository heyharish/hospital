export default function Spinner({ size = 'md', label }) {
  return (
    <div className="loading-center">
      <div className={`spinner${size === 'lg' ? ' spinner-lg' : ''}`} />
      {label && <span>{label}</span>}
    </div>
  )
}
