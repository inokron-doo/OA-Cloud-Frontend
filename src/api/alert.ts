import type { AlertResponse, AlertSettings, FeedDevicesResponse, GlobalThresholdsResponse, ThresholdsData, LinkDevicePayload, IncomingLocationNamesResponse, LocationMappingPayload, LocationMappingResponse, LocationMappingsResponse, IncomingBarnNamesResponse, BarnMappingPayload, BarnMappingsResponse } from "../interface/alerts";
import api from "./axios";

type AlertOriginParam = "observed" | "predicted" | "all";

// Get feed alerts. origin: "observed" (default) | "predicted" | "all".
export const allFeedAlerts = async (origin: AlertOriginParam = "all"): Promise<AlertResponse> => {
  const response = await api.get("/feed/alerts/new", { params: { origin } });
  return response.data;
};

// Get / update alert settings (per-rule config + notification routing + debounce)
export const getAlertSettings = async (
  scope_type: "global" | "feeding_location" = "global",
  scope_id?: string,
): Promise<AlertSettings> => {
  const response = await api.get("/feed/alert-settings", { params: { scope_type, scope_id } });
  return response.data;
};

export const updateAlertSettings = async (data: Partial<AlertSettings>): Promise<AlertSettings> => {
  const response = await api.put("/feed/alert-settings", data);
  return response.data;
};

// Clear real-time (observed) alerts. Predicted alerts are engine-managed and
// would reappear, so "remove all" is scoped to observed.
export const deleteFeedAlerts = async (): Promise<void> => {
  await api.delete("/feed/alerts/clear", { params: { confirm_all: true, origin: "observed" } });
};

// Resolve Feed Alert
export const resolveFeedAlert = async (alert_id: string): Promise<void> => {
  await api.put(`/feed/alerts/${alert_id}/resolve`);
};  


// Get Global Thresholds
export const getGlobalThresholds = async (): Promise<GlobalThresholdsResponse> => {
  const response = await api.get("/feed/thresholds");
  return response.data;
};

// update thresolds value
export const updateThresholds = async (data: ThresholdsData): Promise<void> => {
  await api.put(`/feed/thresholds`, { thresholds: data });
};


// Get Feeding Location Thresholds
export const getFeedingLocationThresholds = async (feeding_location_id: string): Promise<GlobalThresholdsResponse> => { 
  const response = await api.get(`/feed/feeding-locations/${feeding_location_id}/thresholds`);
  return response.data;
};

// update Feeding Location thresolds value
export const updateFeedingLocationThresholds = async (feeding_location_id: string, data: ThresholdsData): Promise<void> => {
  await api.put(`/feed/feeding-locations/${feeding_location_id}/thresholds`, { thresholds: data });
};


// Get Feed Devices
export const getFeedDevices = async (): Promise<FeedDevicesResponse> => {
  const response = await api.get("/feed/devices");
  return response.data;
}

// Add Feed Devices 
export const addFeedDevice = async (): Promise<void> => {
  const response = await api.post("/feed/devices");
  return response.data;
}

// get all feeding location
export const allFeedingLocations = async () => {
  const response = await api.get("/feeding-locations")
  return response.data;
}

// Link Device To Feeding Location
export const linkDevice = async (data: LinkDevicePayload): Promise<any> => {
  const response = await api.post("/feed/devices/link", data);
  return response.data;
};

// Incoming barn name api
export const incomingBarnName = async (params: { device_eui: string; barn_id: string; hours: number }): Promise<IncomingBarnNamesResponse> => {
  const response = await api.get(`/feed/devices/incoming-barn-names`, { params });
  return response.data;
};

// Post Barn mapping
export const barnMapping = async (data: BarnMappingPayload): Promise<any> => {
  const response = await api.post(`/feed/devices/barn-mappings`, data);
  return response.data;
};

// Get Barn mapping
export const getBarnMapping = async (params?: { device_eui?: string; barn_id?: string }): Promise<BarnMappingsResponse> => {
  const response = await api.get(`/feed/devices/barn-mappings`, { params });
  return response.data;
};


// Incoming location name api
export const incomingLocationName = async (params: { device_eui: string; barn_id: string; hours: number }): Promise<IncomingLocationNamesResponse> => {
  const response = await api.get(`/feed/devices/incoming-location-names`, { params });
  return response.data;
};

// Post Location mapping
export const locationMapping = async (data: LocationMappingPayload): Promise<LocationMappingResponse> => {
  const response = await api.post(`/feed/devices/location-mappings`, data);
  return response.data;
};

// Get Location mapping
export const getLocationMapping = async (): Promise<LocationMappingsResponse> => {
  const response = await api.get(`/feed/devices/location-mappings`);
  return response.data;
};


// predict feed level
export const predictFeedLevel = async (params: {
  barn_id: string;
  feeding_location_id?: string;
  start_time?: string;
  horizon_hours?: number;
  freq_minutes?: number;
}): Promise<any> => {
  const response = await api.post(`/predict/feed-level`, params);
  return response.data;
};

// predict feed status
// export const predictFeedStatus = async (): Promise<void> => {
//   const response = await api.get(`/v1/predict/status`);
//   return response.data;
// };