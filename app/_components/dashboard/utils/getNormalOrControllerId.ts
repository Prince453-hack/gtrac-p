import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import { getLatestGPSTime } from "./getLatestGPSTime";

export const getNormalOrControllerId = (
  data: VehicleData,
  userId?: string | number,
) => {
  if (Number(userId) === 83957) {
    const gpsVId =
      Number((data?.GPSInfo as any)?.vehId || data?.GPSInfo?.vehId) || data?.vId;
    return gpsVId;
  }

  if (Number(userId) === 833078) {
    return Number(data?.controllermergeId) || data?.vId;
  }

  const primaryVId = Number(data?.vId);

  const getVehId = (info: any): number | null => {
    if (!info) return null;
    const id = Number(info.vehId || info.vId);
    return !isNaN(id) && id > 0 ? id : null;
  };

  const hasSpaceA = (info: any): boolean => {
    const reg = info?.vehReg;
    return typeof reg === "string" && /\s+A/i.test(reg);
  };

  const isWorking = (info: any): boolean => {
    if (!info) return false;
    const vid = getVehId(info);
    if (!vid) return false;
    return info.gps_fix !== 0;
  };

  const gpsId = getVehId(data?.GPSInfo);
  const elockId = getVehId(data?.ELOCKInfo);

  const gpsHasA = hasSpaceA(data?.GPSInfo);
  const elockHasA = hasSpaceA(data?.ELOCKInfo);

  const gpsIsWorking = isWorking(data?.GPSInfo);
  const elockIsWorking = isWorking(data?.ELOCKInfo);

  // 1. If GPSInfo does NOT have ' A' in vehReg and ELOCKInfo HAS ' A':
  if (!gpsHasA && elockHasA) {
    if (gpsIsWorking && gpsId) return gpsId;
    if (elockIsWorking && elockId) return elockId;
    return primaryVId;
  }

  // 2. If ELOCKInfo does NOT have ' A' in vehReg and GPSInfo HAS ' A':
  if (!elockHasA && gpsHasA) {
    if (elockIsWorking && elockId) return elockId;
    if (gpsIsWorking && gpsId) return gpsId;
    return primaryVId;
  }

  // 3. Fallback (if both do not have ' A' or both have ' A'):
  if (gpsIsWorking && gpsId) return gpsId;
  if (elockIsWorking && elockId) return elockId;

  return primaryVId;
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
