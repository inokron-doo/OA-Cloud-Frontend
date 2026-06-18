#!/bin/sh
# Generate /config.js from environment variables at container start, so a single
# pre-built image can be pointed at any backend / calendar without rebuilding.
#
# Installed into /docker-entrypoint.d/ — the nginx image runs this automatically
# before launching nginx, so it must NOT exec the CMD itself; it just writes the
# file and returns.
#
# Defaults are relative paths that work behind this image's own reverse proxy
# (see nginx.conf). Override API_URL / FARM_CALENDAR_URL only when the SPA is
# served separately from the backend/calendar.
set -e

API_URL="${API_URL:-/api/v1}"
# Backend SSO entry endpoint (same-origin via the proxy), NOT the calendar itself.
FARM_CALENDAR_URL="${FARM_CALENDAR_URL:-/api/v1/farm-calendar/}"

cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = {
  API_URL: "${API_URL}",
  FARM_CALENDAR_URL: "${FARM_CALENDAR_URL}"
};
EOF

echo "[entrypoint] config.js: API_URL=${API_URL} FARM_CALENDAR_URL=${FARM_CALENDAR_URL}"
