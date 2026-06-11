const router = require('express').Router()
const pool   = require('../config/db')
const { auth, requireRole } = require('../middleware/auth')

// GET /api/settings
router.get('/', auth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM settings LIMIT 1')
  res.json(rows[0] || { threshold_critical: 75, threshold_warning: 85 })
})

// PUT /api/settings
router.put('/', auth, requireRole('admin'), async (req, res) => {
  const { threshold_critical, threshold_warning } = req.body
  await pool.query(
    'UPDATE settings SET threshold_critical = ?, threshold_warning = ? WHERE id = 1',
    [threshold_critical, threshold_warning]
  )
  res.json({ message: 'Settings updated' })
})

module.exports = router
