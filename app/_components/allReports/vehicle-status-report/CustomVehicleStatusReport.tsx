"use client";
import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import { ConfigProvider } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import moment from "moment";
import { VehicleDataWithAnkurTravelsData } from "./View";
import { ColumnDef } from "@tanstack/react-table";
import CustomTableN, { DownloadReportTs } from "../../common/CustomTableN";
import checkIfIgnitionOnOrOff from "@/app/helpers/checkIfIgnitionOnOrOff";
import { getVehicleStatus } from "@/app/helpers/api/showVehicleStatus";

export const CustomVehicleStatusReport = ({
  columns,
  data,
  scroll_y,
  loading,
}: {
  columns: ColumnDef<VehicleDataWithAnkurTravelsData>[];
  data: any;
  scroll_y: string;
  loading: boolean;
}) => {
  const { groupId, accessLabel, userId, parentUser, isVideoTelematics } = useSelector(
    (state: RootState) => state.auth,
  );
  const [downloadReport, setDownloadReport] = useState<
    DownloadReportTs | undefined
  >();

  const onDownloadBtnClick = async (
    filteredData: VehicleDataWithAnkurTravelsData[],
  ) => {
    document.body.style.cursor = "wait";
    let dashcamStatusMap = new Map<string, string>();

    try {
      if (isVideoTelematics) {
        const imeis = filteredData
          .map((vehicle) => {
            const model = vehicle.gpsDtl?.model || vehicle.model;
            return model?.replace("##BSJ", "") || "";
          })
          .filter((imei) => !!imei);

        if (imeis.length > 0) {
          const uniqueImeis = Array.from(new Set(imeis));
          const statuses = [];
          const CHUNK_SIZE = 100;
          for (let i = 0; i < uniqueImeis.length; i += CHUNK_SIZE) {
            const chunk = uniqueImeis.slice(i, i + CHUNK_SIZE);
            const chunkStatuses = await getVehicleStatus(chunk);
            statuses.push(...chunkStatuses);
          }

          const getRealtimeStatusLabel = (vehicleState?: number) => {
            switch (vehicleState) {
              case 0:
                return "Offline";
              case 1:
                return "Driving";
              case 2:
                return "Parking";
              case 3:
                return "Never online";
              case 4:
                return "Expired";
              case 5:
                return "Idling";
              default:
                return "Unknown";
            }
          };

          statuses.forEach((s) => {
            const statusLabel = `${getRealtimeStatusLabel(s.vehicleState)}${s.formatTime ? ` (${s.formatTime})` : ""}`;
            dashcamStatusMap.set(s.terminalNo, statusLabel);
          });
        }
      }
    } catch (error) {
      console.error("Error fetching dashcam statuses for excel:", error);
    } finally {
      document.body.style.cursor = "";
    }

    const hasAnkurCarrierData = (
      vehicle: VehicleData | VehicleDataWithAnkurTravelsData,
    ): vehicle is VehicleDataWithAnkurTravelsData => {
      return (
        (vehicle as VehicleDataWithAnkurTravelsData).ankurCarrierData !==
        undefined
      );
    };

    const rows = filteredData.map(
      (vehicle: VehicleData | VehicleDataWithAnkurTravelsData) => {
        const gpsInfo = (vehicle as any).GPSInfo;
        const elockInfo = (vehicle as any).ELOCKInfo;
        const defaultAddr = vehicle.gpsDtl.latLngDtl.addr;
        const defaultGpsTime = vehicle.gpsDtl.latLngDtl.gpstime;

        const gpsTimeNum = gpsInfo?.gpstime ? new Date(gpsInfo.gpstime).getTime() : 0;
        const elockTimeNum = elockInfo?.gpstime ? new Date(elockInfo.gpstime).getTime() : 0;

        let chosenAddr = defaultAddr;
        let chosenGpsTime = defaultGpsTime;
        if (gpsTimeNum || elockTimeNum) {
          if (gpsTimeNum >= elockTimeNum && gpsInfo?.addr) {
            chosenAddr = gpsInfo.addr;
            chosenGpsTime = gpsInfo.gpstime || defaultGpsTime;
          } else if (elockTimeNum > gpsTimeNum && elockInfo?.addr) {
            chosenAddr = elockInfo.addr;
            chosenGpsTime = elockInfo.gpstime || defaultGpsTime;
          }
        } else if (vehicle.gpsDtl.controllernum === "CONTROLLER" && elockInfo?.addr) {
          chosenAddr = elockInfo.addr;
          chosenGpsTime = elockInfo?.gpstime || defaultGpsTime;
        }

        const model = vehicle.gpsDtl?.model || vehicle.model;
        const imei = model?.replace("##BSJ", "") || "";
        const dashcamStatus = imei
          ? (dashcamStatusMap.get(imei) || "Status unavailable")
          : "-";

        const commonData = {
          "Vehicle No.": vehicle.vehReg,
          "GPS Time": chosenGpsTime,
          Location: chosenAddr ? chosenAddr.replaceAll("_", " ") : "",
          Speed: vehicle.gpsDtl.speed,
          "Yesterday KM":
            hasAnkurCarrierData(vehicle) && vehicle.ankurCarrierData
              ? `${vehicle.ankurCarrierData.yesterdayKm[0].km} km`
              : vehicle.gpsDtl.Yesterday_KM,
        };

        let userSpecificData = {};
        const today = new Date();

        if (
          Number(groupId) === 56028 &&
          hasAnkurCarrierData(vehicle) &&
          vehicle.ankurCarrierData
        ) {
          userSpecificData = {
            [moment(today).format("Do MMM, YYYY")]: "O km",
            [moment(today).subtract(2, "days").format("Do MMM, YYYY")]:
              `${vehicle.ankurCarrierData.minusTwodays[0].km} km`,
            [moment(today).subtract(3, "days").format("Do MMM, YYYY")]:
              `${vehicle.ankurCarrierData.minusThreedays[0].km} km`,
            [moment(today).subtract(4, "days").format("Do MMM, YYYY")]:
              `${vehicle.ankurCarrierData.minusFourdays[0].km} km`,
            "Current Month": `${vehicle.ankurCarrierData.cMonth[0].km} km`,
            "Last Month": `${vehicle.ankurCarrierData.pMonth[0].km} km`,
          };
        } else if (Number(userId) === 87364 || Number(parentUser) === 87364) {
          userSpecificData = {
            "Nearby Geofence":
              vehicle.gpsDtl.latLngDtl.poi &&
              vehicle.gpsDtl.latLngDtl.poi?.replaceAll("_", " ") ===
                "Inside POI"
                ? "Inside Geofence"
                : vehicle.gpsDtl.latLngDtl.poi?.replaceAll("_", " ") ===
                    "No Nearest POI"
                  ? "No Nearest Geofence"
                  : vehicle.gpsDtl.latLngDtl.poi?.replaceAll("_", " "),
          };
        }

        const additionalData = {
          "Current Fuel": vehicle.gpsDtl.fuel
            ? `${vehicle.gpsDtl.fuel.toFixed(2)} Litre`
            : "",
          "Last Fuel":
            vehicle.gpsDtl.lastfilledTime != null &&
            vehicle.gpsDtl.lastfuelfilled != null
              ? `${vehicle.gpsDtl.lastfuelfilled.toFixed(2)} Litre`
              : "",
          "Ignition State": checkIfIgnitionOnOrOff({
            ignitionState: vehicle.gpsDtl.ignState.toLowerCase() as
              | "off"
              | "on",
            speed: vehicle.gpsDtl.speed,
            mode: vehicle.gpsDtl.mode,
          }),
          "Halted Since": vehicle.gpsDtl.hatledSince,
          ...(accessLabel === 6
            ? { ELock: vehicle.gpsDtl.acState === "Off" ? "Lock" : "Unlock" }
            : {}),
          Status: (() => {
            const gpsInfoMode = (gpsInfo && gpsInfo.mode) || vehicle.gpsDtl.mode;
            const elockInfoMode = elockInfo && elockInfo.mode;

            if (gpsInfoMode === "NOT WORKING" && elockInfoMode === "NOT WORKING") return "NOT WORKING";
            if (gpsInfoMode === "NOT WORKING") return elockInfoMode || gpsInfoMode || "-";
            if (elockInfoMode === "NOT WORKING") return gpsInfoMode || elockInfoMode || "-";
            return gpsInfoMode || elockInfoMode || "-";
          })(),
          ...(isVideoTelematics
            ? { "Dashcam Status": dashcamStatus }
            : {}),
          ...(accessLabel === 6
            ? { "Controller No.": vehicle.gpsDtl.jny_distance }
            : {}),
          "Driver's Name": vehicle.drivers.driverName,
          "Driver's Number": vehicle.drivers.phoneNumber,
        };

        return {
          ...commonData,
          ...userSpecificData,
          ...additionalData,
        };
      },
    );

    const head = Object.keys(rows[0] || {});
    const body = rows.map((row: any) => Object.values(row));

    setDownloadReport({
      title: "Vehicle Status Report",
      excel: { title: "Vehicle Status Report", rows, footer: [] },
      pdf: {
        head: [head],
        body: body,
        title: "Vehicle Status Report",
        userOptions: {
          styles: { cellPadding: 2, fontSize: 8 },
          rowPageBreak: "auto",
          bodyStyles: { valign: "middle" },
          margin: { left: 5, right: 5, top: 10, bottom: 25 },
        },
        pageSize: "a3",
      },
    });
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Table: {
            headerBg: "#F6F8F6",
            borderColor: "#dddddd",
            rowHoverBg: "#E9EFEB",
          },
          Pagination: {
            itemBg: "#E9EFEB",
          },
        },
      }}
    >
      <CustomTableN
        columns={columns}
        data={data}
        height={scroll_y}
        loading={loading}
        onDownloadBtnClick={onDownloadBtnClick}
        downloadReport={downloadReport}
        setDownloadReport={setDownloadReport}
        densityProp="md"
      />
      {/* {loading ? (
				<div className='overflow-scroll h-[calc(100vh-150px)] mx-6 flex items-center justify-center w-full'>
					<Spin className='relative' size='large' />
				</div>
			) : data.length > 0 ? (
				<div className='overflow-scroll h-[calc(100vh-150px)] mx-6'>
					{data.map((vehicle: VehicleDataWithAnkurTravelsData, index: number) => (
						<div key={index} className='mb-2'>
							<div className='bg-neutral-50 p-4 rounded-lg border border-gray-200'>
								<div className='flex justify-between items-center mb-4'>
									<div className='text-base font-semibold col-span-4 overflow-hidden text-clip text-primary-green'>{vehicle.vehReg}</div>
									<div className='text-sm text-gray-500 col-span-2 overflow-hidden text-clip'>
										{moment(vehicle.gpsDtl.latLngDtl.gpstime).format('DD-MM-YYYY HH:mm:ss')}
									</div>
								</div>
								<div className='flex justify-between items-center mb-1'>
									<div className='text-sm font-proxima italic font-medium col-span-6 overflow-hidden text-clip'>
										{vehicle.gpsDtl.latLngDtl.addr?.replaceAll('_', ' ')}{' '}
									</div>
									<div>
										<Tag color={vehicle.gpsDtl.mode === 'RUNNING' ? 'green' : vehicle.gpsDtl.mode === 'IDLE' ? 'yellow' : 'red'}>
											{vehicle.gpsDtl.mode}
										</Tag>
									</div>
								</div>
							</div>
						</div>
					))}
				</div> */}

      {/* : (
				<div className='overflow-scroll h-[calc(100vh-150px)] mx-6 font-xl text-center w-full'>No Data Found</div>
			)} */}
    </ConfigProvider>
  );
};

interface Rows {
  "Vehicle No.": string;
  "GPS Time": string;
  Location: string;
  Speed: string;
  "Ignition State": string;
  ELock: string;
  Status: string;
  Source: string;
  Destination: string;
  "Arrival Date": string;
  Delay: string;
  "Driver's Name": string;
  "Driver's Number": string;
  "Party Name": string;
  Fuel: string;
}
