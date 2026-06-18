// Runtime configuration placeholder.
//
// In production this file is overwritten at container start by docker-entrypoint.sh
// from environment variables (API_URL, FARM_CALENDAR_URL). Leaving it empty here
// makes the app fall back to VITE_* build vars and then to relative-path defaults
// (see src/config.ts), so `npm run dev` and the reverse-proxy deploy both just work.
window.__APP_CONFIG__ = {};
