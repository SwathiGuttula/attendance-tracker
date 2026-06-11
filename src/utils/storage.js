import { SEED_USERS, SEED_MAPPINGS, SEED_ATTENDANCE, SEED_SETTINGS, SEED_MESSAGES } from '../data/seed.js'

const KEYS = {
  users:      'att_users',
  mappings:   'att_mappings',
  attendance: 'att_attendance',
  settings:   'att_settings',
  messages:   'att_messages',
  session:    'att_session',
}

function get(key) {
  try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
}
function set(key, val) {
  localStorage.setItem(key, JSON.stringify(val))
}

// ─── INIT ────────────────────────────────────────────────────────────────────
export function initStorage() {
  if (!get(KEYS.users))      set(KEYS.users,      SEED_USERS)
  if (!get(KEYS.mappings))   set(KEYS.mappings,   SEED_MAPPINGS)
  if (!get(KEYS.attendance)) set(KEYS.attendance, SEED_ATTENDANCE)
  if (!get(KEYS.settings))   set(KEYS.settings,   SEED_SETTINGS)
  if (!get(KEYS.messages))   set(KEYS.messages,   SEED_MESSAGES)
}

// ─── AUTH ────────────────────────────────────────────────────────────────────
export function login(email, password) {
  const users = get(KEYS.users) || []
  const user  = users.find(u => u.email === email && u.password === password)
  if (user) {
    const session = { id: user.id, name: user.name, email: user.email, role: user.role }
    set(KEYS.session, session)
    return session
  }
  return null
}

export function logout() { localStorage.removeItem(KEYS.session) }
export function getSession() { return get(KEYS.session) }

// ─── USERS ───────────────────────────────────────────────────────────────────
export function getUsers()    { return get(KEYS.users) || [] }
export function getStudents() { return getUsers().filter(u => u.role === 'student') }
export function getCounsellors() { return getUsers().filter(u => u.role === 'counsellor') }

export function addUser(user) {
  const users = getUsers()
  users.push({ ...user, id: 'u' + Date.now() })
  set(KEYS.users, users)
}

export function deleteUser(userId) {
  set(KEYS.users, getUsers().filter(u => u.id !== userId))
  // also clean mappings
  const mappings = getMappings()
  Object.keys(mappings).forEach(cid => {
    mappings[cid] = mappings[cid].filter(sid => sid !== userId)
  })
  delete mappings[userId]
  set(KEYS.mappings, mappings)
}

// ─── MAPPINGS ────────────────────────────────────────────────────────────────
export function getMappings()   { return get(KEYS.mappings) || {} }

export function getCounsellorStudents(counsellorId) {
  const mappings = getMappings()
  const studentIds = mappings[counsellorId] || []
  return getStudents().filter(s => studentIds.includes(s.id))
}

export function getStudentCounsellor(studentId) {
  const mappings = getMappings()
  for (const [cid, sids] of Object.entries(mappings)) {
    if (sids.includes(studentId)) {
      return getUsers().find(u => u.id === cid) || null
    }
  }
  return null
}

export function setMapping(counsellorId, studentIds) {
  const mappings = getMappings()
  mappings[counsellorId] = studentIds
  set(KEYS.mappings, mappings)
}

// ─── ATTENDANCE ──────────────────────────────────────────────────────────────
export function getAttendance() { return get(KEYS.attendance) || [] }

export function getStudentAttendance(studentId) {
  return getAttendance().filter(r => r.studentId === studentId)
}

export function calcAttendancePct(records) {
  if (!records.length) return 0
  const present = records.filter(r => r.present).length
  return Math.round((present / records.length) * 100)
}

export function getSubjectAttendance(studentId) {
  const records = getStudentAttendance(studentId)
  const subjects = [...new Set(records.map(r => r.subject))]
  return subjects.map(subject => {
    const sub = records.filter(r => r.subject === subject)
    return { subject, pct: calcAttendancePct(sub), total: sub.length, present: sub.filter(r => r.present).length }
  })
}

export function addAttendanceRecord(record) {
  const records = getAttendance()
  // prevent duplicates
  const exists = records.find(r => r.id === record.id)
  if (!exists) records.push(record)
  set(KEYS.attendance, records)
}

export function markAttendance(studentId, date, subject, present) {
  const id = `${studentId}-${date}-${subject}`
  const records = getAttendance().filter(r => r.id !== id)
  records.push({ id, studentId, subject, date, present })
  set(KEYS.attendance, records)
}

// weekly attendance for trend chart
export function getWeeklyTrend(studentId) {
  const records = getStudentAttendance(studentId)
  const weeks = {}
  records.forEach(r => {
    const d = new Date(r.date)
    const week = `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleString('default', { month: 'short' })}`
    if (!weeks[week]) weeks[week] = { total: 0, present: 0 }
    weeks[week].total++
    if (r.present) weeks[week].present++
  })
  return Object.entries(weeks).slice(-6).map(([week, v]) => ({
    week,
    pct: Math.round((v.present / v.total) * 100)
  }))
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
export function getSettings()         { return get(KEYS.settings) || { thresholdCritical: 75, thresholdWarning: 85 } }
export function saveSettings(s)       { set(KEYS.settings, s) }

// ─── MESSAGES ────────────────────────────────────────────────────────────────
export function getMessages() { return get(KEYS.messages) || [] }

export function getMessagesForStudent(studentId) {
  return getMessages().filter(m => m.toId === studentId).sort((a,b) => b.timestamp - a.timestamp)
}

export function getMessagesSentByCounsellor(counsellorId) {
  return getMessages().filter(m => m.fromId === counsellorId).sort((a,b) => b.timestamp - a.timestamp)
}

export function sendMessage({ fromId, fromName, toId, toName, subject, body }) {
  const msgs = getMessages()
  msgs.push({
    id: 'msg' + Date.now(),
    fromId, fromName, toId, toName,
    subject, body,
    timestamp: Date.now(),
    read: false,
  })
  set(KEYS.messages, msgs)
}

export function markMessageRead(msgId) {
  const msgs = getMessages().map(m => m.id === msgId ? { ...m, read: true } : m)
  set(KEYS.messages, msgs)
}

export function getUnreadCount(studentId) {
  return getMessagesForStudent(studentId).filter(m => !m.read).length
}

// ─── ALERT STATUS ────────────────────────────────────────────────────────────
export function getAttendanceStatus(pct, settings) {
  if (pct < settings.thresholdCritical) return 'critical'
  if (pct < settings.thresholdWarning)  return 'warning'
  return 'ok'
}
