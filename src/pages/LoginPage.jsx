import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  if (user) {
    navigate(user.role === 'admin' ? '/admin' : user.role === 'counsellor' ? '/counsellor' : '/student')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const u = await login(email.trim(), password)
      navigate(u.role === 'admin' ? '/admin' : u.role === 'counsellor' ? '/counsellor' : '/student')
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(role) {
    if (role === 'admin')      { setEmail('admin@college.edu');  setPassword('admin123') }
    if (role === 'counsellor') { setEmail('priya@college.edu');  setPassword('counsel123') }
    if (role === 'student')    { setEmail('aditya@college.edu'); setPassword('student123') }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff 0%, #f9fafb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1f2937' }}>Attendance Tracker</h1>
          <p style={{ fontSize: 14, color: '#9ca3af', marginTop: 4 }}>Student–Counsellor Portal</p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Email address</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@college.edu" required />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <div className="alert alert-red" style={{ marginBottom: 14 }}>{error}</div>}
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <div style={{ marginTop: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1rem' }}>
          <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10, textAlign: 'center', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demo quick-login</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['admin', 'counsellor', 'student'].map(role => (
              <button key={role} className="btn btn-sm" onClick={() => fillDemo(role)} style={{ fontSize: 13, textTransform: 'capitalize' }}>
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
