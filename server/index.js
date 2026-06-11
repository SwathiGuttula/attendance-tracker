require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const initDB  = require('./config/initDB')

const app = express()

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }))
app.use(express.json())

// Routes
app.use('/api/auth',       require('./routes/auth'))
app.use('/api/users',      require('./routes/users'))
app.use('/api/mappings',   require('./routes/mappings'))
app.use('/api/attendance', require('./routes/attendance'))
app.use('/api/messages',   require('./routes/messages'))
app.use('/api/settings',   require('./routes/settings'))

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }))

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 5000

async function start() {
  try {
    await initDB()
    app.listen(PORT, () => {
      console.log(`\n✓ Server running on http://localhost:${PORT}`)
      console.log(`✓ API ready at http://localhost:${PORT}/api`)
      console.log('\nDemo logins:')
      console.log('  admin@college.edu     / admin123')
      console.log('  priya@college.edu     / counsel123')
      console.log('  aditya@college.edu    / student123')
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()
