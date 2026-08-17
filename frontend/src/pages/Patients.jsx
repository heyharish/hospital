import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MagnifyingGlass, Plus, Trash, ArrowRight, Users } from '@phosphor-icons/react'
import { getPatients, deletePatient } from '../api/patients'
import Spinner from '../components/UI/Spinner'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'

function fmt(date) {
  return new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function Patients() {
  const [patients, setPatients] = useState([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [deleting, setDeleting] = useState(null)
  const toast    = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canDelete = user?.role === 'ADMIN' || user?.role === 'DOCTOR'

  const load = useCallback((q = '') => {
    setLoading(true)
    getPatients(q ? { search: q } : {})
      .then(setPatients)
      .catch(() => toast.error('Failed to load patients'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleSearch = (e) => {
    const val = e.target.value
    setSearch(val)
    const tid = setTimeout(() => load(val), 350)
    return () => clearTimeout(tid)
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete patient "${name}"? This will also delete all their predictions.`)) return
    setDeleting(id)
    try {
      await deletePatient(id)
      toast.success('Patient deleted')
      load(search)
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Patients</h2>
          <p className="page-subtitle">{patients.length} record{patients.length !== 1 ? 's' : ''} found</p>
        </div>
        <Link to="/patients/new" id="btn-add-patient" className="btn btn-cyan">
          <Plus size={16} weight="bold" /> New Patient
        </Link>
      </div>

      {/* Search */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <div className="search-bar">
          <MagnifyingGlass size={16} />
          <input
            id="patient-search"
            type="text"
            className="form-input"
            placeholder="Search by patient name…"
            value={search}
            onChange={handleSearch}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <Spinner label="Loading patients…" />
        ) : patients.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>No patients found</h3>
            <p>{search ? 'Try a different search term.' : 'Add your first patient to get started.'}</p>
            <Link to="/patients/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              <Plus size={16} /> Add Patient
            </Link>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Specialty</th>
                  <th>Primary Diag</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id} style={{ cursor: 'pointer' }}>
                    <td className="td-primary" onClick={() => navigate(`/patients/${p.id}`)}>{p.name}</td>
                    <td onClick={() => navigate(`/patients/${p.id}`)}>{p.age}</td>
                    <td onClick={() => navigate(`/patients/${p.id}`)} style={{ textTransform: 'capitalize' }}>{p.gender}</td>
                    <td onClick={() => navigate(`/patients/${p.id}`)}>{p.medical_specialty}</td>
                    <td onClick={() => navigate(`/patients/${p.id}`)}>{p.diag_1}</td>
                    <td onClick={() => navigate(`/patients/${p.id}`)}>{fmt(p.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link
                          to={`/patients/${p.id}`}
                          className="btn btn-ghost btn-sm"
                          onClick={e => e.stopPropagation()}
                        >
                          <ArrowRight size={14} />
                        </Link>
                        {canDelete && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={e => { e.stopPropagation(); handleDelete(p.id, p.name) }}
                            disabled={deleting === p.id}
                          >
                            {deleting === p.id ? <div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#f43f5e' }} /> : <Trash size={14} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
