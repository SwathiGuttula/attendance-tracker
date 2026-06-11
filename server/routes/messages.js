const router = require('express').Router()
const pool   = require('../config/db')
const { auth, requireRole } = require('../middleware/auth')

// POST /api/messages — send message (counsellor → student)
router.post('/', auth, requireRole('counsellor', 'admin'), async (req, res) => {
  const { toId, subject, body } = req.body
  if (!toId || !subject || !body) return res.status(400).json({ error: 'All fields required' })
  const [result] = await pool.query(
    'INSERT INTO messages (from_id, to_id, subject, body) VALUES (?,?,?,?)',
    [req.user.id, toId, subject, body]
  )
  res.status(201).json({ id: result.insertId, message: 'Sent' })
})

// GET /api/messages/inbox — student gets their messages
router.get('/inbox', auth, requireRole('student'), async (req, res) => {
  const [rows] = await pool.query(`
    SELECT m.id, m.subject, m.body, m.is_read, m.created_at,
      u.name as from_name, u.email as from_email
    FROM messages m
    JOIN users u ON u.id = m.from_id
    WHERE m.to_id = ?
    ORDER BY m.created_at DESC
  `, [req.user.id])
  res.json(rows)
})

// GET /api/messages/sent — counsellor gets sent messages
router.get('/sent', auth, requireRole('counsellor', 'admin'), async (req, res) => {
  const [rows] = await pool.query(`
    SELECT m.id, m.subject, m.body, m.is_read, m.created_at,
      u.name as to_name, u.email as to_email
    FROM messages m
    JOIN users u ON u.id = m.to_id
    WHERE m.from_id = ?
    ORDER BY m.created_at DESC
  `, [req.user.id])
  res.json(rows)
})

// GET /api/messages/unread-count
router.get('/unread-count', auth, requireRole('student'), async (req, res) => {
  const [rows] = await pool.query(
    'SELECT COUNT(*) as count FROM messages WHERE to_id = ? AND is_read = 0',
    [req.user.id]
  )
  res.json({ count: rows[0].count })
})

// PATCH /api/messages/:id/read
router.patch('/:id/read', auth, requireRole('student'), async (req, res) => {
  await pool.query(
    'UPDATE messages SET is_read = 1 WHERE id = ? AND to_id = ?',
    [req.params.id, req.user.id]
  )
  res.json({ message: 'Marked as read' })
})

module.exports = router
