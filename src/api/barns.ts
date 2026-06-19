import api from "./axios";
import type { Farm, BarnsResponse, FeedingLocationsResponse } from "../interface/feedManagement";

/**
 * Fetch all farms from the Farm Calendar (the central system of record).
 * Single deployment = one organisation, so this is the deployment's farm(s).
 * Farms are created/managed in Farm Calendar; Inokron only reads them.
 */
export const getFarms = async (): Promise<Farm[]> => {
  const response = await api.get("/farms");
  return response.data.farms || response.data;
};

/**
 * Fetch specific barns based on selected Farm ID
 */
export const getBarnsByFarm = async (farm_id: string): Promise<BarnsResponse> => {
  const response = await api.get(`/farms/${farm_id}/barns`);
  // console.log("barn data", response.data)
  return response.data;
};

/**
 * Fetch specific feeding locations based on selected barn ID
 */
export const getLocationByBarn = async (barnId: string): Promise<FeedingLocationsResponse> => {
  const response = await api.get(`/${barnId}/feeding-locations`);
  return response.data;
};

// weather api
export const currentWeather = async (lat: number, lon: number) => {
    const response = await api.get("/weather/current/", {
        params: { lat, lon }
    });
    // console.log("Weather Data", response.data);
    return response.data;
};

// weather history
export const weatherHistory = async (barnId: string, hours?: number, start_time?: string, end_time?: string, bucket_minutes?: number) => {
    const params: any = {};
    if (hours) params.hours = hours;
    if (start_time) params.start_time = start_time;
    if (end_time) params.end_time = end_time;
    if (bucket_minutes) params.bucket_minutes = bucket_minutes;

    const response = await api.get(`/weather/${barnId}/history`, { params });
    // console.log("Weather History Data", response.data);
    return response.data;
};

// weather forecast
export const weatherForecast = async (barnId: string, hours?: number, start_time?: string, end_time?: string) => {
    const params: any = {};
    if (hours) params.hours = hours;
    if (start_time) params.start_time = start_time;
    if (end_time) params.end_time = end_time;

    const response = await api.get(`/weather/${barnId}/forecast`, { params });
  return response.data;
}

// (heat-stress prediction endpoints removed — predicted heat alerts now arrive via
//  GET /feed/alerts/new?origin=all and render in the dashboard's Upcoming section.)

// Get Location
// export const getFeedingLocations = async (): Promise<APIResponse> => {
//     const response = await api.get("/feeding-locations")
//     // console.log(response, "Get all locations");
//     return response.data;
// };

// alert & notification 
// export const getAlerts = async (barnName: string) => {
//     const response = await api.get(
//         `/feed/barn/${encodeURIComponent(barnName)}/alerts`
//     );
//     return response.data;
// };

