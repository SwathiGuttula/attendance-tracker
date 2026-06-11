import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import Sidebar from '../../components/Sidebar.jsx'
import AttendanceBar from '../../components/AttendanceBar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { api } from '../../utils/api.js'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [view, setView]     = useState('overview')
  const [unread, setUnread] = useState(0)

  async function refreshUnread() {
    try { const d = await api.getUnreadCount(); setUnread(d.count) } catch {}
  }

  useEffect(() => { refreshUnread() }, [view])

  const NAV = [
    { key: 'overview', label: 'My Attendance', icon: 'dashboard' },
    { key: 'subjects', label: 'Subject-wise',  icon: 'chart' },
    { key: 'messages', label: 'Messages',       icon: 'mail', badge: unread },
  ]

  return (
    <div className="layout">
      <Sidebar items={NAV} active={view} onNav={setView} />
      <main className="main-content">
        {view === 'overview' && <Overview studentId={user.id} />}
        {view === 'subjects' && <SubjectView studentId={user.id} />}
        {view === 'messages' && <MessagesView studentId={user.id} onRead={refreshUnread} />}
      </main>
    </div>
  )
}

function Overview({ studentId }) {
  const [summary, setSummary]     = useState(null)
  const [trend, setTrend]         = useState([])
  const [recent, setRecent]       = useState([])
  const [counsellor, setCounsellor] = useState(null)
  const [settings, setSettings]   = useState({ threshold_critical: 75, threshold_warning: 85 })
  const [unread, setUnread]       = useState(0)

  useEffect(() => {
    Promise.all([
      api.getStudentSummary(studentId),
      api.getStudentTrend(studentId),
      api.getStudentAttendance(studentId),
      api.getMyCounsellor(),
      api.getSettings(),
      api.getUnreadCount(),
    ]).then(([sum, tr, rec, c, set, ur]) => {
      setSummary(sum); setTrend(tr); setRecent(rec.slice(0, 10)); setCounsellor(c); setSettings(set); setUnread(ur.count)
    }).catch(console.error)
  }, [studentId])

  if (!summary) return <div style={{ color: '#9ca3af', padding: '2rem' }}>Loading…</div>

  const overall = summary.overall
  const thr = { thresholdCritical: settings.threshold_critical, thresholdWarning: settings.threshold_warning }
  const status = overall.percentage < settings.threshold_critical ? 'critical' : overall.percentage < settings.threshold_warning ? 'warning' : 'ok'

  return (
    <>
      <div className="topbar">
        <div><h1 className="page-title">My Attendance</h1><p className="page-sub">Your academic attendance summary</p></div>
      </div>

      {status === 'critical' && <div className="alert alert-red" style={{ marginBottom: 16 }}>⚠ <strong>Critical:</strong> Your attendance is {overall.percentage}%, below the {settings.threshold_critical}% required threshold. Please meet your counsellor immediately.</div>}
      {status === 'warning'  && <div className="alert alert-amber" style={{ marginBottom: 16 }}>△ <strong>Warning:</strong> Your attendance is {overall.percentage}%, below {settings.threshold_warning}%. Improve attendance to avoid further action.</div>}
      {unread > 0 && <div className="alert alert-blue" style={{ marginBottom: 16 }}>📬 You have <strong>{unread} unread message(s)</strong> from your counsellor. Check the Messages tab.</div>}

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Overall</div>
          <div className="stat-value" style={{ color: status === 'critical' ? '#dc2626' : status === 'warning' ? '#d97706' : '#16a34a' }}>{overall.percentage}%</div>
          <div className="stat-sub">{status === 'critical' ? 'Critical' : status === 'warning' ? 'Warning' : 'Good'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Present</div>
          <div className="stat-value">{overall.present_count}</div>
          <div className="stat-sub">out of {overall.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Absent</div>
          <div className="stat-value" style={{ color: (overall.total - overall.present_count) > 5 ? '#dc2626' : '#1f2937' }}>{overall.total - overall.present_count}</div>
          <div className="stat-sub">classes missed</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Counsellor</div>
          <div style={{ fontSize: 15, fontWeight: 500, marginTop: 4 }}>{counsellor?.name || '—'}</div>
          <div className="stat-sub">{counsellor?.email || 'Not assigned'}</div>
        </div>
      </div>

      {trend.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Attendance trend (last 6 weeks)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend.map(t => ({ week: t.week_start, pct: t.percentage }))}>
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
              <Tooltip formatter={v => v + '%'} />
              <ReferenceLine y={settings.threshold_critical} stroke="#dc2626" strokeDasharray="4 2" label={{ value: `${settings.threshold_critical}% min`, position: 'right', fontSize: 11, fill: '#dc2626' }} />
              <ReferenceLine y={settings.threshold_warning}  stroke="#d97706" strokeDasharray="4 2" label={{ value: `${settings.threshold_warning}% target`, position: 'right', fontSize: 11, fill: '#d97706' }} />
              <Line type="monotone" dataKey="pct" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: '#2563eb' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Recent attendance</h3>
        <table className="table">
          <thead><tr><th>Date</th><th>Subject</th><th>Status</th></tr></thead>
          <tbody>
            {recent.map(r => (
              <tr key={r.id}>
                <td>{r.date?.slice(0,10) || r.date}</td>
                <td>{r.subject}</td>
                <td><span className={`badge ${r.present ? 'badge-green' : 'badge-red'}`}>{r.present ? 'Present' : 'Absent'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function SubjectView({ studentId }) {
  const [summary, setSummary] = useState(null)
  const [settings, setSettings] = useState({ threshold_critical: 75, threshold_warning: 85 })

  useEffect(() => {
    Promise.all([api.getStudentSummary(studentId), api.getSettings()])
      .then(([sum, set]) => { setSummary(sum); setSettings(set) })
      .catch(console.error)
  }, [studentId])

  if (!summary) return <div style={{ color: '#9ca3af', padding: '2rem' }}>Loading…</div>

  const thr = { thresholdCritical: settings.threshold_critical, thresholdWarning: settings.threshold_warning }

  return (
    <>
      <h1 className="page-title">Subject-wise Attendance</h1>
      <p className="page-sub">Breakdown by each subject</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {summary.subjects.map(s => {
          const status = s.percentage < settings.threshold_critical ? 'critical' : s.percentage < settings.threshold_warning ? 'warning' : 'ok'
          return (
            <div key={s.subject} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{s.subject}</span>
                <span className={`badge ${status === 'critical' ? 'badge-red' : status === 'warning' ? 'badge-amber' : 'badge-green'}`}>{s.percentage}%</span>
              </div>
              <AttendanceBar pct={s.percentage} settings={thr} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, color: '#9ca3af' }}>
                <span>Attended: {s.present_count}</span>
                <span>Missed: {s.total - s.present_count}</span>
                <span>Total: {s.total}</span>
              </div>
              {status === 'critical' && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#dc2626', background: '#fef2f2', padding: '6px 10px', borderRadius: 6 }}>
                  Need {Math.ceil((settings.threshold_critical / 100 * s.total) - s.present_count)} more classes to reach {settings.threshold_critical}%
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

function MessagesView({ onRead }) {
  const { user } = useAuth()
  const [msgs, setMsgs] = useState([])
  const [open, setOpen] = useState(null)

  useEffect(() => { api.getInbox().then(setMsgs).catch(console.error) }, [])

  async function openMsg(msg) {
    if (!msg.is_read) {
      await api.markRead(msg.id)
      setMsgs(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: 1 } : m))
      onRead()
    }
    setOpen(msg)
  }

  return (
    <>
      <h1 className="page-title">Messages</h1>
      <p className="page-sub">Messages from your counsellor</p>
      {msgs.length === 0
        ? <div className="card" style={{ color: '#9ca3af', fontSize: 14 }}>No messages yet.</div>
        : msgs.map(m => (
          <div key={m.id} className="card" style={{ marginBottom: 10, cursor: 'pointer', borderLeft: m.is_read ? '3px solid #e5e7eb' : '3px solid #2563eb' }} onClick={() => openMsg(m)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontWeight: m.is_read ? 400 : 600, fontSize: 14 }}>{m.subject}</span>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>From: {m.from_name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{new Date(m.created_at).toLocaleDateString()}</div>
                {!m.is_read && <span className="badge badge-blue" style={{ marginTop: 4, fontSize: 11 }}>New</span>}
              </div>
            </div>
          </div>
        ))
      }
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(null)}>
          <div className="modal" style={{ minWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div className="modal-title" style={{ marginBottom: 2 }}>{open.subject}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>From {open.from_name} · {new Date(open.created_at).toLocaleString()}</div>
              </div>
              <button className="btn btn-sm" onClick={() => setOpen(null)}>Close</button>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: '#374151', whiteSpace: 'pre-wrap', background: '#f9fafb', borderRadius: 8, padding: '12px 14px' }}>{open.body}</div>
          </div>
        </div>
      )}
    </>
  )
}
