export type AlertOrigin = "observed" | "predicted";

export interface AlertData {
  barn_id: string;
  message?: string;
  severity: "warning" | "critical" | "info";
  alert_type: string;
  barn_name?: string | null;
  location_name?: string | null;
  feeding_location_id?: string | null;
  animal_id?: string;
  animal_name?: string;
  event_type?: string;
  created_at?: string;
  last_schedule_time?: string;
  drop_pct?: number;
  window_minutes?: number;
  window_hours?: number;
  threshold?: number;
  current_level?: number;
  thi?: number;
  // predicted alerts
  predicted_for?: string;
  predicted_level?: number;
  // health_spike
  suspected_cause?: string[];
  scope?: "barn" | "location";
  event_count?: number;
}

export interface Alert {
  alert_id: string;
  alert_type: string;
  severity: "warning" | "critical" | "info";
  barn_id: string;
  barn_name: string | null;
  feeding_location_id: string | null;
  location_name: string | null;
  alert_data: AlertData;
  status: "active" | "resolved";
  origin: AlertOrigin;
  predicted_for: string | null;
  cycles_seen?: number;
  created_at: string;
  resolved_at: string | null;
}

export interface AlertResponse {
  alerts: Alert[];
  count: number;
}

export interface ThresholdsData {
  alert_cooldown_hours: number;
  feed_rise_percent: number;
  feed_rise_lookback_minutes: number;
  feed_stale_change_percent: number;
  feed_stale_minutes: number;
  feeding_suggestion_min_kg: number;
  health_spike_count: number;
  health_spike_feed_alert_hours: number;
  health_spike_hours: number;
  health_spike_thi_delta: number;
  health_spike_thi_window_hours: number;
  heat_stress_duration_minutes: number;
  heat_stress_thi_threshold: number;
  low_feed_percent: number;
  low_feed_critical_percent: number;
  low_feed_recurrence_count: number;
  low_feed_recurrence_days: number;
  moohero_alert_cooldown_hours: number;
  severe_heat_duration_minutes: number;
  severe_heat_thi_threshold: number;
  spoilage_feed_percent: number;
  spoilage_temp_c: number;
  spoilage_stale_hours: number;
  unexpected_feed_cooldown_minutes: number;
  cancel_feed_high_percent: number;
  cancel_feed_lookahead_hours: number;
}

export interface RuleConfig {
  enabled: boolean;
  severity?: "warning" | "critical" | "info";
  prediction_enabled?: boolean;
  prediction_horizon_hours?: number;
  notify_on_predict?: boolean;
}

export interface AlertSettings {
  scope_type: "global" | "feeding_location";
  scope_id: string | null;
  rules: Record<string, RuleConfig>;
  // Per-severity "also send an email" flag (display is always on). Legacy string
  // values ("email"/"both"/"display") may still arrive from older data.
  notification_routing: Record<string, boolean> | null;
  debounce_cycles: number | null;
}

export interface GlobalThresholdsResponse {
  scope: string;
  thresholds: ThresholdsData;
  overrides?: ThresholdsData;
}

export interface FeedDevice {
  device_id: string;
  device_eui: string;
  display_name: string;
  feeding_location_id: string | null;
  feeding_location_name: string | null;
  barn_id: string | null;
  barn_name: string | null;
}

export interface FeedDevicesResponse {
  devices: FeedDevice[];
  count: number;
}

export interface LinkDevicePayload {
  device_eui: string;
  barn_id: string;
  display_name: string;
}

export interface IncomingLocationName {
  incoming_feeding_location_name: string;
  seen_count: number;
  first_seen: string;
  last_seen: string;
}

export interface IncomingLocationNamesResponse {
  incoming_location_names: IncomingLocationName[];
  count: number;
}

export interface LocationMappingPayload {
  device_eui: string;
  barn_id: string;
  incoming_feeding_location_name: string;
  feeding_location_id: string;
}

export interface LocationMapping {
  mapping_id: string;
  device_eui: string;
  barn_id: string;
  barn_name: string;
  source_location_key: string;
  feeding_location_id: string;
  feeding_location_name: string;
  feeding_location_external_id: string | null;
  updated_at: string;
}

export interface LocationMappingResponse {
  message: string;
  mapping: LocationMapping;
}

export interface IncomingBarnName {
  incoming_barn_name: string;
  seen_count: number;
  first_seen: string;
  last_seen: string;
}

export interface IncomingBarnNamesResponse {
  incoming_barn_names: IncomingBarnName[];
  count: number;
}

export interface BarnMappingPayload {
  device_eui: string;
  incoming_barn_name: string;
  barn_id: string;
}

export interface LocationMappingsResponse {
  mappings: LocationMapping[];
  count: number;
}

export interface BarnMapping {
  mapping_id: string;
  device_eui: string;
  source_barn_key: string;
  barn_id: string;
  barn_name: string;
  updated_at: string;
}

export interface BarnMappingsResponse {
  mappings: BarnMapping[];
  count: number;
}
