# TaskFlow

A modern Agile Project Management platform — team workspaces, role-based access, Kanban boards, activity timelines, and audit-grade task history. Built as an evolution of a personal task manager into a multi-tenant, production-shaped SaaS app.

## Architecture

```
┌─────────────┐        HTTPS/JSON        ┌──────────────┐        Mongoose        ┌──────────┐
│  React SPA  │ ───────────────────────▶ │  Express API │ ─────────────────────▶ │ MongoDB  │
│ (Vite, JWT  │ ◀─────────────────────── │ (JWT auth,   │ ◀───────────────────── │          │
│  in memory) │   Bearer + httpOnly       │  RBAC, CSRF) │                        └──────────┘
└─────────────┘   refresh cookie          └──────────────┘
```

- **Frontend**: React 19 + Vite, Context API for state (Workspace, Task), Tailwind CSS, `@dnd-kit` for drag-and-drop, `recharts` for analytics.
- **Backend**: Express 5, Mongoose 9, MVC-style folder structure (`routes` → `controllers` → `models`).
- **Auth**: Short-lived JWT access token (kept in memory, sent as `Authorization: Bearer`) + long-lived refresh token in an `httpOnly` cookie, with rotation and reuse detection. Also supports Google OAuth and guest sessions.
- **Multi-tenancy**: Every Task belongs to a `Workspace`; a `Workspace` has `members[]` with a role (`owner` / `admin` / `manager` / `member`) enforced by middleware on every workspace-scoped route.
- **File storage**: Task attachments are stored on local disk (`/uploads`), served statically, and persisted via a Docker volume.

## Folder Structure

```
taskflow-backend/
├── controllers/     # request handling + business logic
├── middleware/       # verifyJWT, workspaceAuth (RBAC), verifyCsrf, upload, errorHandler
├── models/           # User, Workspace, Task, Comment, Activity, Notification, PendingInvite
├── routes/           # Express routers, one per resource
├── utils/            # AppError, asyncHandler, logActivity, notify, mailer, generateOtp, googleClient
├── tests/             # Jest + Supertest, run against an in-memory MongoDB
└── app.js / server.js # app.js is the exportable Express app (used by tests); server.js boots it for real

TaskFlow/ (frontend)
├── src/
│   ├── Components/   # BoardView, TaskDetailPanel, TaskComments, TaskHistory, TaskAttachments,
│   │                  # NotificationBell, WorkspaceSwitcher, MembersPanel...
│   ├── Context/       # TaskContext, WorkspaceContext
│   ├── Pages/         # Dashboard, Analytics, Activity, Settings, Trash, Login
│   ├── Layout/         # App shell + sidebar nav
│   └── api/            # axios instance (CSRF header, auth header)
```

## Authentication Flow

TaskFlow supports three ways to sign in:

1. **Email + password**, with OTP email verification — registering sends a 6-digit code (10-minute expiry, rate-limited); the account can't log in until verified.
2. **Google OAuth** — redirects to Google, verifies the ID token server-side, creates or links an account by email. Pre-verified automatically since Google already confirmed the email.
3. **Guest login** — instant session, no email/password, creates a temporary `GuestXXXX` account. A guest can later add an email/password from Settings to "upgrade" into a permanent account with the same ID (no data loss).

**Session mechanics** (shared by all three):
- Login issues a 15-minute access token (JSON response) and a 7-day refresh token (`httpOnly`, `Secure`, `SameSite=None` cookie), plus a readable `csrfToken` cookie.
- Every API call attaches `Authorization: Bearer <accessToken>`.
- On a 403 (expired access token), an axios response interceptor silently calls `GET /auth/refresh` and retries the original request.
- **Refresh rotation**: each `/auth/refresh` call invalidates the old refresh token and issues a new one. If an already-invalidated token is ever replayed (a sign of theft), all sessions for that user are revoked immediately.
- **CSRF**: `/auth/refresh` and `/auth/logout` are the only cookie-only-authenticated routes, so they require a matching `x-csrf-token` header (double-submit cookie pattern). All other routes use the Bearer header, which a cross-site attacker's page cannot forge.

## API Overview

| Resource | Base path | Notes |
|---|---|---|
| Auth | `/auth` | register, verify-otp, resend-otp, login, refresh, logout, Google OAuth, guest |
| Users | `/users` | profile (name, default priority), guest→real account upgrade |
| Workspaces | `/workspaces` | create, list mine, manage members/roles, soft-delete + trash/restore |
| Tasks | `/tasks/:workspaceId` | CRUD, reorder, search/filter/sort/paginate, soft-delete + trash/restore |
| Comments | `/tasks/:workspaceId/:taskId/comments` | `@mention`-aware, triggers notifications |
| Attachments | `/tasks/:workspaceId/:taskId/attachments` | file upload/download/delete, 10MB limit |
| Task History | `/tasks/:workspaceId/:taskId/history` | per-task change log |
| Activity | `/activity/:workspaceId` | workspace-wide timeline, paginated |
| Notifications | `/notifications` | list mine, mark read, delete, clear all |

