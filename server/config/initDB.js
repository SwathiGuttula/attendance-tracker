const pool = require('./db')
const bcrypt = require('bcryptjs')

async function initDB() {
  const conn = await pool.getConnection()
  try {
    console.log('Setting up database tables...')

    // Users table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin','counsellor','student') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role)
      )
    `)

    // Student-counsellor mapping
    await conn.query(`
      CREATE TABLE IF NOT EXISTS mappings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        counsellor_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_student (student_id),
        FOREIGN KEY (student_id)    REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (counsellor_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_counsellor (counsellor_id)
      )
    `)

    // Attendance records
    await conn.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        subject VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        present TINYINT(1) NOT NULL DEFAULT 0,
        marked_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_record (student_id, subject, date),
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_student_date (student_id, date),
        INDEX idx_subject (subject)
      )
    `)

    // Messages
    await conn.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        from_id INT NOT NULL,
        to_id INT NOT NULL,
        subject VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (to_id)   REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_to (to_id),
        INDEX idx_from (from_id)
      )
    `)

    // Settings
    await conn.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        threshold_critical INT DEFAULT 75,
        threshold_warning  INT DEFAULT 85,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // ── SEED DATA ──────────────────────────────────────────────────────────────
    const [existing] = await conn.query('SELECT COUNT(*) as count FROM users')
    if (existing[0].count > 0) {
      console.log('Database already seeded, skipping.')
      return
    }

    console.log('Seeding initial data...')
    const hash = pwd => bcrypt.hashSync(pwd, 10)

    // Insert users
    const [adminRes]  = await conn.query(`INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)`,
      ['Admin User', 'admin@college.edu', hash('admin123'), 'admin'])
    const [priyaRes]  = await conn.query(`INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)`,
      ['Dr. Priya Sharma', 'priya@college.edu', hash('counsel123'), 'counsellor'])
    const [raviRes]   = await conn.query(`INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)`,
      ['Mr. Ravi Kumar', 'ravi@college.edu', hash('counsel123'), 'counsellor'])

    const students = [
      ['Aditya Reddy',  'aditya@college.edu'],
      ['Sneha Patel',   'sneha@college.edu'],
      ['Kiran Babu',    'kiran@college.edu'],
      ['Divya Nair',    'divya@college.edu'],
      ['Rahul Mehta',   'rahul@college.edu'],
      ['Ananya Das',    'ananya@college.edu'],
      ['Vikram Singh',  'vikram@college.edu'],
    ]
    const studentIds = []
    for (const [name, email] of students) {
      const [res] = await conn.query(`INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)`,
        [name, email, hash('student123'), 'student'])
      studentIds.push(res.insertId)
    }

    // Mappings: priya → first 4, ravi → last 3
    for (const sid of studentIds.slice(0, 4)) {
      await conn.query(`INSERT INTO mappings (student_id, counsellor_id) VALUES (?,?)`, [sid, priyaRes.insertId])
    }
    for (const sid of studentIds.slice(4)) {
      await conn.query(`INSERT INTO mappings (student_id, counsellor_id) VALUES (?,?)`, [sid, raviRes.insertId])
    }

    // Settings
    await conn.query(`INSERT INTO settings (threshold_critical, threshold_warning) VALUES (75, 85)`)

    // Seed attendance for last 30 weekdays
    const subjects = ['Mathematics', 'Physics', 'Chemistry', 'English', 'CS Fundamentals']
    const targets  = [88, 72, 83, 91, 68, 79, 95] // per student

    const today = new Date()
    for (let si = 0; si < studentIds.length; si++) {
      const sid    = studentIds[si]
      const target = targets[si]
      let dayCount = 0
      let d = new Date(today)

      while (dayCount < 30) {
        d.setDate(d.getDate() - 1)
        if (d.getDay() === 0 || d.getDay() === 6) continue
        dayCount++
        const dateStr = d.toISOString().slice(0, 10)
        for (const subject of subjects) {
          const present = Math.random() * 100 < target ? 1 : 0
          await conn.query(
            `INSERT IGNORE INTO attendance (student_id, subject, date, present) VALUES (?,?,?,?)`,
            [sid, subject, dateStr, present]
          )
        }
      }
    }

    console.log('✓ Database seeded successfully!')
  } finally {
    conn.release()
  }
}

module.exports = initDB
