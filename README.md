
# TeamFlow — Team Task Manager

A full-stack web application for managing team tasks. Built with React + Vite + Tailwind CSS (frontend) and Node.js + Express + PostgreSQL (backend).

---

## Features

- **Auth** — Register / login with secure sessions (HTTP-only cookies, bcrypt passwords)
- **Teams** — Create teams, manage members, role-based access (owner vs member)
- **Tasks** — Create, assign, update, delete tasks with status and priority
- **Filtering** — Filter by team, assignee, status, priority, or search by title
- **Due Soon** — Dashboard banner for tasks due within 24 hours (bonus)
- **Role-based** — Only team owners can delete teams or manage members (bonus)

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Auth | Passport.js (Local Strategy), express-session |
| Session Store | connect-pg-simple (PostgreSQL) in prod; MemoryStore in dev |
| Database | PostgreSQL (Google Cloud SQL) |
| Validation | express-validator |
| Passwords | bcrypt (12 rounds) |
| Deployment | Google Cloud Run + Cloud SQL |

---

## Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 1. Clone the repo

```bash
git clone https://github.com/Salmanfayyaz123/Team-Task-Manager.git
cd team-task-manager
```

### 2. Set up the database

Create a PostgreSQL database:

```sql
CREATE DATABASE taskmanager;
```

### 3. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials and a strong SESSION_SECRET
npm install
npm run dev
```

The backend starts on **http://localhost:5000**.  
The schema is auto-applied on first run.

### 4. Frontend setup

```bash
cd frontend
cp .env.example .env
# VITE_API_URL can stay empty in dev (Vite proxies to localhost:5000)
npm install
npm run dev
```

The frontend starts on **http://localhost:5173**.

---

## API Reference

### Auth — `/auth`

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | `{name, email, password}` | Register + auto-login |
| POST | `/auth/login` | `{email, password}` | Login |
| POST | `/auth/logout` | — | Logout |
| GET | `/auth/me` | — | Get current user |

### Teams — `/teams` *(auth required)*

| Method | Path | Description |
|--------|------|-------------|
| GET | `/teams` | List my teams |
| POST | `/teams` | Create team |
| GET | `/teams/:id` | Get team + members |
| PUT | `/teams/:id` | Update team *(owner only)* |
| DELETE | `/teams/:id` | Delete team *(owner only)* |
| POST | `/teams/:id/members` | Add member by email *(owner only)* |
| DELETE | `/teams/:id/members/:userId` | Remove member *(owner only)* |

### Tasks — `/tasks` *(auth required)*

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tasks` | List tasks (with filters) |
| POST | `/tasks` | Create task |
| GET | `/tasks/:id` | Get single task |
| PUT | `/tasks/:id` | Update task |
| DELETE | `/tasks/:id` | Delete task |
| GET | `/tasks/due-soon` | Tasks due in 24 hours |

**GET /tasks query params:** `teamId`, `assignedTo`, `status`, `priority`, `search`

---

## Project Structure

```
team-task-manager/
├── backend/
│   ├── config/
│   │   ├── db.js              # PostgreSQL pool
│   │   └── passport.js        # Passport local strategy
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── teamsController.js
│   │   └── tasksController.js
│   ├── db/
│   │   ├── init.js            # Auto-run schema on startup
│   │   └── schema.sql         # Table definitions
│   ├── middleware/
│   │   ├── auth.js            # isAuthenticated, isTeamMember, isTeamOwner
│   │   └── validation.js      # express-validator rules
│   ├── routes/
│   │   ├── auth.js
│   │   ├── teams.js
│   │   └── tasks.js
│   ├── Dockerfile
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/               # Axios wrappers
    │   ├── components/        # Reusable UI components
    │   ├── context/           # AuthContext
    │   ├── pages/             # Route-level pages
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── Dockerfile
    ├── nginx.conf
    └── package.json
```
