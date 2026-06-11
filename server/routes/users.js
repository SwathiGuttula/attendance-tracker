const router  = require('express').Router()
const bcrypt  = require('bcryptjs')
const pool    = require('../config/db')
const { auth, requireRole } = require('../middleware/auth')

// GET /api/users — all users (admin only)
router.get('/', auth, requireRole('admin'), async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, created_at FROM users ORDER BY role, name'
  )
  res.json(rows)
})

// GET /api/users/students
router.get('/students', auth, requireRole('admin', 'counsellor'), async (req, res) => {
  const [rows] = await pool.query(
    "SELECT id, name, email, created_at FROM users WHERE role = 'student' ORDER BY name"
  )
  res.json(rows)
})

// GET /api/users/counsellors
router.get('/counsellors', auth, requireRole('admin'), async (req, res) => {
  const [rows] = await pool.query(
    "SELECT id, name, email, created_at FROM users WHERE role = 'counsellor' ORDER BY name"
  )
  res.json(rows)
})

// POST /api/users — create user (admin only)
router.post('/', auth, requireRole('admin'), async (req, res) => {
  const { name, email, password, role } = req.body
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'All fields required' })
  if (!['student', 'counsellor'].includes(role)) return res.status(400).json({ error: 'Invalid role' })

  try {
    const hashed = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)',
      [name, email, hashed, role]
    )
    res.status(201).json({ id: result.insertId, name, email, role })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists' })
    res.status(500).json({ error: 'Server error' })
  }
})

// DELETE /api/users/:id
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  await pool.query('DELETE FROM users WHERE id = ? AND role != "admin"', [req.params.id])
  res.json({ message: 'User deleted' })
})

module.exports = router
