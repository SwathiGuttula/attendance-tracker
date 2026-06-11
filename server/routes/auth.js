const router  = require('express').Router()
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const pool    = require('../config/db')

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.trim()])
    if (!rows.length) return res.status(401).json({ error: 'Invalid email or password' })

    const user = rows[0]
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' })

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/auth/me  — verify token & return user
router.get('/me', require('../middleware/auth').auth, (req, res) => {
  res.json({ user: req.user })
})

module.exports = router
