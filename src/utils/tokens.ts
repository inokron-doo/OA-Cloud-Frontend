// Access-token lifecycle helpers.
//
// The app access token lives in localStorage (sent as the Bearer header by
// axios) AND as an httponly `access_token` cookie set by the backend (used by
// the Farm Calendar SSO entry, which a new-tab navigation can only authenticate
// with a cookie). Both are refreshed together by /token/refresh/, so keeping
// the localStorage token fresh keeps the SSO cookie fresh too.

import config from "../config";

const API_URL = config.API_URL;

interface JwtPayload {
  exp?: number;
  [k: string]: unknown;
}

function decode(token: string | null): JwtPayload | null {
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1])) as JwtPayload;
  } catch {
    return null;
  }
}

/** True if the token is missing, malformed, or past its `exp`. */
export function isExpired(token: string | null): boolean {
  const payload = decode(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

/** True if the token expires within `skewSeconds` (default 60s) — or already has. */
export function isExpiringSoon(token: string | null, skewSeconds = 60): boolean {
  const payload = decode(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000 - skewSeconds * 1000;
}

// De-dupe concurrent refreshes (e.g. several 401s at once) onto one request.
let inflight: Promise<boolean> | null = null;

/**
 * Exchange the stored refresh token for a fresh access token.
 * Uses fetch (not axios) to avoid the response-interceptor recursing, and
 * same-origin credentials so the backend's renewed httponly cookie is applied.
 * Returns true on success (localStorage updated), false otherwise.
 */
export function refreshAccessToken(): Promise<boolean> {
  if (inflight) return inflight;

  const refresh_token = localStorage.getItem("refresh_token");
  if (!refresh_token) return Promise.resolve(false);

  inflight = (async () => {
    try {
      const res = await fetch(`${API_URL}/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ refresh_token }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data?.access_token) {
        localStorage.setItem("access_token", data.access_token);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
