import { NavLink, useNavigate } from 'react-router-dom'
import {
  SquaresFour, Users, Brain,
  Pulse, SignOut, Heartbeat, UserPlus
} from '@phosphor-icons/react'
import { useAuth } from '../../contexts/AuthContext'

const navItems = [
  { to: '/dashboard',   label: 'Dashboard',   icon: SquaresFour },
  { to: '/patients',    label: 'Patients',     icon: Users },
  { to: '/predictions', label: 'Predictions',  icon: Brain },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">
            <Heartbeat size={20} weight="bold" color="#fff" />
          </div>
          <div>
            <div className="logo-text">ReadmissionAI</div>
            <span className="logo-sub">Clinical Intelligence</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>

        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <Icon size={18} weight="duotone" />
            {label}
          </NavLink>
        ))}

        <div className="nav-section-label" style={{ marginTop: '1rem' }}>Actions</div>

        <NavLink
          to="/patients/new"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          <UserPlus size={18} weight="duotone" />
          New Patient
        </NavLink>
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="user-pill" onClick={handleLogout} title="Click to sign out">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name ?? 'User'}</div>
            <div className="user-role">{user?.role?.toLowerCase() ?? ''}</div>
          </div>
          <SignOut size={16} color="var(--text-muted)" />
        </div>
      </div>
    </aside>
  )
}
