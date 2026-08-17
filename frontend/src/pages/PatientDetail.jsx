import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Brain, Calendar, ArrowLeft, Pulse, Clipboard } from '@phosphor-icons/react'
import { getPatient, getPatientPredictions } from '../api/patients'
import Spinner from '../components/UI/Spinner'
import RiskBadge from '../components/UI/Badge'
import { useToast } from '../contexts/ToastContext'

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '55%' }}>{value}</span>
    </div>
  )
}

function fmt(date) {
  return new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function PatientDetail() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const toast     = useToast()
  const [patient, setPatient] = useState(null)
  const [preds, setPreds]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getPatient(id), getPatientPredictions(id)])
      .then(([p, pr]) => { setPatient(p); setPreds(pr) })
      .catch(err => {
        toast.error(err.response?.data?.detail ?? 'Failed to load patient')
        if (err.response?.status === 404) navigate('/patients')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Spinner size="lg" label="Loading patient…" />
  if (!patient) return null

  return (
    <div className="fade-in">
      {/* Back + actions */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/patients')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="page-title">{patient.name}</h2>
            <p className="page-subtitle">{patient.age} · {patient.gender} · Added {new Date(patient.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <Link to={`/predict/${patient.id}`} className="btn btn-cyan" id="btn-run-prediction">
          <Brain size={16} /> Run Prediction
        </Link>
      </div>

      <div className="two-col" style={{ alignItems: 'start' }}>
        {/* Clinical profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Demographics */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Demographics</span>
            </div>
            <InfoRow label="Name"    value={patient.name} />
            <InfoRow label="Age"     value={patient.age} />
            <InfoRow label="Gender"  value={patient.gender} />
          </div>

          {/* Clinical metrics */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Clinical Metrics</span>
            </div>
            <InfoRow label="Days in Hospital"  value={patient.time_in_hospital} />
            <InfoRow label="Lab Procedures"    value={patient.n_lab_procedures} />
            <InfoRow label="Procedures"        value={patient.n_procedures} />
            <InfoRow label="Medications"       value={patient.n_medications} />
            <InfoRow label="Outpatient Visits" value={patient.n_outpatient} />
            <InfoRow label="Inpatient Visits"  value={patient.n_inpatient} />
            <InfoRow label="Emergency Visits"  value={patient.n_emergency} />
          </div>

          {/* Diagnostics */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Diagnostics</span>
            </div>
            <InfoRow label="Medical Specialty" value={patient.medical_specialty} />
            <InfoRow label="Primary Diagnosis" value={patient.diag_1} />
            <InfoRow label="Secondary Diag"    value={patient.diag_2} />
            <InfoRow label="Tertiary Diag"     value={patient.diag_3} />
          </div>

          {/* Lab results */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Lab Results</span>
            </div>
            <InfoRow label="Glucose Test"      value={patient.glucose_test} />
            <InfoRow label="A1C Test"          value={patient.A1Ctest} />
            <InfoRow label="Medication Change" value={patient.change} />
            <InfoRow label="Diabetes Medication" value={patient.diabetes_med} />
          </div>
        </div>

        {/* Prediction history */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <span className="card-title">Prediction History</span>
            <span className="badge badge-blue">{preds.length} run{preds.length !== 1 ? 's' : ''}</span>
          </div>

          {preds.length === 0 ? (
            <div className="empty-state">
              <Pulse size={40} />
              <h3>No predictions yet</h3>
              <p>Run the first readmission risk assessment for this patient.</p>
              <Link to={`/predict/${patient.id}`} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                <Brain size={16} /> Run Prediction
              </Link>
            </div>
          ) : (
            <div className="timeline" style={{ padding: '1.25rem 1.5rem' }}>
              {preds.map((p) => (
                <div key={p.id} className="timeline-item">
                  <div className="timeline-dot">
                    <Clipboard size={14} />
                  </div>
                  <div className="timeline-content">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {p.prediction_label === 'READMITTED' ? '⚠ Readmission Risk' : '✓ Low Readmission Risk'}
                      </div>
                      <RiskBadge level={p.risk_level} />
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      Probability: <strong style={{ color: 'var(--text-primary)' }}>{(p.probability * 100).toFixed(1)}%</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <Calendar size={12} />
                      {fmt(p.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
