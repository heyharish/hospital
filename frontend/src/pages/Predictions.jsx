import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Brain, ArrowRight, Users } from '@phosphor-icons/react'
import { getPredictions } from '../api/predictions'
import Spinner from '../components/UI/Spinner'
import RiskBadge from '../components/UI/Badge'
import { useToast } from '../contexts/ToastContext'

function fmt(date) {
  return new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function Predictions() {
  const [preds, setPreds]   = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]     = useState(0)
  const LIMIT = 50
  const toast = useToast()

  const load = useCallback((skip = 0) => {
    setLoading(true)
    getPredictions({ skip, limit: LIMIT })
      .then(data => { setPreds(data); setPage(skip) })
      .catch(() => toast.error('Failed to load predictions'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(0) }, [load])

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Prediction History</h2>
          <p className="page-subtitle">All ML readmission risk assessments</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <Spinner label="Loading predictions…" />
        ) : preds.length === 0 ? (
          <div className="empty-state">
            <Brain size={48} />
            <h3>No predictions yet</h3>
            <p>Select a patient and run an AI prediction to see results here.</p>
            <Link to="/patients" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              <Users size={16} /> View Patients
            </Link>
          </div>
        ) : (
          <>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Patient ID</th>
                    <th>Label</th>
                    <th>Probability</th>
                    <th>Risk Level</th>
                    <th>Date</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {preds.map(p => (
                    <tr key={p.id}>
                      <td className="td-primary">{p.id}</td>
                      <td>
                        <Link to={`/patients/${p.patient_id}`} style={{ color: 'var(--primary-light)', fontWeight: 500 }}>
                          #{p.patient_id}
                        </Link>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.8125rem', fontWeight: 600,
                          color: p.prediction_label === 'READMITTED' ? 'var(--risk-high)' : 'var(--risk-low)',
                        }}>
                          {p.prediction_label === 'READMITTED' ? '⚠ READMITTED' : '✓ NOT READMITTED'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden', maxWidth: 80 }}>
                            <div style={{
                              height: '100%', borderRadius: 999,
                              width: `${p.probability * 100}%`,
                              background: p.probability > 0.69 ? 'var(--risk-high)' : p.probability > 0.39 ? 'var(--risk-medium)' : 'var(--risk-low)',
                            }} />
                          </div>
                          <span style={{ fontSize: '0.8125rem', minWidth: 42 }}>{(p.probability * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td><RiskBadge level={p.risk_level} /></td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>{fmt(p.created_at)}</td>
                      <td>
                        <Link to={`/patients/${p.patient_id}`} className="btn btn-ghost btn-sm">
                          <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => load(page - LIMIT)} disabled={page === 0}>← Prev</button>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Showing {page + 1}–{page + preds.length}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => load(page + LIMIT)} disabled={preds.length < LIMIT}>Next →</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
