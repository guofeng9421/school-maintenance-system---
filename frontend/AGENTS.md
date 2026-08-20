# AGENTS.md — Frontend

## Overview

Vue 2.7 + Element UI 2.15 + Vuex 3 + Vue Router 3 + ECharts + BIMface SDK.
Built with Vue CLI 5 + Webpack. SCSS for styles.

## Commands

```bash
npm install
npm run serve      # Dev server on port 3000 (auto-opens browser)
npm run build      # Production build → dist/
```

No lint, typecheck, or test scripts exist.

## Dev server proxy

`vue.config.js` proxies `/api` and `/uploads` to `http://localhost:8080`.
Backend runs on port **8080**. No fix needed.
(Actual backend code lives outside this repo at `../后端/shijiazhuangxueyuanhouduan`)

## Architecture

```
src/
├── main.js              # Entrypoint: registers Element UI, mounts $API on Vue.prototype
├── App.vue              # Root component (just <router-view />)
├── router/index.js      # Route definitions with auth guard
├── store/
│   ├── index.js         # Vuex store
│   └── modules/user.js  # User state: login/logout, token+user in localStorage
├── api/
│   ├── request.js       # Axios instance (baseURL: /api, JWT interceptor, 401 redirect)
│   ├── index.js         # Central export: { authApi, maintenanceApi, bimfaceApi }
│   ├── auth.js          # Login, register, user CRUD
│   ├── maintenance.js   # Maintenance CRUD + statistics + image upload + export
│   └── bimface.js       # BIMface model list
├── views/
│   ├── LayoutView.vue   # Main layout: sidebar + header + router-view
│   ├── auth/            # LoginView, RegisterView, UserManageView
│   ├── bim/             # BimModelView (3D viewer)
│   ├── dashboard/       # DashboardView (ECharts stats)
│   └── maintenance/     # ListView, FormView (create+edit), DetailView
├── components/          # Empty — all components live in views/
├── config/
│   ├── bimModels.js     # BIMface model tokens and default view config
│   └── constants.js     # Status/priority/category/role maps (Chinese labels + Element UI types)
├── utils/index.js       # formatDate, formatDateOnly helpers
└── styles/global.scss   # Global reset + .page-container + .filter-bar classes
```

## Key patterns

### API calls
- All API functions are in `src/api/*.js`, using the shared Axios instance from `request.js`
- Accessible globally via `this.$API.authApi.login()` (mounted on Vue.prototype in main.js)
- Response format: `{ code, message, data }` — check `code === 200` for success
- 401 responses auto-redirect to `/login` and clear localStorage

### Routing
- History mode (no `#` in URL)
- Auth guard: no token → redirect to `/login` (except `/login` and `/register`)
- Admin guard: `meta.requiresAdmin` checks `user.role === 'admin'`
- `LayoutView.vue` wraps all authenticated pages as child routes
- Maintenance pages (`/maintenance/*`) all highlight the same sidebar item

### State management
- Single Vuex module: `user` (namespaced)
- Token and user object persisted in localStorage (not just Vuex)
- Getters: `isLoggedIn`, `isAdmin`, `isMaintenance`

### BIMface integration
- Model tokens hardcoded in `src/config/bimModels.js` (2 buildings)
- API also fetches models from backend `/api/bimface/models`
- `src/api/bimface.js` has commented-out alternative endpoint for real BIMface API

### Element UI
- Registered globally with `{ size: 'small', zIndex: 3000 }`
- Uses Element UI components directly (no custom component wrappers)
- SCSS scoped styles in each `.vue` file

## Conventions

- All UI text is Chinese (labels, messages, placeholders)
- Role-based visibility: `v-if="isAdmin"` for admin-only menu items
- Date formatting via `src/utils/index.js` helpers (Chinese locale)
- Status/priority/category enums defined in `src/config/constants.js` — use these maps, don't hardcode strings
- Keep-alive used in LayoutView for routes with `:id` params (detail/edit pages)

## Gotchas

- `components/` directory is empty — all UI is in `views/`
- `vue.config.js` deletes the copy-webpack-plugin (no static file copying)
- LoginView has registration link commented out — registration works via API but UI is hidden
- `MaintenanceFormView` handles both create and edit (same component, different route)
- Image upload timeout is 30s (overrides default 10s Axios timeout)
