import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaretLeft, CaretRight, Check } from '@phosphor-icons/react'
import { createPatient } from '../api/patients'
import { useToast } from '../contexts/ToastContext'

/* ── Allowed options (mirroring backend preprocessing.py) ── */
const AGES      = ['[40-50)', '[50-60)', '[60-70)', '[70-80)', '[80-90)', '[90-100)']
const SPECS     = ['Missing', 'InternalMedicine', 'Other', 'Emergency/Trauma', 'Family/GeneralPractice', 'Cardiology', 'Surgery']
const DIAG_OPTS = ['Circulatory', 'Other', 'Respiratory', 'Digestive', 'Diabetes', 'Injury', 'Musculoskeletal', 'Missing']
const GLUCOSE   = ['no', 'normal', 'high']
const A1C       = ['no', 'high', 'normal']
const YESNO     = ['no', 'yes']
const GENDERS   = ['male', 'female', 'other']

const DEFAULTS = {
  name: '', gender: 'male',
  age: '[60-70)', medical_specialty: 'InternalMedicine',
  diag_1: 'Circulatory', diag_2: 'Other', diag_3: 'Other',
  glucose_test: 'no', A1Ctest: 'no', change: 'no', diabetes_med: 'no',
  time_in_hospital: 3, n_lab_procedures: 40, n_procedures: 1,
  n_medications: 10, n_outpatient: 0, n_inpatient: 0, n_emergency: 0,
}

const STEPS = ['Demographics', 'Clinical', 'Diagnostics', 'Lab Tests']

function Field({ label, children, required }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}{required && <span>*</span>}</label>
      {children}
    </div>
  )
}

function Sel({ value, onChange, opts, id }) {
  return (
    <select id={id} className="form-select" value={value} onChange={e => onChange(e.target.value)}>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function Num({ value, onChange, min = 0, max, id }) {
  return (
    <input id={id} type="number" className="form-input"
      value={value} min={min} max={max}
      onChange={e => onChange(Number(e.target.value))} />
  )
}

export default function PatientNew() {
  const [form, setForm]     = useState(DEFAULTS)
  const [step, setStep]     = useState(0)
  const [loading, setLoading] = useState(false)
  const toast    = useToast()
  const navigate = useNavigate()

  const set = (k) => (v) => setForm(prev => ({ ...prev, [k]: v }))
  const setE = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const patient = await createPatient(form)
      toast.success(`Patient "${patient.name}" created!`)
      navigate(`/patients/${patient.id}`)
    } catch (err) {
      const detail = err.response?.data?.detail
      toast.error(Array.isArray(detail) ? detail[0]?.msg ?? 'Validation error' : detail ?? 'Failed to create patient')
    } finally {
      setLoading(false)
    }
  }

  const stepContent = [
    /* Step 0 — Demographics */
    <div key="step0" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      <Field label="Full Name" required>
        <input id="pn-name" className="form-input" type="text" placeholder="e.g. John Doe"
          value={form.name} onChange={setE('name')} required />
      </Field>
      <Field label="Gender" required>
        <Sel id="pn-gender" value={form.gender} onChange={set('gender')} opts={GENDERS} />
      </Field>
      <Field label="Age Group" required>
        <Sel id="pn-age" value={form.age} onChange={set('age')} opts={AGES} />
      </Field>
    </div>,

    /* Step 1 — Clinical */
    <div key="step1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      <Field label="Days in Hospital (1–14)" required>
        <Num id="pn-time" value={form.time_in_hospital} onChange={set('time_in_hospital')} min={1} max={14} />
      </Field>
      <Field label="Lab Procedures">
        <Num id="pn-lab" value={form.n_lab_procedures} onChange={set('n_lab_procedures')} />
      </Field>
      <Field label="Procedures">
        <Num id="pn-proc" value={form.n_procedures} onChange={set('n_procedures')} />
      </Field>
      <Field label="Medications">
        <Num id="pn-meds" value={form.n_medications} onChange={set('n_medications')} />
      </Field>
      <Field label="Outpatient Visits">
        <Num id="pn-out" value={form.n_outpatient} onChange={set('n_outpatient')} />
      </Field>
      <Field label="Inpatient Visits">
        <Num id="pn-in" value={form.n_inpatient} onChange={set('n_inpatient')} />
      </Field>
      <Field label="Emergency Visits">
        <Num id="pn-emg" value={form.n_emergency} onChange={set('n_emergency')} />
      </Field>
    </div>,

    /* Step 2 — Diagnostics */
    <div key="step2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      <Field label="Medical Specialty" required>
        <Sel id="pn-spec" value={form.medical_specialty} onChange={set('medical_specialty')} opts={SPECS} />
      </Field>
      <div />
      <Field label="Primary Diagnosis (Diag 1)" required>
        <Sel id="pn-diag1" value={form.diag_1} onChange={set('diag_1')} opts={DIAG_OPTS} />
      </Field>
      <Field label="Secondary Diagnosis (Diag 2)">
        <Sel id="pn-diag2" value={form.diag_2} onChange={set('diag_2')} opts={DIAG_OPTS} />
      </Field>
      <Field label="Tertiary Diagnosis (Diag 3)">
        <Sel id="pn-diag3" value={form.diag_3} onChange={set('diag_3')} opts={DIAG_OPTS} />
      </Field>
    </div>,

    /* Step 3 — Lab Tests */
    <div key="step3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      <Field label="Glucose Test Result">
        <Sel id="pn-gluc" value={form.glucose_test} onChange={set('glucose_test')} opts={GLUCOSE} />
      </Field>
      <Field label="A1C Test Result">
        <Sel id="pn-a1c" value={form.A1Ctest} onChange={set('A1Ctest')} opts={A1C} />
      </Field>
      <Field label="Medication Changed">
        <Sel id="pn-change" value={form.change} onChange={set('change')} opts={YESNO} />
      </Field>
      <Field label="On Diabetes Medication">
        <Sel id="pn-diabmed" value={form.diabetes_med} onChange={set('diabetes_med')} opts={YESNO} />
      </Field>
    </div>,
  ]

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">New Patient</h2>
          <p className="page-subtitle">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 760 }}>
        {/* Step indicator */}
        <div className="step-indicator" style={{ marginBottom: '2rem' }}>
          {STEPS.map((s, i) => (
            <>
              <div
                key={s}
                className={`step-dot ${i < step ? 'done' : i === step ? 'active' : 'upcoming'}`}
                title={s}
              >
                {i < step ? <Check size={14} weight="bold" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div key={`line-${i}`} className={`step-line ${i < step ? 'done' : ''}`} />
              )}
            </>
          ))}
        </div>

        {/* Step content */}
        {stepContent[step]}

        <div className="divider" />

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            className="btn btn-ghost"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
          >
            <CaretLeft size={16} /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              id="btn-next-step"
              className="btn btn-primary"
              onClick={() => setStep(s => s + 1)}
            >
              Next <CaretRight size={16} />
            </button>
          ) : (
            <button
              id="btn-create-patient"
              className="btn btn-cyan"
              onClick={handleSubmit}
              disabled={loading || !form.name}
            >
              {loading
                ? <><div className="spinner" style={{ borderTopColor: '#fff' }} />Creating…</>
                : <><Check size={16} weight="bold" /> Create Patient</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