All workspace-scoped routes require the caller to be a member of that workspace; member-management and workspace-deletion routes additionally require `admin`/`owner`. Task edit/delete is further restricted: a plain `member` can only touch tasks they created or are assigned to — `owner`/`admin`/`manager` can touch any task.

## Features

- Team workspaces with role-based access (Owner/Admin/Manager/Member)
- Kanban board with persisted drag-and-drop ordering
- Task assignment, with RBAC enforced on who can edit/delete which tasks
- Recurring tasks (daily/weekly/monthly) — completing one auto-creates the next occurrence
- File attachments on tasks
- Server-side search, filter, sort, and pagination
- Comments with `@mention` resolution
- Per-task edit history + workspace-wide activity timeline
- In-app notifications (assigned to you, mentioned in a comment)
- Soft-delete + Trash for tasks and workspaces (30-day recovery window, then auto-purged)
- Dashboard with completion/productivity charts
- Google OAuth, guest login with account upgrade, OTP email verification, real invite-by-email (auto-joins on registration)
- Refresh-token rotation with theft detection, CSRF-protected auth routes

## Tech Stack

React 19 · Vite · Tailwind CSS · Express 5 · MongoDB/Mongoose · JWT · Passport-free Google OAuth (`google-auth-library`) · Nodemailer · Multer · Jest/Supertest · Docker · GitHub Actions

## Installation

```bash
# Backend
cd taskflow-backend
npm install
cp .env.example .env   # fill in secrets
npm run dev

# Frontend
cd TaskFlow
npm install
npm run dev
```

## Environment Variables

**`taskflow-backend/.env`**
```
MONGO_URI=mongodb://localhost:27017/taskflow
ACCESS_TOKEN_SECRET=<random-secret>
REFRESH_TOKEN_SECRET=<random-secret>
PORT=3500
FRONTEND_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_CALLBACK_URL=http://localhost:3500/auth/google/callback

# Email (Gmail App Password) — used for OTP verification and workspace invites
EMAIL_USER=<your gmail address>
EMAIL_PASS=<16-character app password>
```

A root-level `.env` (next to `docker-compose.yml`) needs the same secrets, since Compose reads them into the backend container.

## Running with Docker

```bash
docker compose up --build
```

Spins up MongoDB, the backend API (port 3500), and the frontend (port 5173) together. Uploaded file attachments persist across restarts via a named volume (`backend-uploads`).

## Testing

```bash
cd taskflow-backend
npm test
```

Runs the full Jest + Supertest suite against an in-memory MongoDB (`mongodb-memory-server`) — no real database or network access needed. Covers the register → OTP → login flow and the task-level RBAC rules (who can edit/delete which tasks).

## Deployment Guide

1. Build and push images (or let your platform build from the Dockerfiles directly).
2. Point `MONGO_URI` at a managed Mongo instance (Atlas, etc.) instead of the local container.
3. Set real, unique values for `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET`.
4. Set `FRONTEND_URL` to your deployed frontend origin (CORS allowlist depends on this), and update `GOOGLE_CALLBACK_URL` to match your real domain.
5. Serve the frontend behind HTTPS — refresh/CSRF cookies use `Secure`, so they silently fail over plain HTTP (this is also why local `http://localhost` sessions can behave inconsistently — expected, resolves once deployed to real HTTPS).
6. Use persistent storage (or object storage like S3) for `/uploads` in a real multi-instance deployment — a local Docker volume works for a single instance but won't survive a full container replacement on most managed platforms.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every push/PR to `main`: installs dependencies, syntax-checks the backend, runs the Jest test suite, and lints + builds the frontend.

## Future Roadmap

- **Redis** — for session/refresh-token store and rate-limit counters, once running multiple backend instances makes in-process state unreliable.
- **PostgreSQL** — if relational integrity (e.g. strict foreign keys across workspaces/tasks/comments) becomes more valuable than Mongo's flexibility.
- **Nginx as a reverse proxy** in front of both services — TLS termination, gzip, and a single public entrypoint.
- **Monitoring & logging** — structured logs (e.g. Winston/Pino) shipped to a log aggregator, plus basic uptime/error monitoring.
- **Health checks** — `/health` endpoint reporting DB connectivity, wired into the container orchestrator's liveness/readiness probes.
- **Scheduled Activity/Notification retention** — a real cron job to auto-purge old audit-log entries, instead of letting the collection grow indefinitely (not yet a real problem at current scale).
- **Kubernetes** — not needed at a single-backend, single-frontend scale. It becomes worth introducing if this evolves into multiple independently-scaled services (e.g. splitting out a notifications worker, a file-upload service, or running several backend replicas behind a load balancer) — at that point K8s's rolling deploys, service discovery, and autoscaling solve real problems instead of adding orchestration overhead for its own sake.