import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import Sidebar from '../../components/Sidebar.jsx'
import AttendanceBar from '../../components/AttendanceBar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { api } from '../../utils/api.js'
import { SUBJECTS } from '../../data/seed.js'

const NAV = [
  { key: 'overview',  label: 'My Students',     icon: 'dashboard' },
  { key: 'mark',      label: 'Mark Attendance',  icon: 'calendar' },
  { key: 'messages',  label: 'Sent Messages',    icon: 'mail' },
]

export default function CounsellorDashboard() {
  const { user } = useAuth()
  const [view, setView]         = useState('overview')
  const [students, setStudents] = useState([])
  const [summary, setSummary]   = useState([])
  const [settings, setSettings] = useState({ threshold_critical: 75, threshold_warning: 85 })
  const [selected, setSelected] = useState(null)
  const [loading, setLoading]   = useState(true)

  async function load() {
    setLoading(true)
    try {
      const [s, sum, set] = await Promise.all([
        api.getMyStudents(),
        api.getCounsellorSummary(),
        api.getSettings(),
      ])
      setStudents(s)
      setSummary(sum)
      setSettings(set)
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openStudent(s) { setSelected(s); setView('detail') }

  return (
    <div className="layout">
      <Sidebar items={NAV} active={view} onNav={v => { setView(v); setSelected(null) }} />
      <main className="main-content">
        {loading && view === 'overview' ? (
          <div style={{ color: '#9ca3af', padding: '2rem' }}>Loading…</div>
        ) : (
          <>
            {view === 'overview' && <Overview summary={summary} settings={settings} onStudentClick={openStudent} />}
            {view === 'detail'   && selected && <StudentDetail student={selected} settings={settings} counsellor={user} onBack={() => setView('overview')} />}
            {view === 'mark'     && <MarkAttendance students={students} onSave={load} />}
            {view === 'messages' && <SentMessages />}
          </>
        )}
      </main>
    </div>
  )
}

function Overview({ summary, settings, onStudentClick }) {
  const critical = summary.filter(s => s.percentage < settings.threshold_critical)
  const warning  = summary.filter(s => s.percentage >= settings.threshold_critical && s.percentage < settings.threshold_warning)

  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="page-title">My Students</h1>
          <p className="page-sub">{summary.length} students assigned to you</p>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-label">Total students</div><div className="stat-value">{summary.length}</div></div>
        <div className="stat-card"><div className="stat-label">Critical (&lt;{settings.threshold_critical}%)</div><div className="stat-value" style={{ color: '#dc2626' }}>{critical.length}</div></div>
        <div className="stat-card"><div className="stat-label">Warning (&lt;{settings.threshold_warning}%)</div><div className="stat-value" style={{ color: '#d97706' }}>{warning.length}</div></div>
      </div>

      {critical.length > 0 && (
        <div className="alert alert-red" style={{ marginBottom: 16, flexDirection: 'column', gap: 4 }}>
          <strong>⚠ Urgent — {critical.length} student(s) below {settings.threshold_critical}% attendance</strong>
          <span style={{ fontSize: 13 }}>{critical.map(s => s.name).join(', ')} — click their row to send a message.</span>
        </div>
      )}
      {warning.length > 0 && (
        <div className="alert alert-amber" style={{ marginBottom: 16 }}>
          △ {warning.length} student(s) between {settings.threshold_critical}–{settings.threshold_warning}% — monitor closely.
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead><tr><th>Student</th><th>Overall attendance</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {summary.map(s => {
              const status = s.percentage < settings.threshold_critical ? 'critical' : s.percentage < settings.threshold_warning ? 'warning' : 'ok'
              return (
                <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => onStudentClick(s)}>
                  <td style={{ fontWeight: 500 }}>{s.name}<div style={{ fontSize: 12, color: '#9ca3af' }}>{s.email}</div></td>
                  <td style={{ width: 200 }}><AttendanceBar pct={s.percentage} settings={{ thresholdCritical: settings.threshold_critical, thresholdWarning: settings.threshold_warning }} /></td>
                  <td><span className={`badge ${status === 'critical' ? 'badge-red' : status === 'warning' ? 'badge-amber' : 'badge-green'}`}>{status === 'critical' ? 'Critical' : status === 'warning' ? 'Warning' : 'Good'}</span></td>
                  <td onClick={e => e.stopPropagation()}><MessageBtn student={s} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

function MessageBtn({ student }) {
  const { user } = useAuth()
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ subject: '', body: '' })
  const [sent, setSent] = useState(false)

  const templates = [
    { label: 'Low attendance warning', subject: 'Attendance Alert', body: `Dear ${student.name},\n\nYour attendance has fallen below the required threshold. Please ensure regular attendance.\n\nRegards,\n${user?.name}` },
    { label: 'Please meet counsellor',  subject: 'Meeting Request',  body: `Dear ${student.name},\n\nKindly schedule a meeting with me at the earliest to discuss your attendance.\n\nRegards,\n${user?.name}` },
  ]

  async function submit(e) {
    e.preventDefault()
    try {
      await api.sendMessage({ toId: student.id, subject: form.subject, body: form.body })
      setSent(true)
      setTimeout(() => { setShow(false); setSent(false); setForm({ subject: '', body: '' }) }, 1500)
    } catch(err) { alert(err.message) }
  }

  return (
    <>
      <button className="btn btn-sm" style={{ color: '#2563eb', borderColor: '#bfdbfe' }} onClick={() => setShow(true)}>Send message</button>
      {show && (
        <div className="modal-overlay" onClick={() => setShow(false)}>
          <div className="modal" style={{ minWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">Message → {student.name}</div>
            {sent ? (
              <div className="alert alert-green">✓ Message sent!</div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    {templates.map(t => (
                      <button type="button" key={t.label} className="btn btn-sm" onClick={() => setForm({ subject: t.subject, body: t.body })}>{t.label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Subject</label>
                  <input className="input" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Message</label>
                  <textarea className="input" rows={5} style={{ resize: 'vertical' }} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} required />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn" onClick={() => setShow(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Send</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function StudentDetail({ student, settings, onBack }) {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [trend,   setTrend]   = useState([])

  useEffect(() => {
    Promise.all([api.getStudentSummary(student.id), api.getStudentTrend(student.id)])
      .then(([sum, tr]) => { setSummary(sum); setTrend(tr) })
      .catch(console.error)
  }, [student.id])

  if (!summary) return <div style={{ color: '#9ca3af' }}>Loading…</div>

  const overall = summary.overall
  const thr = { thresholdCritical: settings.threshold_critical, thresholdWarning: settings.threshold_warning }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-sm" onClick={onBack}>← Back</button>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>{student.name}</h1>
          <p style={{ fontSize: 13, color: '#6b7280' }}>{student.email}</p>
        </div>
        <div style={{ marginLeft: 'auto' }}><MessageBtn student={student} /></div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Overall attendance</div>
          <div className="stat-value" style={{ color: overall.percentage < settings.threshold_critical ? '#dc2626' : overall.percentage < settings.threshold_warning ? '#d97706' : '#16a34a' }}>{overall.percentage}%</div>
          <div className="stat-sub">{overall.present_count} of {overall.total} classes attended</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Classes missed</div>
          <div className="stat-value">{overall.total - overall.present_count}</div>
          <div className="stat-sub">out of {overall.total} total</div>
        </div>
      </div>

      {trend.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Attendance trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trend.map(t => ({ week: t.week_start, pct: t.percentage }))}>
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={v => v + '%'} />
              <ReferenceLine y={settings.threshold_critical} stroke="#dc2626" strokeDasharray="4 2" />
              <ReferenceLine y={settings.threshold_warning}  stroke="#d97706" strokeDasharray="4 2" />
              <Line type="monotone" dataKey="pct" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Subject-wise breakdown</h3>
        {summary.subjects.map(s => (
          <div key={s.subject} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ fontWeight: 500 }}>{s.subject}</span>
              <span style={{ color: '#6b7280' }}>{s.present_count}/{s.total} classes</span>
            </div>
            <AttendanceBar pct={s.percentage} settings={thr} />
          </div>
        ))}
      </div>
    </>
  )
}

function MarkAttendance({ students, onSave }) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate]       = useState(today)
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [attendance, setAtt]  = useState({})
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  function toggle(sid) { setAtt(prev => ({ ...prev, [sid]: !prev[sid] })) }

  async function handleSave() {
    setSaving(true)
    const records = students.map(s => ({ studentId: s.id, subject, date, present: !!attendance[s.id] }))
    try {
      await api.markAttendance(records)
      onSave()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch(err) { alert(err.message) }
    setSaving(false)
  }

  return (
    <>
      <h1 className="page-title">Mark Attendance</h1>
      <p className="page-sub">Record daily attendance for your students</p>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 5 }}>Date</label>
            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 180 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 5 }}>Subject</label>
            <select className="input" value={subject} onChange={e => setSubject(e.target.value)} style={{ width: 200 }}>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" onClick={() => { const a = {}; students.forEach(s => a[s.id] = true); setAtt(a) }}>Mark all present</button>
          <button className="btn btn-sm" onClick={() => setAtt({})}>Mark all absent</button>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Student</th><th>Status</th><th>Toggle</th></tr></thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 500 }}>{s.name}</td>
                <td><span className={`badge ${attendance[s.id] ? 'badge-green' : 'badge-red'}`}>{attendance[s.id] ? 'Present' : 'Absent'}</span></td>
                <td>
                  <div onClick={() => toggle(s.id)} style={{ width: 36, height: 20, borderRadius: 10, background: attendance[s.id] ? '#2563eb' : '#d1d5db', position: 'relative', transition: 'background 0.2s', cursor: 'pointer' }}>
                    <div style={{ width: 16, height: 16, borderRadius: 8, background: '#fff', position: 'absolute', top: 2, left: attendance[s.id] ? 18 : 2, transition: 'left 0.2s' }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save attendance'}</button>
          {saved && <span style={{ color: '#16a34a', fontSize: 14 }}>✓ Saved!</span>}
        </div>
      </div>
    </>
  )
}

function SentMessages() {
  const [msgs, setMsgs] = useState([])
  useEffect(() => { api.getSent().then(setMsgs).catch(console.error) }, [])
  return (
    <>
      <h1 className="page-title">Sent Messages</h1>
      <p className="page-sub">{msgs.length} messages sent</p>
      {msgs.length === 0
        ? <div className="card" style={{ color: '#9ca3af', fontSize: 14 }}>No messages sent yet.</div>
        : msgs.map(m => (
          <div key={m.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontWeight: 500, fontSize: 14 }}>To: {m.to_name}</span>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{new Date(m.created_at).toLocaleString()}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>{m.subject}</div>
            <div style={{ fontSize: 13, color: '#6b7280', whiteSpace: 'pre-wrap' }}>{m.body}</div>
            <div style={{ marginTop: 6 }}><span className={`badge ${m.is_read ? 'badge-green' : 'badge-amber'}`}>{m.is_read ? 'Read' : 'Unread'}</span></div>
          </div>
        ))
      }
    </>
  )
}
