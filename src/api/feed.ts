// api/feed.ts
import api from "./axios";
import type { FarmCalendarActivity, FeedingSchedule, OneTimeActivity } from "../interface/feedManagement";

export const getFarmCalendarAuth = async () => {
  const response = await api.get("/farm-calendar/", {
    responseType: "text", // Kyunki response HTML hai
    headers: {
      'Accept': 'text/html', 
    }
  });
  return response.data; // String HTML return karega
};

// Farm Calendar Activity-types
export const getFarmActivityTypes = async () => {
  const response = await api.get("/farm-calendar/activity-types");
  return response.data;
};

// Add Farm Calendar Activity
export const addFarmActivity = async (data: FarmCalendarActivity) => {
  const response = await api.post("/farm-calendar/activities", data);
  return response.data;
};

// Get Farm Calendar Activity
export const getFarmActivity = async () => {
  const response = await api.get("/farm-calendar/activities");
  return response.data;
};

// Delete Farm Calendar Activity
export const delFarmActivity = async (id: string) => {
  const response = await api.delete(`/farm-calendar/activities/${id}`);
  return response.data;
};

// Get Feeding Locations for a barn. Feeding locations are discovery-only
// (created by the IoT ingest from device data) - there is no manual create.
export const getFeedLocation = async (barnId: string, includeHidden = false) => {
  const response = await api.get(`/${barnId}/feeding-locations`, {
    params: { include_hidden: includeHidden },
  });
  return response.data;
};

// Delete a feeding location (only allowed when it has no telemetry; the API
// returns 409 otherwise - hide it instead).
export const delFeedLocation = async (feeding_location_id: string) => {
  const response = await api.delete(`/feeding-locations/${feeding_location_id}`);
  return response.data;
};

// Show/hide a feeding location
export const setFeedLocationVisibility = async (feeding_location_id: string, hidden: boolean) => {
  const response = await api.patch(`/feeding-locations/${feeding_location_id}/visibility`, null, {
    params: { hidden },
  });
  return response.data;
};

// Update Feeding Location
export const updateFeedLocation = async (feeding_location_id: string, name: string) => {
  const response = await api.put(`/feeding-locations/${feeding_location_id}`, { name });
  return response.data;
};

export const feedingHistory = async (feeding_location_id: string, hours?: number, start_time?: string, end_time?: string) => {
  const params: any = {};
  if (hours) params.hours = hours;
  if (start_time) params.start_time = start_time;
  if (end_time) params.end_time = end_time;

  const response = await api.get(`/feeding-locations/${feeding_location_id}/history`, {
    params
  });
  return response.data;
};

// Add Feeding Schedule
export const addSchedule = async (data: FeedingSchedule) => {
  const response = await api.post("/schedules", data);
  return response.data;
};

// Get Feeding Schedule
export const getSchedule = async (location_id?: string) => {
  const response = await api.get("/schedules", {
    params: location_id ? { location_id } : {}
  });
  return response.data;
};

// Delete Feeding Schedule
export const delSchedule = async (id: string) => {
  const response = await api.delete(`/schedules/${id}`);
  return response.data;
};

// Update Feeding Schedule
export const updateSchedule = async (id: string, data: FeedingSchedule) => {
  const response = await api.put(`/schedules/${id}`, data);
  return response.data;
};


// All Feed Level
export const getFeedLevels = async () => {
  const response = await api.get("/feed/levels")
  return response.data
}

// Add One Time Activity
export const addOneTimeActivity = async (data: OneTimeActivity) => {
  const response = await api.post("/feed/one-time-activity", data);
  return response.data;
};