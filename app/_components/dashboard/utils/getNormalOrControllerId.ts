import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import { getLatestGPSTime } from "./getLatestGPSTime";

export const getNormalOrControllerId = (
  data: VehicleData,
  userId?: string | number,
) => {
  if (Number(userId) === 83957) {
    const gpsVId =
      Number((data.GPSInfo as any).vehId || data.GPSInfo.vId) || data.vId;
    return gpsVId;
  }

  if (data.GPSInfo.gps_fix === 1 && data.ELOCKInfo.gps_fix === 0) {
    return data.vId;
  } else if (data.GPSInfo.gps_fix === 0 && data.ELOCKInfo.gps_fix === 1) {
    const elockInfo = data.ELOCKInfo as any;
    return Number(elockInfo.vehId || data.ELOCKInfo.vId) || data.vId;
  } else if (
    data.GPSInfo.gps_fix === 1 &&
    data.ELOCKInfo.gps_fix === 1 &&
    data.gpsDtl.fuel > 1
  ) {
    return data.vId;
  } else if (userId === 833078) {
    return Number(data.controllermergeId);
  } else {
    return data.vId;
  }
};

export const getGPSOrElock = (data: VehicleData) => {
  if (data.GPSInfo.gps_fix === 1 && data.ELOCKInfo.gps_fix === 0) {
    return "GPS";
  } else if (data.GPSInfo.gps_fix === 0 && data.ELOCKInfo.gps_fix === 1) {
    return "ELOCK";
  } else {
    return getLatestGPSTime(data) === "ELOCK" ? "GPS" : "ELOCK";
  }
};
