
export interface AnimalMapping {
  animalA: string;
  animalB: string;
  animalC: string;
}

export interface SyncConfig {
  deviceId: string;
  barnMapping: string;
}

export interface AlertThresholds {
  lowFeed: number;
  criticalFeed: number;
  maxTemp: number;
  maxHum: number;
  maxThi: number;
}