export const resetFarmCalendarSession = () => {
  // Clear at both the current /api/v1 paths and the legacy /api paths so any
  // stale cookie from before the versioning migration is also removed.
  ["/", "/api/v1", "/api/v1/farm-calendar", "/api", "/api/farm-calendar"].forEach(path => {
    document.cookie = `OpenAgriAuth=; path=${path}; max-age=0`;
  });
};