import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Brain, ArrowLeft, ArrowRight, Warning, CheckCircle } from '@phosphor-icons/react'
import { getPatient } from '../api/patients'
import { runPrediction } from '../api/predictions'
import Spinner from '../components/UI/Spinner'
import RiskBadge from '../components/UI/Badge'
import FactorBar from '../components/Prediction/FactorBar'
import { useToast } from '../contexts/ToastContext'

/* Probability ring SVG */
function ProbRing({ probability }) {
  const r = 60, stroke = 14
  const circ = 2 * Math.PI * r
  const dash = circ * probability
  const color = probability > 0.69 ? '#f43f5e' : probability > 0.39 ? '#f59e0b' : '#10b981'

  return (
    <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto' }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle
          cx="80" cy="80" r={r} fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={-0}
          className="prob-ring"
          style={{
            filter: `drop-shadow(0 0 8px ${color}88)`,
            transition: 'stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color }}>{(probability * 100).toFixed(1)}%</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Probability</div>
      </div>
    </div>
  )
}

export default function PredictionRun() {
  const { patientId } = useParams()
  const navigate      = useNavigate()
  const toast         = useToast()

  const [patient, setPatient]   = useState(null)
  const [result, setResult]     = useState(null)
  const [running, setRunning]   = useState(false)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    getPatient(patientId)
      .then(setPatient)
      .catch(err => {
        toast.error(err.response?.data?.detail ?? 'Patient not found')
        navigate('/patients')
      })
      .finally(() => setLoading(false))
  }, [patientId])

  const handleRun = async () => {
    setRunning(true)
    setResult(null)
    try {
      const data = await runPrediction(Number(patientId))
      setResult(data)
      toast.success('Prediction complete!')
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Prediction failed')
    } finally {
      setRunning(false)
    }
  }

  if (loading) return <Spinner size="lg" label="Loading patient…" />

  const isReadmitted = result?.prediction === 'READMITTED'
  const maxImpact = result
    ? Math.max(...result.importantFactors.map(f => Math.abs(f.impact)))
    : 1

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/patients/${patientId}`)}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="page-title">Run Prediction</h2>
            <p className="page-subtitle">Patient: <strong>{patient?.name}</strong></p>
          </div>
        </div>
        <Link to={`/patients/${patientId}`} className="btn btn-ghost btn-sm">
          View Profile <ArrowRight size={14} />
        </Link>
      </div>

      <div style={{ maxWidth: 720 }}>
        {/* Patient summary card */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            {[
              ['Age', patient?.age],
              ['Gender', patient?.gender],
              ['Days in Hospital', patient?.time_in_hospital],
              ['Primary Diagnosis', patient?.diag_1],
              ['Medications', patient?.n_medications],
              ['Prior Inpatient', patient?.n_inpatient],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trigger button */}
        {!result && (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <Brain size={52} color="var(--cyan)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Ready to Assess</h3>
            <p style={{ marginBottom: '1.5rem', maxWidth: 380, margin: '0 auto 1.5rem' }}>
              The AI model will analyze {patient?.name}'s clinical data and predict 30-day readmission risk.
            </p>
            <button
              id="btn-run-ml"
              className="btn btn-cyan btn-lg"
              onClick={handleRun}
              disabled={running}
              style={{ minWidth: 200, justifyContent: 'center' }}
            >
              {running ? (
                <><div className="spinner" style={{ borderTopColor: '#fff' }} />Running model…</>
              ) : (
                <><Brain size={18} /> Predict Readmission Risk</>
              )}
            </button>
            {running && (
              <p style={{ marginTop: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Running XGBoost inference + SHAP explainability…
              </p>
            )}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="prediction-result">
            {/* Risk banner */}
            <div className="card" style={{
              marginBottom: '1rem',
              background: isReadmitted
                ? 'linear-gradient(135deg, rgba(244,63,94,0.08), rgba(244,63,94,0.03))'
                : 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.03))',
              borderColor: isReadmitted ? 'rgba(244,63,94,0.25)' : 'rgba(16,185,129,0.25)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {isReadmitted
                    ? <Warning size={32} color="var(--risk-high)" weight="fill" />
                    : <CheckCircle size={32} color="var(--risk-low)" weight="fill" />
                  }
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isReadmitted ? 'var(--risk-high)' : 'var(--risk-low)' }}>
                      {isReadmitted ? 'High Readmission Risk' : 'Low Readmission Risk'}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>30-day readmission prediction</div>
                  </div>
                </div>
                <RiskBadge level={result.riskLevel} />
              </div>
            </div>

            <div className="two-col" style={{ alignItems: 'start' }}>
              {/* Probability ring */}
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Risk Score
                </div>
                <ProbRing probability={result.probability} />
                <div style={{ marginTop: '1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Thresholds: Low &lt;40% · Medium &lt;70% · High ≥70%
                </div>
              </div>

              {/* SHAP Factors */}
              <div className="card">
                <div style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9375rem' }}>Key Contributing Factors</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  SHAP impact: <span style={{ color: 'var(--risk-high)' }}>red = increases risk</span> · <span style={{ color: 'var(--risk-low)' }}>green = reduces risk</span>
                </div>
                {result.importantFactors.map(f => (
                  <FactorBar key={f.feature} feature={f.feature} impact={f.impact} maxImpact={maxImpact} />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button className="btn btn-ghost" onClick={handleRun} disabled={running}>
                <Brain size={16} /> Run Again
              </button>
              <Link to={`/patients/${patientId}`} className="btn btn-primary">
                <ArrowLeft size={16} /> Back to Patient
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
