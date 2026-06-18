// Feed Levels Interface
export interface FeedDataPoint {
  time: string | number;
  level: number;
  predictedLevel?: number;
  isFeedingPoint?: boolean;
}

export interface FeedingChartProps {
    title: string;
    data: FeedDataPoint[];
    currentLevel: number;
    threshold: number; // Dynamic Prop
}

export interface feedLevels {
  time: string;
  device_eui: string;
  barn_id: string;
  feeding_location_id: string;
  location_name: string;
  external_id: string;
  feed_level: number;
  barn_name: string;
  low_feed_threshold: number | null;
}

export interface FeedingEvent {
  feeding_location: {
    id: string;
    name: string;
  };
  feeding_activity: {
    id: string;
    title: string;
    details: string;
  };
  timestamp: string;
}

export interface FeedingHistoryResponse {
  feeding_location_id: string;
  feeding_location_name: string;
  barn_id: string;
  hours_requested: number;
  data_points: number;
  readings: any[]; 
  feeding_events: FeedingEvent[];
  feeding_events_count: number;
}

export interface FeedLevelsResponse {
  levels: feedLevels[];
  count: number;
}
