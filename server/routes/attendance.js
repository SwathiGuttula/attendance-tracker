const router = require('express').Router()
const pool   = require('../config/db')
const { auth, requireRole } = require('../middleware/auth')

// GET /api/attendance/student/:id — get a student's full attendance
router.get('/student/:id', auth, async (req, res) => {
  const studentId = req.params.id
  // Students can only see their own; counsellors/admin can see any
  if (req.user.role === 'student' && req.user.id != studentId) {
    return res.status(403).json({ error: 'Access denied' })
  }
  const [rows] = await pool.query(
    'SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC, subject',
    [studentId]
  )
  res.json(rows)
})

// GET /api/attendance/student/:id/summary — overall % + per subject
router.get('/student/:id/summary', auth, async (req, res) => {
  const studentId = req.params.id
  if (req.user.role === 'student' && req.user.id != studentId) {
    return res.status(403).json({ error: 'Access denied' })
  }

  const [rows] = await pool.query(`
    SELECT
      subject,
      COUNT(*) as total,
      SUM(present) as present_count,
      ROUND(SUM(present) * 100.0 / COUNT(*), 0) as percentage
    FROM attendance
    WHERE student_id = ?
    GROUP BY subject
    ORDER BY subject
  `, [studentId])

  const [overall] = await pool.query(`
    SELECT
      COUNT(*) as total,
      SUM(present) as present_count,
      ROUND(SUM(present) * 100.0 / COUNT(*), 0) as percentage
    FROM attendance WHERE student_id = ?
  `, [studentId])

  res.json({ overall: overall[0], subjects: rows })
})

// GET /api/attendance/student/:id/trend — weekly trend for chart
router.get('/student/:id/trend', auth, async (req, res) => {
  const studentId = req.params.id
  if (req.user.role === 'student' && req.user.id != studentId) {
    return res.status(403).json({ error: 'Access denied' })
  }
  const [rows] = await pool.query(`
    SELECT
      YEARWEEK(date, 1) as week_key,
      MIN(date) as week_start,
      COUNT(*) as total,
      SUM(present) as present_count,
      ROUND(SUM(present) * 100.0 / COUNT(*), 0) as percentage
    FROM attendance
    WHERE student_id = ?
    GROUP BY YEARWEEK(date, 1)
    ORDER BY week_key DESC
    LIMIT 6
  `, [studentId])
  res.json(rows.reverse())
})

// GET /api/attendance/counsellor/summary — all students of this counsellor with %
router.get('/counsellor/summary', auth, requireRole('counsellor'), async (req, res) => {
  const [rows] = await pool.query(`
    SELECT
      u.id, u.name, u.email,
      COUNT(a.id) as total,
      SUM(a.present) as present_count,
      ROUND(COALESCE(SUM(a.present) * 100.0 / NULLIF(COUNT(a.id), 0), 0), 0) as percentage
    FROM mappings m
    JOIN users u ON u.id = m.student_id
    LEFT JOIN attendance a ON a.student_id = u.id
    WHERE m.counsellor_id = ?
    GROUP BY u.id, u.name, u.email
    ORDER BY percentage ASC
  `, [req.user.id])
  res.json(rows)
})

// GET /api/attendance/admin/summary — all students summary (admin)
router.get('/admin/summary', auth, requireRole('admin'), async (req, res) => {
  const [rows] = await pool.query(`
    SELECT
      u.id, u.name, u.email,
      c.name as counsellor_name,
      COUNT(a.id) as total,
      SUM(a.present) as present_count,
      ROUND(COALESCE(SUM(a.present) * 100.0 / NULLIF(COUNT(a.id), 0), 0), 0) as percentage
    FROM users u
    LEFT JOIN mappings m ON m.student_id = u.id
    LEFT JOIN users c ON c.id = m.counsellor_id
    LEFT JOIN attendance a ON a.student_id = u.id
    WHERE u.role = 'student'
    GROUP BY u.id, u.name, u.email, c.name
    ORDER BY percentage ASC
  `)
  res.json(rows)
})

// POST /api/attendance/mark — mark attendance for multiple students (counsellor)
router.post('/mark', auth, requireRole('counsellor', 'admin'), async (req, res) => {
  const { records } = req.body
  // records: [{ studentId, subject, date, present }]
  if (!records || !records.length) return res.status(400).json({ error: 'No records provided' })

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    for (const r of records) {
      await conn.query(`
        INSERT INTO attendance (student_id, subject, date, present, marked_by)
        VALUES (?,?,?,?,?)
        ON DUPLICATE KEY UPDATE present = VALUES(present), marked_by = VALUES(marked_by)
      `, [r.studentId, r.subject, r.date, r.present ? 1 : 0, req.user.id])
    }
    await conn.commit()
    res.json({ message: `${records.length} records saved` })
  } catch (err) {
    await conn.rollback()
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  } finally {
    conn.release()
  }
})

module.exports = router
