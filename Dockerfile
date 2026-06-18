# ---- Build stage: compile the Vite/React SPA ----
FROM node:22-alpine AS build
WORKDIR /app

# Install deps against the lockfile for reproducible builds.
COPY package.json package-lock.json ./
RUN npm ci

# Build (URLs are NOT baked in here — they are resolved at runtime via config.js).
COPY . .
RUN npm run build

# ---- Runtime stage: nginx serves static files + reverse-proxies the API/calendar ----
FROM nginx:alpine AS runtime

# Site config (SPA + /api + /farm-calendar reverse proxy).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Built assets.
COPY --from=build /app/dist /usr/share/nginx/html

# Runtime config injector.
COPY docker-entrypoint.sh /docker-entrypoint.d/99-app-config.sh
RUN chmod +x /docker-entrypoint.d/99-app-config.sh

EXPOSE 80
# nginx:alpine already runs scripts in /docker-entrypoint.d/ before starting nginx,
# so config.js is generated automatically at container start.
