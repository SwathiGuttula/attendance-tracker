const router = require('express').Router()
const pool   = require('../config/db')
const { auth, requireRole } = require('../middleware/auth')

// GET /api/mappings — all mappings (admin)
router.get('/', auth, requireRole('admin'), async (req, res) => {
  const [rows] = await pool.query(`
    SELECT m.student_id, m.counsellor_id,
      s.name as student_name, c.name as counsellor_name
    FROM mappings m
    JOIN users s ON s.id = m.student_id
    JOIN users c ON c.id = m.counsellor_id
    ORDER BY c.name, s.name
  `)
  res.json(rows)
})

// GET /api/mappings/my-students — counsellor gets their students
router.get('/my-students', auth, requireRole('counsellor'), async (req, res) => {
  const [rows] = await pool.query(`
    SELECT u.id, u.name, u.email
    FROM mappings m
    JOIN users u ON u.id = m.student_id
    WHERE m.counsellor_id = ?
    ORDER BY u.name
  `, [req.user.id])
  res.json(rows)
})

// GET /api/mappings/my-counsellor — student gets their counsellor
router.get('/my-counsellor', auth, requireRole('student'), async (req, res) => {
  const [rows] = await pool.query(`
    SELECT u.id, u.name, u.email
    FROM mappings m
    JOIN users u ON u.id = m.counsellor_id
    WHERE m.student_id = ?
  `, [req.user.id])
  res.json(rows[0] || null)
})

// PUT /api/mappings/:counsellorId — set students for a counsellor (admin)
router.put('/:counsellorId', auth, requireRole('admin'), async (req, res) => {
  const { studentIds } = req.body  // array of student IDs
  const counsellorId = req.params.counsellorId
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    // Remove existing mappings for these students (a student can only have one counsellor)
    if (studentIds.length) {
      await conn.query('DELETE FROM mappings WHERE counsellor_id = ?', [counsellorId])
      for (const sid of studentIds) {
        await conn.query(
          'INSERT INTO mappings (student_id, counsellor_id) VALUES (?,?) ON DUPLICATE KEY UPDATE counsellor_id = ?',
          [sid, counsellorId, counsellorId]
        )
      }
    } else {
      await conn.query('DELETE FROM mappings WHERE counsellor_id = ?', [counsellorId])
    }
    await conn.commit()
    res.json({ message: 'Mapping updated' })
  } catch (err) {
    await conn.rollback()
    res.status(500).json({ error: 'Server error' })
  } finally {
    conn.release()
  }
})

module.exports = router
