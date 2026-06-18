export interface IAnimal {
  id: string;
  farm_id: string;
  housing_id: string;
  notes: string;
  pcb_version: string;
  produced_on: string;
  radio_channel: string;
  radio_id: string;
  serial_no: string;
  software_version: string;
  unique_id: string;

  animal_name: string;
  animal_type: string;
  health_score: number | null;
  last_health_update: string | null;
  farm_calendar_animal_id: string | null;
  created_at: string;
  updated_at: string;
  barn_name: string;
  feeding_location_name: string;
  moohero_collar_unique_id: string;
  health_events?: number;
  heat_events?: number;
  health_events_count?: number;
  heat_events_count?: number;
  feeding_location_id: string;
  barn_id: string;
}

export interface IAnimalsResponse {
  animals: IAnimal[];
  count: number;
}
