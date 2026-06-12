# Student Counsellor Attendance Tracker

A cloud-ready, full-stack attendance management system with role-based dashboards for Admin, Counsellor, and Student. Built with React, Node.js/Express, and MySQL.

---

## Live Demo

> Frontend: _deploy link here_  
> Backend API: _deploy link here_

**Demo credentials:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@college.edu | admin123 |
| Counsellor | priya@college.edu | counsel123 |
| Student | aditya@college.edu | student123 |

---

## Features

- **JWT Authentication** with bcrypt password hashing and role-based route guards
- **3 Role Dashboards** — Admin, Counsellor, Student with different access levels
- **Attendance Tracking** — subject-wise daily attendance marked by counsellors
- **Threshold Alerts** — automatic red/amber alerts when attendance drops below configurable thresholds (default 75% / 85%)
- **In-app Messaging** — counsellors can send messages directly to students; unread badge on student dashboard
- **Trend Charts** — weekly attendance trend visualized with Recharts
- **Student-Counsellor Mapping** — admin assigns students to counsellors
- **Settings Panel** — admin can configure alert thresholds

---

## Tech Stack

### Frontend
- React 18 + Vite
- React Router v6 (protected routes)
- Recharts (attendance trend charts)
- Deployed on **Vercel**

### Backend
- Node.js + Express
- MySQL2 with connection pooling
- JWT (jsonwebtoken) for auth
- bcryptjs for password hashing
- Deployed on **Render**

### Database
- MySQL 8.0
- Normalized schema with foreign keys and indexes
- Auto-seeded with demo data on first run

---

## Architecture

```
attendance-tracker/
├── src/                        # React frontend
│   ├── context/AuthContext.jsx # JWT session management
│   ├── utils/api.js            # Centralized API client
│   ├── pages/
│   │   ├── admin/              # User management, mappings, settings
│   │   ├── counsellor/         # Student list, mark attendance, messaging
│   │   └── student/            # Attendance view, subject breakdown, inbox
│   └── components/             # Shared Sidebar, AttendanceBar
│
└── server/                     # Node.js backend
    ├── config/
    │   ├── db.js               # MySQL connection pool
    │   └── initDB.js           # Schema creation + seed data
    ├── middleware/
    │   └── auth.js             # JWT verify + role guard
    └── routes/
        ├── auth.js             # POST /login, GET /me
        ├── users.js            # CRUD users (admin)
        ├── mappings.js         # Student-counsellor assignments
        ├── attendance.js       # Mark + query attendance
        ├── messages.js         # Send + read messages
        └── settings.js         # Threshold configuration
```

---

## Database Schema

```sql
users        — id, name, email, password, role (admin/counsellor/student)
mappings     — student_id → counsellor_id (1:1, with FK cascade)
attendance   — student_id, subject, date, present (unique per student+subject+date)
messages     — from_id, to_id, subject, body, is_read
settings     — threshold_critical, threshold_warning
```

Indexes on `email`, `role`, `student_id+date`, `to_id` for query performance.

---

## API Endpoints

### Auth
```
POST /api/auth/login       — returns JWT token
GET  /api/auth/me          — verify token, return user
```

### Users (Admin only)
```
GET    /api/users           — all users
POST   /api/users           — create user
DELETE /api/users/:id       — delete user
```

### Attendance
```
GET  /api/attendance/student/:id/summary   — overall % + per subject
GET  /api/attendance/student/:id/trend     — weekly trend for chart
GET  /api/attendance/counsellor/summary    — all students of counsellor
GET  /api/attendance/admin/summary         — all students (admin)
POST /api/attendance/mark                  — bulk mark attendance
```

### Messages
```
POST  /api/messages              — send message
GET   /api/messages/inbox        — student inbox
GET   /api/messages/sent         — counsellor sent
GET   /api/messages/unread-count — unread badge count
PATCH /api/messages/:id/read     — mark as read
```

### Mappings & Settings
```
GET /api/mappings/my-students    — counsellor's students
PUT /api/mappings/:counsellorId  — update student assignments
GET /api/settings                — get thresholds
PUT /api/settings                — update thresholds (admin)
```

---

## Local Setup

### Prerequisites
- Node.js v18+
- MySQL 8.0

### 1. Clone the repo
```bash
git clone https://github.com/SwathiGuttula/attendance-tracker.git
cd attendance-tracker
```

### 2. Start the backend
```bash
cd server
npm install
```

Create a `.env` file in the `server/` folder:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=attendance_tracker
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```

Create the database in MySQL:
```sql
CREATE DATABASE attendance_tracker;
```

Start the server:
```bash
npm run dev
```

The server auto-creates all tables and seeds demo data on first run.

### 3. Start the frontend
```bash
# in the root folder
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Deployment

### Backend → Render
1. Create a new **Web Service** on Render
2. Connect your GitHub repo, set root directory to `server`
3. Build command: `npm install`
4. Start command: `node index.js`
5. Add environment variables (DB credentials from your MySQL host)

### Frontend → Vercel
1. Import the repo on Vercel
2. Set root directory to `.` (default)
3. Add environment variable: `VITE_API_URL=https://your-render-url.onrender.com`
4. Deploy

---

## Author

**Swathi Guttula**  
B.Tech Computer Science, KL University  
[GitHub](https://github.com/SwathiGuttula) · [LinkedIn](https://linkedin.com/in/swathiguttula)
