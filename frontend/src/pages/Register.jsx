import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heartbeat, User, EnvelopeSimple, Lock } from '@phosphor-icons/react'
import { register as apiRegister } from '../api/auth'
import { useToast } from '../contexts/ToastContext'

const ROLES = ['STAFF', 'DOCTOR', 'ADMIN']

export default function Register() {
  const [form, setForm]     = useState({ name: '', email: '', password: '', role: 'STAFF' })
  const [loading, setLoading] = useState(false)
  const toast    = useToast()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await apiRegister(form.name, form.email, form.password, form.role)
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-bg" />
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <div className="logo-icon">
            <Heartbeat size={22} weight="bold" color="#fff" />
          </div>
          <div className="logo-text" style={{ fontSize: '1.2rem' }}>ReadmissionAI</div>
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join the clinical intelligence platform</p>

        <form className="auth-form" onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input id="reg-name" type="text" className="form-input" style={{ paddingLeft: '2.5rem' }}
                placeholder="Dr. Jane Smith" value={form.name} onChange={set('name')} required minLength={2} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email address</label>
            <div style={{ position: 'relative' }}>
              <EnvelopeSimple size={16} color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input id="reg-email" type="email" className="form-input" style={{ paddingLeft: '2.5rem' }}
                placeholder="doctor@hospital.com" value={form.email} onChange={set('email')} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input id="reg-password" type="password" className="form-input" style={{ paddingLeft: '2.5rem' }}
                placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select id="reg-role" className="form-select" value={form.role} onChange={set('role')}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <button id="reg-submit" type="submit" className="btn btn-cyan btn-lg"
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
            disabled={loading}>
            {loading ? <><div className="spinner" style={{ borderTopColor: '#fff' }} />Creating…</> : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
