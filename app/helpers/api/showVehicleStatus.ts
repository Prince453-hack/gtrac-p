// Vehicle status helper function for GPSTrackTech API

export interface VehicleStatusResponse {
  code: number;
  data: {
    requestTime: string;
    bkdCount: number;
    viUpdateTime: string;
    onlineNum: number;
    offlineNum: number;
    list: VehicleInfo[];
  };
  msg: string;
  total: null;
  extend: null;
}

export interface VehicleInfo {
  vehicleId: number;
  groupId: number;
  plate: string;
  plateColor: string;
  vehicleType: number;
  sim: string | null;
  terminalNo: string;
  terminalType: string;
  cameraNum: number;
  cameraLine: string;
  groupName: string;
  expireDate: string;
  vehicleTypeEN: string;
  vehicleState: number; // 0 = offline, non-zero = various online states
  lon: number;
  lat: number;
  mileage: number;
  speed: number;
  driverName: string | null;
  posState: number;
  devTime: string;
  formatTime: string;
  power: null;
  gsmSin: number;
  netModel: number;
  gsmSinMode: number;
  accState: number;
  alarm: string;
  videoAlarm: string;
  direct: number;
  high: number;
  recorderSpeed: number;
  videoType: number;
  vehicleTypeEnum: null;
  protocol: number;
  expired: number;
  loadStatus: number;
  loadValue: number;
  wholeWeigh: number;
  loadWeigh: number;
  temperature: null;
  humidity: null;
  firstOilScale: number;
  firstOilMete: number;
  secondOilScale: number;
  secondOilMete: number;
  thirdOilScale: number;
  thirdOilMete: number;
  fourthOilScale: number;
  fourthOilMete: number;
  gnssNum: string;
  obdFlag: number;
}

export interface VehicleStatusPayload {
  queryType: string;
  queryParams: string[]; // Array of IMEI numbers
}

export interface VehicleStatus {
  terminalNo: string;
  plate: string;
  isOnline: boolean;
  vehicleState: number;
  lastUpdateTime?: string;
  speed?: number;
  location?: {
    lat: number;
    lon: number;
  };
}

/**
 * Get vehicle status (online/offline) for multiple vehicles by IMEI
 * @param imeiNumbers - Array of IMEI numbers to check status for
 * @returns Promise with vehicle status information
 */
export async function getVehicleStatus(
  imeiNumbers: string[],
): Promise<VehicleStatus[]> {
  if (!imeiNumbers || imeiNumbers.length === 0) {
    throw new Error("IMEI numbers array is required and cannot be empty");
  }

  const payload: VehicleStatusPayload = {
    queryType: "1",
    queryParams: imeiNumbers,
  };

  try {
    const response = await fetch(
      "https://y.gpstracktech.com/api/monitor/getRealTimeInfo",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          key: process.env.NEXT_PUBLIC_BSJ_VIDEO_API_TOKEN!,
          "Accept-Language": "en",
          version: "1.0",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: VehicleStatusResponse = await response.json();

    if (data.code !== 200) {
      throw new Error(`API error: ${data.msg}`);
    }

    // Transform the response data to a more usable format
    const vehicleStatuses: VehicleStatus[] = data.data.list.map((vehicle) => ({
      terminalNo: vehicle.terminalNo,
      plate: vehicle.plate,
      isOnline: vehicle.vehicleState !== 0,
      vehicleState: vehicle.vehicleState,
      lastUpdateTime: vehicle.devTime,
      speed: vehicle.speed,
      location: {
        lat: vehicle.lat,
        lon: vehicle.lon,
      },
    }));

    return vehicleStatuses;
  } catch (error) {
    console.error("Error fetching vehicle status:", error);
    throw error;
  }
}

/**
 * Get status for a single vehicle by IMEI
 * @param imeiNumber - Single IMEI number to check status for
 * @returns Promise with single vehicle status information
 */
export async function getSingleVehicleStatus(
  imeiNumber: string,
): Promise<VehicleStatus | null> {
  if (!imeiNumber) {
    throw new Error("IMEI number is required");
  }

  try {
    const statuses = await getVehicleStatus([imeiNumber]);
    return statuses.length > 0 ? statuses[0] : null;
  } catch (error) {
    console.error(`Error fetching status for vehicle ${imeiNumber}:`, error);
    throw error;
  }
}

/**
 * Check if a vehicle is online by IMEI
 * @param imeiNumber - IMEI number to check
 * @returns Promise with boolean indicating if vehicle is online
 */
export async function isVehicleOnline(imeiNumber: string): Promise<boolean> {
  try {
    const status = await getSingleVehicleStatus(imeiNumber);
    return status ? status.isOnline : false;
  } catch (error) {
    console.error(`Error checking online status for ${imeiNumber}:`, error);
    return false;
  }
}

/**
 * Get online and offline counts for multiple vehicles
 * @param imeiNumbers - Array of IMEI numbers
 * @returns Promise with counts object
 */
export async function getVehicleStatusCounts(imeiNumbers: string[]): Promise<{
  online: number;
  offline: number;
  total: number;
}> {
  try {
    const statuses = await getVehicleStatus(imeiNumbers);
    const onlineCount = statuses.filter((status) => status.isOnline).length;
    const offlineCount = statuses.length - onlineCount;

    return {
      online: onlineCount,
      offline: offlineCount,
      total: statuses.length,
    };
  } catch (error) {
    console.error("Error getting vehicle status counts:", error);
    return {
      online: 0,
      offline: 0,
      total: 0,
    };
  }
}
