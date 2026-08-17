import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Brain, Pulse, Warning, ArrowRight, Clock } from '@phosphor-icons/react'
import { getDashboardStats } from '../api/dashboard'
import RiskDonut from '../components/Charts/RiskDonut'
import RiskBadge from '../components/UI/Badge'
import Spinner from '../components/UI/Spinner'
import { useToast } from '../contexts/ToastContext'

function StatCard({ value, label, icon: Icon, color }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className={`stat-icon ${color}`}><Icon size={20} weight="duotone" /></div>
      <div className="stat-value">{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function fmt(date) {
  return new Date(date).toLocaleString('en-IN', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function Dashboard() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => toast.error('Failed to load dashboard stats'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner size="lg" label="Loading dashboard…" />

  const rd = stats?.risk_distribution ?? {}

  return (
    <div className="fade-in">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Clinical Dashboard</h2>
          <p className="page-subtitle">Real-time overview of patient readmission risk</p>
        </div>
        <Link to="/patients/new" className="btn btn-cyan">
          <Users size={16} /> Add Patient
        </Link>
      </div>

      {/* Stats grid */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard value={stats?.total_patients}          label="Total Patients"        icon={Users}    color="blue" />
        <StatCard value={stats?.total_predictions}       label="Total Predictions"     icon={Brain}    color="cyan" />
        <StatCard value={stats?.predictions_last_7_days} label="Predictions (7 days)"  icon={Pulse} color="green" />
        <StatCard value={rd.high ?? 0}                   label="High Risk Patients"    icon={Warning}  color="rose" />
      </div>

      {/* Charts + recent */}
      <div className="two-col">
        {/* Donut */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Risk Distribution</span>
            <span className="badge badge-gray">All time</span>
          </div>
          <RiskDonut low={rd.low ?? 0} medium={rd.medium ?? 0} high={rd.high ?? 0} />
        </div>

        {/* Recent predictions */}
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <span className="card-title">Recent Activity</span>
            <Link to="/predictions" className="btn btn-ghost btn-sm">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {!stats?.recent_predictions?.length ? (
            <div className="empty-state">
              <Clock size={40} />
              <h3>No predictions yet</h3>
              <p>Run your first prediction to see activity here.</p>
            </div>
          ) : (
            <div style={{ padding: '0.5rem 0' }}>
              {stats.recent_predictions.map(p => (
                <div key={p.prediction_id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem 1.5rem',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  transition: 'background 0.2s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => window.location.href = `/patients/${p.patient_id}`}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.patient_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{fmt(p.created_at)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {(p.probability * 100).toFixed(1)}%
                    </span>
                    <RiskBadge level={p.risk_level} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/patients" className="btn btn-ghost">
          <Users size={16} /> View all patients
        </Link>
        <Link to="/predictions" className="btn btn-ghost">
          <Brain size={16} /> Prediction history
        </Link>
      </div>
    </div>
  )
}
