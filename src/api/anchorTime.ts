import api from "./axios";

export interface AnchorTimeResponse {
  anchor_time: string; // "HH:MM:SS"
}

export interface UpdateAnchorTimePayload {
  anchor_time: string; // "HH:MM:SS"
}

export interface UpdateAnchorTimeResponse {
  message: string;
  anchor_time: string;
}

export const getAnchorTime = async (): Promise<AnchorTimeResponse> => {
  const res = await api.get<AnchorTimeResponse>("anchor-time/");
  return res.data;
};

export const setAnchorTime = async (
  payload: UpdateAnchorTimePayload
): Promise<UpdateAnchorTimeResponse> => {
  const res = await api.put<UpdateAnchorTimeResponse>("anchor-time/", payload);
  return res.data;
};
