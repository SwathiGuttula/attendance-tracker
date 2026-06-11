import React, { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar.jsx'
import { api } from '../../utils/api.js'

const NAV = [
  { key: 'overview',  label: 'Overview',        icon: 'dashboard' },
  { type: 'section',  label: 'Management' },
  { key: 'users',     label: 'Users',            icon: 'users' },
  { key: 'mappings',  label: 'Student Mapping',  icon: 'map' },
  { key: 'settings',  label: 'Settings',         icon: 'settings' },
]

export default function AdminDashboard() {
  const [view, setView] = useState('overview')
  return (
    <div className="layout">
      <Sidebar items={NAV} active={view} onNav={setView} />
      <main className="main-content">
        {view === 'overview' && <Overview />}
        {view === 'users'    && <UsersView />}
        {view === 'mappings' && <MappingsView />}
        {view === 'settings' && <SettingsView />}
      </main>
    </div>
  )
}

function Overview() {
  const [summary, setSummary]   = useState([])
  const [settings, setSettings] = useState({ threshold_critical: 75, threshold_warning: 85 })
  const [users, setUsers]       = useState([])

  useEffect(() => {
    Promise.all([api.getAdminSummary(), api.getSettings(), api.getUsers()])
      .then(([sum, set, u]) => { setSummary(sum); setSettings(set); setUsers(u) })
      .catch(console.error)
  }, [])

  const students    = users.filter(u => u.role === 'student')
  const counsellors = users.filter(u => u.role === 'counsellor')
  const critical    = summary.filter(s => s.percentage < settings.threshold_critical)
  const warning     = summary.filter(s => s.percentage >= settings.threshold_critical && s.percentage < settings.threshold_warning)

  return (
    <>
      <div className="topbar"><div><h1 className="page-title">Admin Overview</h1><p className="page-sub">System-wide attendance summary</p></div></div>
      <div className="grid-4">
        {[
          { label: 'Total Students',    value: students.length,    sub: 'registered' },
          { label: 'Counsellors',       value: counsellors.length, sub: 'active' },
          { label: `Critical (<${settings.threshold_critical}%)`, value: critical.length, sub: 'need attention', color: '#dc2626' },
          { label: 'Warning',           value: warning.length,     sub: 'monitor', color: '#d97706' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={s.color ? { color: s.color } : {}}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>
      {critical.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#dc2626' }}>⚠ Critical Attendance</h3>
          <table className="table">
            <thead><tr><th>Student</th><th>Counsellor</th><th>Attendance</th></tr></thead>
            <tbody>
              {critical.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 500 }}>{s.name}</td>
                  <td style={{ color: '#6b7280' }}>{s.counsellor_name || '—'}</td>
                  <td><span className="badge badge-red">{s.percentage}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>All students at a glance</h3>
        <table className="table">
          <thead><tr><th>Student</th><th>Counsellor</th><th>Attendance</th><th>Status</th></tr></thead>
          <tbody>
            {summary.map(s => {
              const status = s.percentage < settings.threshold_critical ? 'critical' : s.percentage < settings.threshold_warning ? 'warning' : 'ok'
              return (
                <tr key={s.id}>
                  <td style={{ fontWeight: 500 }}>{s.name}</td>
                  <td style={{ color: '#6b7280' }}>{s.counsellor_name || '—'}</td>
                  <td>{s.percentage}%</td>
                  <td><span className={`badge ${status === 'critical' ? 'badge-red' : status === 'warning' ? 'badge-amber' : 'badge-green'}`}>{status === 'critical' ? 'Critical' : status === 'warning' ? 'Warning' : 'Good'}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

function UsersView() {
  const [users, setUsers] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' })
  const [err, setErr] = useState('')

  async function load() { try { setUsers(await api.getUsers()) } catch {} }
  useEffect(() => { load() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    try { await api.addUser(form); load(); setShowAdd(false); setForm({ name: '', email: '', password: '', role: 'student' }); setErr('') }
    catch (ex) { setErr(ex.message) }
  }

  async function handleDelete(id) {
    if (window.confirm('Delete this user?')) { try { await api.deleteUser(id); load() } catch(ex) { alert(ex.message) } }
  }

  return (
    <>
      <div className="topbar"><div><h1 className="page-title">Users</h1><p className="page-sub">Manage all system users</p></div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add user</button>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr></thead>
          <tbody>
            {users.filter(u => u.role !== 'admin').map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500 }}>{u.name}</td>
                <td style={{ color: '#6b7280' }}>{u.email}</td>
                <td><span className={`badge ${u.role === 'counsellor' ? 'badge-blue' : 'badge-green'}`} style={{ textTransform: 'capitalize' }}>{u.role}</span></td>
                <td><button className="btn btn-sm" style={{ color: '#dc2626', borderColor: '#fecaca' }} onClick={() => handleDelete(u.id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Add new user</div>
            <form onSubmit={handleAdd}>
              {[['Full name','text','name'],['Email','email','email'],['Password','text','password']].map(([label,type,key]) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 5 }}>{label}</label>
                  <input className="input" type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 5 }}>Role</label>
                <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="student">Student</option>
                  <option value="counsellor">Counsellor</option>
                </select>
              </div>
              {err && <div className="alert alert-red" style={{ marginBottom: 12 }}>{err}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add user</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function MappingsView() {
  const [counsellors, setCounsellors] = useState([])
  const [students, setStudents]       = useState([])
  const [mappings, setMappings]       = useState([])
  const [selected, setSelected]       = useState('')
  const [assigned, setAssigned]       = useState([])

  async function load() {
    const [c, s, m] = await Promise.all([api.getCounsellors(), api.getStudents(), api.getMappings()])
    setCounsellors(c); setStudents(s); setMappings(m)
    if (c.length && !selected) setSelected(String(c[0].id))
  }
  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!selected) return
    const sids = mappings.filter(m => String(m.counsellor_id) === selected).map(m => m.student_id)
    setAssigned(sids)
  }, [selected, mappings])

  function toggle(sid) { setAssigned(prev => prev.includes(sid) ? prev.filter(s => s !== sid) : [...prev, sid]) }

  async function save() {
    await api.setMapping(selected, assigned)
    await load()
    alert('Mapping saved!')
  }

  // group mappings for display
  const grouped = counsellors.map(c => ({
    ...c,
    students: mappings.filter(m => m.counsellor_id === c.id).map(m => m.student_name)
  }))

  return (
    <>
      <div className="topbar"><div><h1 className="page-title">Student Mapping</h1><p className="page-sub">Assign students to counsellors</p></div></div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Select counsellor</label>
          <select className="input" style={{ maxWidth: 300 }} value={selected} onChange={e => setSelected(e.target.value)}>
            {counsellors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>Select students to assign:</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginBottom: 16 }}>
          {students.map(s => (
            <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: `1px solid ${assigned.includes(s.id) ? '#2563eb' : '#e5e7eb'}`, borderRadius: 8, cursor: 'pointer', background: assigned.includes(s.id) ? '#eff6ff' : '#fff', fontSize: 14 }}>
              <input type="checkbox" checked={assigned.includes(s.id)} onChange={() => toggle(s.id)} />
              {s.name}
            </label>
          ))}
        </div>
        <button className="btn btn-primary" onClick={save}>Save mapping</button>
      </div>
      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Current assignments</h3>
        {grouped.map(c => (
          <div key={c.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 6, color: '#2563eb' }}>{c.name}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {c.students.length === 0
                ? <span style={{ fontSize: 13, color: '#9ca3af' }}>No students assigned</span>
                : c.students.map(name => <span key={name} className="badge badge-green">{name}</span>)
              }
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function SettingsView() {
  const [form, setForm] = useState({ threshold_critical: 75, threshold_warning: 85 })
  const [saved, setSaved] = useState(false)

  useEffect(() => { api.getSettings().then(setForm).catch(console.error) }, [])

  async function handleSave(e) {
    e.preventDefault()
    await api.saveSettings({ threshold_critical: Number(form.threshold_critical), threshold_warning: Number(form.threshold_warning) })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <>
      <h1 className="page-title">Settings</h1>
      <p className="page-sub">Configure attendance alert thresholds</p>
      <div className="card" style={{ maxWidth: 480 }}>
        <form onSubmit={handleSave}>
          {[['Critical threshold (red alert)', 'threshold_critical'], ['Warning threshold (amber alert)', 'threshold_warning']].map(([label, key]) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{label}</label>
              <input className="input" type="number" min="0" max="100" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={{ maxWidth: 120 }} />
              <span style={{ marginLeft: 10, fontSize: 14, color: '#6b7280' }}>%</span>
            </div>
          ))}
          <div className="alert alert-blue" style={{ marginBottom: 16 }}>Counsellors see automatic alerts for students below these thresholds.</div>
          {saved && <div className="alert alert-green" style={{ marginBottom: 12 }}>✓ Settings saved!</div>}
          <button type="submit" className="btn btn-primary">Save settings</button>
        </form>
      </div>
    </>
  )
}
