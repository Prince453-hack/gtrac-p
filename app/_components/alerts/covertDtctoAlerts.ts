import { AlertByDayEvents } from "@/app/_globalRedux/services/types/alerts";
import { parseVehicleHealthMessage } from "../overview/utils/pieChartDataProcessors";

type DtcData = {
  SPN_Code: number;
  SPN_Description: string;
  SPN_Category: string;
  FMI_Category: string;
  Set_At: string;
  VehicleNumber: number;
  gps_time: string;
  alert_id?: string | number;
  vehicle_no?: string;
};

const normalizeDtcCategory = (rawCategory?: string): string => {
  const normalized = (rawCategory || "General").trim().toLowerCase();

  const map: Record<string, string> = {
    acceleration: "Acceleration",
    battery: "Battery",
    brake: "Brake",
    engine: "Engine",
    "safety systems": "SafetySystems",
    safetysystems: "SafetySystems",
    sensor: "Sensor",
    general: "General",
  };

  return map[normalized] || "General";
};

function aggregateSPNData(data: Record<string, any>): DtcData[] {
  const aggregatedData: DtcData[] = [];

  for (let i = 1; i <= 10; i++) {
    const spnCode = data[`SPN${i}_Code`];
    const spnDescription = data[`SPN${i}_Description`];
    const spnCategory = data[`SPN${i}_Category`];
    const fmiCategory = data[`FMI${i}_Category`];

    if (spnCode !== null && spnCode !== undefined) {
      aggregatedData.push({
        SPN_Code: spnCode,
        SPN_Description: spnDescription,
        SPN_Category: spnCategory,
        FMI_Category: fmiCategory,
        Set_At: `${data.odometer} Km`,
        VehicleNumber: data.sys_service_id,
        gps_time: data.gps_time,
      });
    }
  }

  return aggregatedData;
}

export function covertDtcToAlerts(
  data: GetDTCResponse["list"],
  allVehicles: { id: number; veh_reg: string }[],
): AlertByDayEvents[] {
  if (!data) return [];

  const aggregatedData: DtcData[] = [];

  data.forEach((item) => {
    const payload = item as any;
    const alertType = String(payload.alert_type || "")
      .trim()
      .toLowerCase();

    if (alertType === "vehicle health alert" || payload.msg) {
      const parsed = parseVehicleHealthMessage(String(payload.msg || ""));
      const severityMatch = String(payload.msg || "").match(
        /Severity\s*:?\s*([^|.]+)/i,
      );
      const parsedSeverity = severityMatch?.[1]?.trim() || "Minor";

      aggregatedData.push({
        SPN_Code: Number(parsed.spnCode) || 0,
        SPN_Description: parsed.description || "Vehicle Health Alert",
        SPN_Category: normalizeDtcCategory(parsed.category),
        FMI_Category: parsedSeverity,
        Set_At: `${payload.gps_time || payload.datetime || ""}`,
        VehicleNumber: Number(payload.sys_service_id) || 0,
        gps_time: payload.gps_time || payload.datetime || new Date().toISOString(),
        alert_id: payload.alert_id,
        vehicle_no: payload.vehicleno || payload.vehicle_no || payload.vehicleNumber,
      });
      return;
    }

    const hasLegacySpnFields = Object.keys(item || {}).some(
      (key) => key.startsWith("SPN") || key.startsWith("FMI"),
    );

    if (hasLegacySpnFields) {
      aggregatedData.push(...aggregateSPNData(item));
    }
  });

  return aggregatedData.map((item) => {
    const mappedVehicleNumber = allVehicles.find(
      (vehicle) => vehicle.id === item.VehicleNumber,
    )?.veh_reg;

    return {
      starttime: item.gps_time,
      endtime: "",
      vehicle_no:
        item.vehicle_no || mappedVehicleNumber || `${item.VehicleNumber}`,
      exception_type: item.SPN_Category || "General",
      KM: item.Set_At,
      duration: "",
      startlocation: item.SPN_Description,
      startlat: 0,
      startLong: 0,
      endlocation: "",
      endlat: 0,
      endLong: 0,
      speed: 0,
      journey_statusfinal: null,
      Halting: null,
      hour: "",
      InvoiceNo: "",
      InvoiceDate:
        item.FMI_Category?.toUpperCase() === "RED"
          ? "Severe"
          : item.FMI_Category?.toUpperCase() === "YELLOW"
            ? "Moderate"
            : item.FMI_Category || "Minor",
      remark: "",
      id: item.alert_id ? Number(item.alert_id) || 0 : 0,
      service_id: item.VehicleNumber ? String(item.VehicleNumber) : "",
      route_name: `${item.SPN_Code}`,
    };
  });
}
//Description | Alert | Set At | Severity | Code
