# AGENTS.md

## Project overview

学校维修记录管理系统 — BIM building maintenance management system.
Vue 2 frontend + Express backend, two separate packages (not npm workspaces).

## Commands

### Backend (backend/)

```bash
cd backend
npm install
npm run init-db   # First run only: creates JSON data files + default users
npm start          # Starts Express on port 8080
```

### Frontend (frontend/)

```bash
cd frontend
npm install
npm run serve      # Dev server on port 3000 (auto-opens browser)
npm run build      # Production build → dist/
```

No lint, typecheck, or test scripts exist in either package.

## Ports

- Backend runs on **port 8080**
- Frontend dev server on **port 3000**, proxies `/api` and `/uploads` to `http://localhost:8080`
- Actual backend code lives at `../后端/shijiazhuangxueyuanhouduan` (not in this repo)

## Architecture

### Backend (Express)

- `app.js` — entrypoint, mounts routes, starts server
- `config/db.js` — JSON file storage (reads/writes `data/*.json` files, NOT a real database)
- `config/jwt.js` — JWT secret and expiry
- `config/bimface.js` — BIMface API credentials (loaded from `.env`)
- `routes/auth.js` — login, register, user CRUD
- `routes/maintenance.js` — maintenance record CRUD + statistics + image upload
- `routes/bimface.js` — BIMface token proxy
- `middleware/` — auth middleware (JWT verification)
- `services/` — business logic
- `uploads/` — user-uploaded images (served as static files)

### Frontend (Vue 2 + Vue CLI)

See `frontend/AGENTS.md` for detailed frontend architecture and conventions.

- `src/main.js` — app entrypoint
- `src/router/index.js` — route definitions
- `src/store/` — Vuex state management
- `src/api/request.js` — Axios instance with base config
- `src/api/` — API modules matching backend routes (auth, maintenance, bimface)
- `src/views/` — page components
- `src/components/` — reusable components
- `src/config/` — app configuration (likely BIMface viewer config)
- `src/utils/` — utility functions
- `src/styles/` — SCSS styles

## Data storage

Backend uses **JSON files** in `backend/data/` as its database. There is no SQL, no ORM, no migrations. Data is read into memory on startup and written back on changes. To reset data, delete the JSON files and re-run `npm run init-db`.

## Key conventions

- All API responses follow `{ code, message, data }` format (see `API.md`)
- Auth via JWT Bearer token in `Authorization` header
- Roles: admin, teacher, student, maintenance
- Image uploads stored in `backend/uploads/`, referenced by relative URL `/uploads/filename.ext`
- Frontend uses `@` path alias pointing to `src/`

## Environment

- `backend/.env` contains BIMFACE_APP_KEY and BIMFACE_APP_SECRET
- No other env vars are required for basic operation
- Default test accounts: admin/admin123, teacher1/123456, student1/123456, fixer1/123456

## Key files for reference

- `API.md` — full REST API documentation with request/response examples
- `README.md` — project overview and quickstart
