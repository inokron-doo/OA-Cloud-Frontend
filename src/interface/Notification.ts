export type NotificationType = 'warning' | 'info' | 'success';

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  suggestedAction: string;
  predictionTime?: string;
  isPredicted?: boolean;
  details?: WSAlert; // Store full alert details for the modal
}

export interface AnimalHealthDetail {
  id: string;
  tag: string;
  location: string;
  detectedAt: string;
  severity: 'Low' | 'Medium' | 'High';
  symptoms: string[];
}

// WebSocket Response Types
export interface WSFeedData {
  time: string;
  device_eui: string;
  barn_id: string;
  feeding_location_id: string;
  location_name: string;
  external_id: string;
  feed_level: number;
  low_feed_threshold: number;
}

export interface WSAlert {
  alert_type: string;
  severity: "warning" | "critical" | "info";
  feeding_location_id?: string;
  location_name?: string;
  barn_id?: string;
  barn_name?: string;

  current_level?: number;
  threshold?: number;
  consumption_rate?: number;
  hours_remaining?: number;

  current_thi?: number;
  threshold_thi?: number;
  temperature?: number;
  humidity?: number;
  feed_drop_percentage?: number;
  affected_locations?: string[];

  timestamp: string;
  message: string;
  recommended_actions?: string[];
}

export interface WSResponse {
  type: "feed_update";
  barn_name: string;
  timestamp: string;
  feed_data: WSFeedData[];
  alerts: WSAlert[];
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  type: "warning" | "info" | "success";
  time: string;
}
