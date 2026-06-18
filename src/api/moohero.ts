import api from "./axios";


/**
 * Fetch all moohero farms
 */
export const getFarmAnimals = async (farm_id: string | number) => {
  const response = await api.get(`/moohero/farms/${farm_id}/animals`);
  return response.data;
};

// get feeding-locations for animal
export const getFeedLocations = async () => {
  const response = await api.get(`/feeding-locations`);
  return response.data;
};

export interface CreateAnimalPayload {
  animal_name: string;
  barn_id: string;
  moohero_collar_unique_id: string;
  feeding_location_id: string;
  animal_type: string;
}


//
export const createAnimal = async (data: CreateAnimalPayload) => {
  const response = await api.post("/animals", data);
  return response.data;
};

//
export const getAnimals = async (barn_id?: string, feeding_location_id?: string, with_events?: boolean, days?: number) => {
  const response = await api.get("/animals", {
    params: {
      barn_id,
      feeding_location_id,
      with_events,
      days,
      _t: Date.now(),
    },
  });
  return response.data;
};

// get barn stats
export const getBarnStats = async (days?: number, barn_id?: string) => {
  const response = await api.get("/animals/barn-stats", {
    params: { days, barn_id },
  });
  return response.data;
};

// get animal details
export const getAnimalDetails = async (animal_id: string, days?: number) => {
  const response = await api.get(`/animals/${animal_id}`, {
    params: { days },
  });
  return response.data;
};

export interface UpdateAnimalPayload {
  animal_name?: string;
  animal_type?: string;
  moohero_collar_unique_id?: string;
  feeding_location_id?: string;
  barn_id?: string;
}

// update animal
export const updateAnimal = async (animal_id: string, payload: UpdateAnimalPayload) => {
  const response = await api.put(`/animals/${animal_id}`, payload);
  return response.data;
};

// get stored moohero events
export const getStoredMooHeroEvents = async (days?: number) => {
  const response = await api.get("/moohero/events/stored", {
    params: { days },
  });
  return response.data;
};

// get farm mappings
export const getFarmMappings = async () => {
  const response = await api.get("/moohero/farm-mappings");
  return response.data;
};

// list the MooHero account's farms (each with its linked local farm_id, if any)
export const getMooheroFarms = async (): Promise<{ moohero_id: number; farm_id: string | null; name: string }[]> => {
  const response = await api.get("/moohero/farms");
  return response.data.farms || [];
};

// link a MooHero farm to a local (Farm Calendar) farm
export const linkMooheroFarm = async (moohero_farm_id: number, farm_id: string, moohero_farm_name?: string) => {
  const response = await api.post("/moohero/farm-links", { moohero_farm_id, farm_id, moohero_farm_name });
  return response.data;
};

// remove a MooHero<->farm link
export const unlinkMooheroFarm = async (moohero_farm_id: number) => {
  const response = await api.delete(`/moohero/farm-links/${moohero_farm_id}`);
  return response.data;
};

// moohero events (legacy)
export const getMooheroEvents = async (moohero_id: string | number, from?: string, to?: string) => {
  const response = await api.get("/moohero/events", {
    params: {
      moohero_id,
      from,
      to
    }
  });
  return response.data;
};

// Filter animals by-collar_id
export const getAnimalsByCollarId = async (collar_ids: string[], from?: string, to?: string) => {
  const response = await api.get(`/moohero/events/by-collars`, {
    params: {
      collar_ids: collar_ids.join(','),
      from,
      to
    }
  });
  return response.data;
};
