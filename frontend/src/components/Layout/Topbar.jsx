import { useLocation } from 'react-router-dom'
import { Bell } from '@phosphor-icons/react'
import { useAuth } from '../../contexts/AuthContext'

const titles = {
  '/dashboard':   { title: 'Dashboard', sub: 'Overview & analytics' },
  '/patients':    { title: 'Patients', sub: 'Manage patient records' },
  '/predictions': { title: 'Predictions', sub: 'ML inference history' },
  '/patients/new': { title: 'New Patient', sub: 'Add a new patient record' },
}

export default function Topbar() {
  const { pathname } = useLocation()
  const { user } = useAuth()

  const info = pathname.startsWith('/patients/') && pathname !== '/patients/new'
    ? { title: 'Patient Detail', sub: 'Clinical profile & predictions' }
    : pathname.startsWith('/predict/')
    ? { title: 'Run Prediction', sub: 'AI readmission risk assessment' }
    : titles[pathname] ?? { title: 'ReadmissionAI', sub: '' }

  return (
    <header className="topbar">
      <div>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{info.title}</h1>
        {info.sub && <p style={{ fontSize: '0.75rem', marginTop: 1 }}>{info.sub}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          className="btn btn-ghost btn-sm"
          style={{ borderRadius: '50%', width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Bell size={17} />
        </button>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Welcome, <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user?.name?.split(' ')[0]}</span>
        </div>
      </div>
    </header>
  )
}
