import React from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const icons = {
  dashboard: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  users:     <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  settings:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  chart:     <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  mail:      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  calendar:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  map:       <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>,
}

export default function Sidebar({ items, active, onNav }) {
  const { user, logout } = useAuth()

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '??'
  const roleColor = { admin: '#7c3aed', counsellor: '#2563eb', student: '#16a34a' }[user?.role] || '#6b7280'

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
        AttendTrack
      </div>

      <nav style={{ flex: 1 }}>
        {items.map((item, i) => {
          if (item.type === 'section') return <div key={i} className="nav-section">{item.label}</div>
          return (
            <button key={item.key} className={`nav-item${active === item.key ? ' active' : ''}`} onClick={() => onNav(item.key)}>
              {icons[item.icon] || null}
              {item.label}
              {item.badge > 0 && (
                <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', borderRadius: '999px', fontSize: 11, padding: '1px 7px', fontWeight: 600 }}>
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div className="avatar" style={{ background: roleColor + '20', color: roleColor }}>{initials}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#1f2937', lineHeight: 1.2 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
        <button className="btn btn-sm" style={{ width: '100%', justifyContent: 'center', color: '#dc2626', borderColor: '#fecaca' }} onClick={logout}>
          Sign out
        </button>
      </div>
    </aside>
  )
}
