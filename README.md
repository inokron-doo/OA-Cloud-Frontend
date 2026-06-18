# SFS SmartFeed Web App

Vite + React 19 + TypeScript single-page app for the SFS SmartFeed platform
(dashboard, feeding management, animals, analysis, setup, farm-calendar SSO).

It talks to the backend purely over HTTP (JWT Bearer tokens in `localStorage`) and
has no backend coupling. It is deployed as part of the
[`OA-Cloud-Deploy`](../OA-Cloud-Deploy) docker-compose stack — the preferred way to run the full platform. See its [`INSTALLATION.md`](../OA-Cloud-Deploy/INSTALLATION.md) for complete end-to-end setup (including Azure IoT Hub).

## Configuration

URLs are resolved at runtime (see [`src/config.ts`](src/config.ts)), in this order:

1. `window.__APP_CONFIG__` — written at container start by
   [`docker-entrypoint.sh`](docker-entrypoint.sh) from the `API_URL` /
   `FARM_CALENDAR_URL` environment variables. **No rebuild needed to change hosts.**
2. `VITE_API_URL` / `VITE_FARM_CALENDAR_URL` — build-time / `npm run dev` vars.
3. Relative defaults `/api` and `/farm-calendar/` — work out of the box behind the
   bundled reverse proxy.

| Variable             | Default                | Purpose                                            |
| -------------------- | ---------------------- | -------------------------------------------------- |
| `API_URL`            | `/api`                 | Backend API base URL (proxied, relative)           |
| `FARM_CALENDAR_URL`  | `/api/farm-calendar/`  | Backend SSO entry for the calendar (not :8002) |

The calendar opens via the backend SSO endpoint: navigating to `FARM_CALENDAR_URL`
sends the httponly `access_token` login cookie, the backend authenticates and
redirects the browser to the real calendar's `/post_auth` (the backend knows the
calendar address), which sets the `OpenAgriAuth` cookie and renders the calendar.

## Production image

The [`Dockerfile`](Dockerfile) is multi-stage:

1. **build** — `npm ci && npm run build` produces static assets (URLs are *not*
   baked in).
2. **runtime** — `nginx` serves the SPA **and** reverse-proxies the API
   ([`nginx.conf`](nginx.conf)):
   - `/`     → the SPA (with client-side routing fallback)
   - `/api/` → `backend:8080`

```bash
# Built and run by the OA-Cloud-Deploy compose stack:
cd ../OA-Cloud-Deploy && docker compose up -d --build frontend
```

## Local development

```bash
npm install
cp .env.example .env   # point VITE_API_URL / VITE_FARM_CALENDAR_URL at a running backend
npm run dev            # http://localhost:5173
```

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — type-check + production build
- `npm run preview` — preview the production build
- `npm run lint` — ESLint

## Notes

- Some views display placeholder values from [`src/MockData.ts`](src/MockData.ts)
  until real telemetry arrives from the backend. When verifying a deployment, do not
  treat on-screen data as proof the pipeline works — confirm against live backend data.

## Licence

GPL-3.0 — see [LICENSE](LICENSE). Derivative works must be released under the same
licence with source code made available.

---

*Part of the SFS SmartFeed platform by Inokron d.o.o., developed under the EU-funded
OpenAgri project (SIP13, a European Union co-funded pilot). Funded by the European Union.*
