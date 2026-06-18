export interface FeedingLocation {
  feeding_location_id: string;
  name: string;
  barn_id: string;
}

export interface FeedingLocationAPI {
  feeding_location_id: string;
  external_id: string;
  location_name: string;
  low_feed_threshold: number;
  barn_id: string;
  barn_name: string;
  latitude: number;
  longitude: number;
  name: string;
}

export interface APIResponse {
  feeding_locations: FeedingLocationAPI[];
  count: number;
}

export interface GroupedFeedingLocation {
  location_id: string;
  location_name: string;
  barns: { barn_id: string; barn_name: string }[];
}

export interface Farm {
  // Present only when this farm is linked to a MooHero farm (set up in Setup).
  // Farms now come from Farm Calendar, so a farm may have no MooHero link.
  moohero_id?: number | null;
  farm_id: string;
  name: string;
  barn_count?: number;
}

export interface Barn {
  barn_id: string;
  barn_name: string;
  latitude?: number;
  longitude?: number;
}

// API Response structure for barns
export interface BarnsResponse {
  farm_id: string;
  barns: Barn[];
}

export interface GetFeedingLocation {
  feeding_location_id: string;
  external_id: string;
  barn_id: string;
  name: string;
  is_hidden?: boolean;
  has_telemetry?: boolean;
  low_feed_threshold: number | null;
}

export interface FeedingLocationsResponse {
  barn_id: string;
  feeding_locations: GetFeedingLocation[];
  count: number;
}


// Add Farm Calendar Events
export interface FarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: FeedingSchedule | null;
  selectedBarnId?: string | null;
  selectedLocationId?: string | null;
}


// Add Farm Calendar Activity
export interface FarmCalendarActivity {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  details: string;
  responsible_agent: string;
  activity_type_id: string;
  parent_activity_id: string;
  parcel_id: string;
}

export interface ActivityType {
  activity_type_id: string;
  name: string;
  description?: string;
}

export interface ActivityTypesResponse {
  activity_types: ActivityType[];
  count: number;
}

export interface FeedingSchedule {
  id?: string;
  barn_id: string;
  feeding_location_id: string;
  schedule_name: string;
  days_of_week: number[];
  time_start: string;
  time_end: string;
  quantity_kg: number;
  notes: string;
  activity_type_id?: string;
  name?: string;
  // One-time activity fields
  start_datetime?: string;
  end_datetime?: string;
  title?: string;
}

export interface OneTimeActivity {
  barn_id: string;
  feeding_location_id: string;
  start_datetime: string;
  end_datetime: string;
  quantity_kg: number;
  notes: string;
  title: string;
  activity_type_id: string;
}