// Central API client — replaces storage.js
// All calls go to the Express backend

const BASE = 'https://attendance-tracker-production-4626.up.railway.app/api'

function getToken() {
  return localStorage.getItem('att_token')
}

async function request(method, path, body) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  // Auth
  login:   (email, password) => request('POST', '/auth/login', { email, password }),
  me:      ()                => request('GET',  '/auth/me'),

  // Users
  getUsers:       () => request('GET',  '/users'),
  getStudents:    () => request('GET',  '/users/students'),
  getCounsellors: () => request('GET',  '/users/counsellors'),
  addUser:        (u) => request('POST', '/users', u),
  deleteUser:     (id) => request('DELETE', `/users/${id}`),

  // Mappings
  getMappings:        ()           => request('GET', '/mappings'),
  getMyStudents:      ()           => request('GET', '/mappings/my-students'),
  getMyCounsellor:    ()           => request('GET', '/mappings/my-counsellor'),
  setMapping:         (cid, sids)  => request('PUT', `/mappings/${cid}`, { studentIds: sids }),

  // Attendance
  getStudentAttendance: (id) => request('GET', `/attendance/student/${id}`),
  getStudentSummary:    (id) => request('GET', `/attendance/student/${id}/summary`),
  getStudentTrend:      (id) => request('GET', `/attendance/student/${id}/trend`),
  getCounsellorSummary: ()   => request('GET', '/attendance/counsellor/summary'),
  getAdminSummary:      ()   => request('GET', '/attendance/admin/summary'),
  markAttendance:       (records) => request('POST', '/attendance/mark', { records }),

  // Messages
  sendMessage:    (msg)  => request('POST',  '/messages', msg),
  getInbox:       ()     => request('GET',   '/messages/inbox'),
  getSent:        ()     => request('GET',   '/messages/sent'),
  getUnreadCount: ()     => request('GET',   '/messages/unread-count'),
  markRead:       (id)   => request('PATCH', `/messages/${id}/read`),

  // Settings
  getSettings:    ()  => request('GET', '/settings'),
  saveSettings:   (s) => request('PUT', '/settings', s),
}

// Token helpers
export function saveToken(token) { localStorage.setItem('att_token', token) }
export function clearToken()     { localStorage.removeItem('att_token') }
export function hasToken()       { return !!localStorage.getItem('att_token') }
