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
- **Auth**: Short-lived JWT access token (kept in memory, sent as `Authorization: Bearer`) + long-lived refresh token in an `httpOnly` cookie, with rotation and reuse detection.
- **Multi-tenancy**: Every Task belongs to a `Workspace`; a `Workspace` has `members[]` with a role (`owner` / `admin` / `manager` / `member`) enforced by middleware on every workspace-scoped route.

## Folder Structure

```
taskflow-backend/
├── controllers/     # request handling + business logic
├── middleware/       # verifyJWT, workspaceAuth (RBAC), verifyCsrf, errorHandler
├── models/           # User, Workspace, Task, Comment, Activity
├── routes/           # Express routers, one per resource
├── utils/            # AppError, asyncHandler, logActivity
└── server.js

TaskFlow/ (frontend)
├── src/
│   ├── Components/   # BoardView, TaskDetailPanel, TaskComments, TaskHistory, WorkspaceSwitcher...
│   ├── Context/       # TaskContext, WorkspaceContext
│   ├── Pages/         # Dashboard, Analytics, Activity, Settings
│   ├── Layout/         # App shell + sidebar nav
│   └── api/            # axios instance (CSRF header, auth header)
```

## Authentication Flow

1. **Login** — email/password → server issues a 15-minute access token (JSON response) and a 7-day refresh token (`httpOnly`, `Secure`, `SameSite=None` cookie), plus a readable `csrfToken` cookie.
2. **Every API call** — frontend attaches `Authorization: Bearer <accessToken>`.
3. **On 403 (expired access token)** — an axios response interceptor silently calls `GET /auth/refresh` (cookie sent automatically), gets a new access token, and retries the original request.
4. **Refresh rotation** — each `/auth/refresh` call invalidates the old refresh token and issues a new one. If an already-invalidated token is ever replayed (a sign of theft), **all** sessions for that user are revoked immediately.
5. **CSRF** — `/auth/refresh` and `/auth/logout` are the only cookie-only-authenticated routes, so they require a matching `x-csrf-token` header (double-submit cookie pattern). All other routes use the Bearer header, which a cross-site attacker's page cannot forge.

## API Overview

| Resource | Base path | Notes |
|---|---|---|
| Auth | `/auth` | register, login, refresh, logout |
| Workspaces | `/workspaces` | create, list mine, manage members/roles |
| Tasks | `/tasks/:workspaceId` | CRUD, reorder, search/filter/paginate |
| Comments | `/tasks/:workspaceId/:taskId/comments` | `@mention`-aware |
| Task History | `/tasks/:workspaceId/:taskId/history` | per-task change log |
| Activity | `/activity/:workspaceId` | workspace-wide timeline, paginated |

All workspace-scoped routes require the caller to be a member of that workspace; member-management routes additionally require `admin` or `owner`.

## Features

- Team workspaces with role-based access (Owner/Admin/Manager/Member)
- Kanban board with persisted drag-and-drop ordering
- Server-side search, filter, and pagination
- Comments with `@mention` resolution
- Per-task edit history + workspace-wide activity timeline
- Dashboard with completion/productivity charts
- Refresh-token rotation with theft detection, CSRF-protected auth routes

## Tech Stack

React 19 · Vite · Tailwind CSS · Express 5 · MongoDB/Mongoose · JWT · Docker · GitHub Actions

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
MONGO_URI=mongodb://localhost:27017/sprintflow
ACCESS_TOKEN_SECRET=<random-secret>
REFRESH_TOKEN_SECRET=<random-secret>
PORT=3500
FRONTEND_URL=http://localhost:5173
```

## Running with Docker

```bash
docker compose up --build
```

Spins up MongoDB, the backend API (port 3500), and the frontend (port 5173) together. Set `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` in your shell or a root `.env` before running — `docker-compose.yml` reads them from the environment rather than hardcoding secrets into the image.

## Deployment Guide

1. Build and push images (or let your platform build from the Dockerfiles directly).
2. Point `MONGO_URI` at a managed Mongo instance (Atlas, etc.) instead of the local container.
3. Set real, unique values for `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET`.
4. Set `FRONTEND_URL` to your deployed frontend origin (CORS allowlist depends on this).
5. Serve the frontend behind HTTPS — refresh/CSRF cookies use `Secure`, so they silently fail over plain HTTP.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every push/PR to `main`: installs dependencies, syntax-checks the backend, and lints + builds the frontend. Extend it with a real test job once a test suite exists.

## Future Roadmap

- **Redis** — for session/refresh-token store and rate-limit counters, once running multiple backend instances makes in-process state unreliable.
- **PostgreSQL** — if relational integrity (e.g. strict foreign keys across workspaces/tasks/comments) becomes more valuable than Mongo's flexibility.
- **Nginx as a reverse proxy** in front of both services — TLS termination, gzip, and a single public entrypoint.
- **Monitoring & logging** — structured logs (e.g. Winston/Pino) shipped to a log aggregator, plus basic uptime/error monitoring.
- **Health checks** — `/health` endpoint reporting DB connectivity, wired into the container orchestrator's liveness/readiness probes.
- **Kubernetes** — not needed at a single-backend, single-frontend scale. It becomes worth introducing if this evolves into multiple independently-scaled services (e.g. splitting out a notifications worker, a file-upload service, or running several backend replicas behind a load balancer) — at that point K8s's rolling deploys, service discovery, and autoscaling solve real problems instead of adding orchestration overhead for its own sake.