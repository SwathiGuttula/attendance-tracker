// ─── SEED DATA ───────────────────────────────────────────────────────────────
// This runs once on first load to populate localStorage.
// Modify this file to change default users / mappings.

export const SEED_USERS = [
  // role: 'admin' | 'counsellor' | 'student'
  { id: 'u1',  name: 'Admin User',       email: 'admin@college.edu',      password: 'admin123',    role: 'admin' },
  { id: 'u2',  name: 'Dr. Priya Sharma', email: 'priya@college.edu',      password: 'counsel123',  role: 'counsellor' },
  { id: 'u3',  name: 'Mr. Ravi Kumar',   email: 'ravi@college.edu',       password: 'counsel123',  role: 'counsellor' },
  { id: 'u4',  name: 'Aditya Reddy',     email: 'aditya@college.edu',     password: 'student123',  role: 'student' },
  { id: 'u5',  name: 'Sneha Patel',      email: 'sneha@college.edu',      password: 'student123',  role: 'student' },
  { id: 'u6',  name: 'Kiran Babu',       email: 'kiran@college.edu',      password: 'student123',  role: 'student' },
  { id: 'u7',  name: 'Divya Nair',       email: 'divya@college.edu',      password: 'student123',  role: 'student' },
  { id: 'u8',  name: 'Rahul Mehta',      email: 'rahul@college.edu',      password: 'student123',  role: 'student' },
  { id: 'u9',  name: 'Ananya Das',       email: 'ananya@college.edu',     password: 'student123',  role: 'student' },
  { id: 'u10', name: 'Vikram Singh',     email: 'vikram@college.edu',     password: 'student123',  role: 'student' },
]

// counsellorId → [studentIds]
export const SEED_MAPPINGS = {
  u2: ['u4', 'u5', 'u6', 'u7'],   // Dr. Priya → 4 students
  u3: ['u8', 'u9', 'u10'],         // Mr. Ravi → 3 students
}

// subjects for each student
export const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'English', 'CS Fundamentals']

// Generate realistic attendance for the last 30 days
function generateAttendance(studentId, targetPct) {
  const records = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (d.getDay() === 0 || d.getDay() === 6) continue // skip weekends
    SUBJECTS.forEach(subject => {
      const present = Math.random() * 100 < targetPct
      records.push({
        id: `${studentId}-${d.toISOString().slice(0,10)}-${subject}`,
        studentId,
        subject,
        date: d.toISOString().slice(0, 10),
        present,
      })
    })
  }
  return records
}

// Different students have different attendance levels (some below threshold)
const STUDENT_TARGETS = {
  u4: 88,  // fine
  u5: 72,  // below 75 — critical
  u6: 83,  // between 75–85 — warning
  u7: 91,  // fine
  u8: 68,  // below 75 — critical
  u9: 79,  // between 75–85 — warning
  u10: 95, // great
}

export const SEED_ATTENDANCE = Object.entries(STUDENT_TARGETS).flatMap(
  ([id, pct]) => generateAttendance(id, pct)
)

export const SEED_SETTINGS = {
  thresholdCritical: 75,   // below this → red alert
  thresholdWarning:  85,   // below this → amber alert
}

export const SEED_MESSAGES = []
