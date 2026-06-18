// Centralised runtime configuration.
//
// Resolution order (first non-empty wins):
//   1. window.__APP_CONFIG__  — injected at container start by docker-entrypoint.sh
//                               from environment variables (no rebuild needed).
//   2. import.meta.env.VITE_* — baked in at `vite build` / used by `vite dev`.
//   3. Relative-path defaults — work out of the box behind the bundled reverse proxy.
//
// Both defaults are relative, so the production image is host/IP agnostic:
// clone, `docker compose up`, done.
//
// FARM_CALENDAR_URL is the backend SSO ENTRY endpoint, NOT the calendar service
// itself. Opening it (top-level navigation / iframe) sends the httponly
// `access_token` login cookie -> the backend authenticates, then redirects the
// browser to the real calendar's /post_auth?access_token=... (the backend knows
// the calendar's address via its own FARM_CALENDAR_URL env), which sets the
// OpenAgriAuth cookie and renders the calendar. Pointing straight at the calendar
// (:8002) skips auth and lands on the calendar's loading/login screen.

interface AppConfig {
  API_URL: string;
  FARM_CALENDAR_URL: string;
}

const runtime: Partial<AppConfig> =
  (window as unknown as { __APP_CONFIG__?: Partial<AppConfig> }).__APP_CONFIG__ ?? {};

export const config: AppConfig = {
  API_URL:
    runtime.API_URL ||
    (import.meta.env.VITE_API_URL as string | undefined) ||
    "/api/v1",
  FARM_CALENDAR_URL:
    runtime.FARM_CALENDAR_URL ||
    (import.meta.env.VITE_FARM_CALENDAR_URL as string | undefined) ||
    "/api/v1/farm-calendar/",
};

export default config;
