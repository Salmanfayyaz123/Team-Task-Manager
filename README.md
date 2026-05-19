
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
git clone https://github.com/YOUR_USERNAME/team-task-manager.git
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

## Google Cloud Platform Deployment

### Prerequisites

- GCP project created
- `gcloud` CLI installed and authenticated (`gcloud auth login`)
- Cloud SQL Admin API, Cloud Run API, and Artifact Registry API enabled

---

### Step 1: Create a Cloud SQL (PostgreSQL) Instance

```bash
gcloud sql instances create taskmanager-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Create the database
gcloud sql databases create taskmanager --instance=taskmanager-db

# Create a user
gcloud sql users create appuser \
  --instance=taskmanager-db \
  --password=YOUR_STRONG_PASSWORD
```

Note the **Connection Name**: `PROJECT_ID:REGION:taskmanager-db`

---

### Step 2: Deploy the Backend to Cloud Run

```bash
cd backend

# Build and push the container
gcloud builds submit --tag gcr.io/PROJECT_ID/taskmanager-backend

# Deploy to Cloud Run (with Cloud SQL connection)
gcloud run deploy taskmanager-backend \
  --image gcr.io/PROJECT_ID/taskmanager-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances PROJECT_ID:REGION:taskmanager-db \
  --set-env-vars \
    NODE_ENV=production,\
    DB_HOST=/cloudsql/PROJECT_ID:REGION:taskmanager-db,\
    DB_PORT=5432,\
    DB_NAME=taskmanager,\
    DB_USER=appuser,\
    DB_PASSWORD=YOUR_STRONG_PASSWORD,\
    SESSION_SECRET=YOUR_RANDOM_64_CHAR_STRING,\
    CLIENT_URL=https://YOUR_FRONTEND_URL.run.app
```

Copy the backend URL (e.g. `https://taskmanager-backend-xxxx-uc.a.run.app`)

---

### Step 3: Deploy the Frontend to Cloud Run

```bash
cd frontend

# Set the backend URL
echo "VITE_API_URL=https://taskmanager-backend-xxxx-uc.a.run.app" > .env

# Build and push
gcloud builds submit --tag gcr.io/PROJECT_ID/taskmanager-frontend

# Deploy
gcloud run deploy taskmanager-frontend \
  --image gcr.io/PROJECT_ID/taskmanager-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

### Step 4: Update Backend CORS

After the frontend is deployed, update the `CLIENT_URL` env var in the backend Cloud Run service to the frontend URL.

```bash
gcloud run services update taskmanager-backend \
  --region us-central1 \
  --update-env-vars CLIENT_URL=https://taskmanager-frontend-xxxx-uc.a.run.app
```

---

## Git Branching Strategy

```
main          — production-ready code
develop       — integration branch
feature/*     — individual features (e.g. feature/auth, feature/tasks-crud)
fix/*         — bug fixes
```

Suggested branch workflow for this project:
1. `feature/project-setup` — initial structure
2. `feature/auth` — register/login/session
3. `feature/teams-api` — teams CRUD
4. `feature/tasks-api` — tasks CRUD
5. `feature/frontend-auth` — login/register pages
6. `feature/frontend-dashboard` — dashboard
7. `feature/frontend-team-page` — team detail page
8. `feature/gcp-deployment` — Dockerfiles + deploy config

---

## Security Checklist

- [x] Passwords hashed with bcrypt (12 rounds)
- [x] HTTP-only session cookies
- [x] CORS restricted to frontend origin
- [x] All non-auth routes protected by `isAuthenticated` middleware
- [x] Input validation on all endpoints (express-validator)
- [x] SQL injection prevented via parameterized queries
- [x] Role-based access (owner vs member)
- [x] Session stored in PostgreSQL (production)
- [x] Secure cookie flag in production (HTTPS only)

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
