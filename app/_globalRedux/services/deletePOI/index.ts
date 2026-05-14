import axios from "axios";

export async function deleteCirclePoi(userid: number, poiid: number) {
  return axios.post(`${process.env.NEXT_PUBLIC_TRACKING_DASHBOARD}/deletePoi`, {
    userid,
    poiid,
  });
}

export async function deleteGeofencePoi(userid: number, poiid: number) {
  // First delete geofence points
  await axios.post(
    `${process.env.NEXT_PUBLIC_TRACKING_DASHBOARD}/deleteGeofence`,
    {
      poiid,
    }
  );
  // Then delete the POI itself
  return axios.post(`${process.env.NEXT_PUBLIC_TRACKING_DASHBOARD}/deletePoi`, {
    userid,
    poiid,
  });
}

// Only delete geofence points (set status to 1), keep the POI
export async function deleteGeofencePointsOnly(poiid: number) {
  return axios.post(
    `${process.env.NEXT_PUBLIC_TRACKING_DASHBOARD}/deleteGeofence`,
    {
      poiid,
    }
  );
}
