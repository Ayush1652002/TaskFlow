# TaskFlow

A full-stack task management SaaS built with React, Node.js, Express, and MongoDB.

## Features
- JWT authentication with refresh token rotation
- Drag-and-drop task reordering
- Kanban board view (Todo / In Progress / Done)
- Priority and category labeling
- Analytics dashboard with charts
- Due date tracking with overdue detection
- Responsive design with mobile sidebar

## Tech Stack
| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Auth | JWT (Access + Refresh Token) |
| Charts | Recharts |
| DnD | @dnd-kit |

## Authentication Flow
1. User logs in → server returns `accessToken` (15min) in JSON + `refreshToken` (7d) in httpOnly cookie
2. On page load, frontend calls `GET /auth/refresh` to silently restore session
3. All protected API calls include `Authorization: Bearer <accessToken>` header
4. Axios interceptor auto-refreshes token on 403 and retries the original request

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account

### Installation

```bash
# Clone the repo
git clone https://github.com/Ayush1652002/taskflow.git

# Backend
cd taskflow-backend
cp .env.example .env
# Fill in your .env values
npm install
npm start

# Frontend (new terminal)
cd ..
npm install
npm run dev
```

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | No | Register new user |
| POST | /auth/login | No | Login, get tokens |
| GET | /auth/refresh | Cookie | Refresh access token |
| POST | /auth/logout | Cookie | Clear refresh token |
| GET | /tasks | Bearer | Get all user tasks |
| POST | /tasks | Bearer | Create task |
| PUT | /tasks/:id | Bearer | Update task |
| DELETE | /tasks/:id | Bearer | Delete task |
| DELETE | /tasks | Bearer | Delete all tasks |

## Environment Variables

See `taskflow-backend/.env.example` for required variables.

## Folder Structure
```
TaskFlow/
├── src/                  # React frontend
│   ├── api/              # Axios instance
│   ├── Components/       # TaskItem, BoardView
│   ├── Context/          # TaskContext (global state)
│   ├── hooks/            # useAxiosPrivate
│   ├── Layout/           # Sidebar layout
│   └── Pages/            # Dashboard, Analytics, Settings, Login
├── taskflow-backend/     # Express backend
│   ├── config/           # MongoDB connection
│   ├── controllers/      # Auth, Task controllers
│   ├── middleware/        # verifyJWT, errorHandler
│   ├── models/           # User, Task schemas
│   └── routes/           # Auth, Task routes
└── README.md
```