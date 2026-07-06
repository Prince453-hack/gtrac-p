"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useLazyGetDashcamAlertsQuery } from "@/app/_globalRedux/services/dashcamAlerts";
import { CustomRangePickerReuse } from "../dashboard/CustomRangePickerReuse";
import { Drawer, Select, Button, Modal, Tabs, Spin } from "antd";
import moment from "moment";

const mapDashcamAlarmType = (alarmName: string) => {
  const name = alarmName?.toLowerCase() || "";
  if (name.includes("tired") || name.includes("fatigue")) return "fatigueWarn";
  if (name.includes("smoking") || name.includes("smoke")) return "smoking";
  if (name.includes("seatbelt") || name.includes("seat belt") || name.includes("belt")) return "seatBelt";
  if (name.includes("phone") || name.includes("call")) return "handheldPhoneCall";
  if (name.includes("cover") || name.includes("block")) return "coverningCamera";
  return "fatigueWarn"; // fallback
};

const getAlarmName = (type: string) => {
  switch (type) {
    case "seatBelt":
      return "Seat Belt Warning";
    case "handheldPhoneCall":
      return "Phone Call Warning";
    case "smoking":
      return "Smoking Warning";
    case "fatigueWarn":
      return "Fatigue Warning";
    case "coverningCamera":
      return "Camera Blocked Warning";
    default:
      return type;
  }
};

interface AlertsDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedVehicle: any;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({
  open,
  onClose,
  selectedVehicle,
}) => {
  const [selectedAlarm, setSelectedAlarm] = useState<any | null>(null);
  const [selectedAlarmType, setSelectedAlarmType] = useState("all");
  const [customDateRange, setCustomDateRange] = useState<Date[]>([
    new Date(new Date().setHours(0, 0, 0, 0)),
    new Date(),
  ]);

  const [getGPSTrackTechAlarms, { data: alarmsData, isFetching: isAlarmsFetching, isError: isAlarmsError }] =
    useLazyGetDashcamAlertsQuery();

  // Trigger alarms fetch when selected vehicle or date range changes and drawer is open
  useEffect(() => {
    if (open && selectedVehicle?.gpsDtl?.model) {
      const imei = selectedVehicle.gpsDtl.model.replace("##BSJ", "");
      const startTime = moment(customDateRange[0]).startOf("day").format("YYYY-MM-DD HH:mm:ss");
      const endTime = moment(customDateRange[1]).endOf("day").format("YYYY-MM-DD HH:mm:ss");
      getGPSTrackTechAlarms({ imei, startTime, endTime }).catch((err) =>
        console.error("Failed to fetch dashcam alerts:", err)
      );
    }
  }, [open, selectedVehicle, customDateRange, getGPSTrackTechAlarms]);

  const alarmsList = useMemo(() => {
    if (!alarmsData || alarmsData.message !== "Alerts fetched successfully") return [];
    return alarmsData.data || [];
  }, [alarmsData]);

  const filteredAlarms = useMemo(() => {
    if (!alarmsList) return [];
    if (selectedAlarmType === "all") return alarmsList;
    return alarmsList.filter((alarm: any) => {
      const type = mapDashcamAlarmType(alarm.alarm_name);
      return type === selectedAlarmType;
    });
  }, [alarmsList, selectedAlarmType]);

  const alarmTypeOptions = [
    { value: "all", label: "All Alarms" },
    { value: "fatigueWarn", label: "Fatigue Warning" },
    { value: "smoking", label: "Smoking Warning" },
    { value: "seatBelt", label: "Seat Belt Warning" },
    { value: "handheldPhoneCall", label: "Phone Call Warning" },
    { value: "coverningCamera", label: "Camera Blocked Warning" },
  ];

  return (
    <>
      <Drawer
        title={
          <div className="flex flex-col font-sans">
            <span className="text-lg font-bold text-slate-800">
              {selectedVehicle ? selectedVehicle.vehReg : "Vehicle Alerts"}
            </span>
            <span className="text-xs text-slate-400 font-normal mt-0.5">Dashcam Alerts</span>
          </div>
        }
        placement="right"
        width={450}
        onClose={onClose}
        open={open}
        styles={{ body: { padding: "20px" } }}
      >
        <div className="space-y-2 h-full flex flex-col font-sans">
          {!selectedVehicle ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
              <span className="text-sm font-medium">Select a Vehicle to View Alerts</span>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Select Date Range
                </label>
                <CustomRangePickerReuse
                  customDateRange={customDateRange}
                  setCustomDateRange={setCustomDateRange}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Filter by Type
                </label>
                <Select
                  placeholder="Select alarm type"
                  value={selectedAlarmType}
                  onChange={setSelectedAlarmType}
                  className="w-full font-sans"
                  options={alarmTypeOptions}
                />
              </div>

              <hr className="border-slate-100" />

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {isAlarmsFetching ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                    <Spin spinning size="default" />
                    <span className="text-sm">Fetching alerts...</span>
                  </div>
                ) : isAlarmsError ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    Failed to fetch alerts. Please try again.
                  </div>
                ) : filteredAlarms.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    No alerts found in selected range.
                  </div>
                ) : (
                  filteredAlarms.map((alarm: any, index: number) => {
                    const mappedType = mapDashcamAlarmType(alarm.alarm_name);
                    return (
                      <div
                        key={index}
                        className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col gap-2"
                      >
                        <div className="flex justify-between items-start">
                          <div className="font-semibold text-sm text-slate-700">
                            {alarm.alarm_name || getAlarmName(mappedType)}
                          </div>
                          <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded font-mono">
                            {moment.utc(alarm.time_begin).format("HH:mm:ss")}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 font-mono">
                          Time: {moment.utc(alarm.time_begin).format("YYYY-MM-DD HH:mm:ss")}
                        </div>

                        <div className="flex justify-end mt-1">
                          <Button
                            type="primary"
                            ghost
                            size="small"
                            onClick={() => setSelectedAlarm(alarm)}
                            className="text-xs"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </Drawer>

      <Modal
        title={
          selectedAlarm ? (
            <div className="flex justify-between items-center mt-2 pr-6 font-sans">
              <div>
                <p className="text-xs text-slate-400 font-medium">Alert Details</p>
                <p className="text-lg font-semibold text-slate-700">
                  {selectedAlarm.alarm_name || getAlarmName(mapDashcamAlarmType(selectedAlarm.alarm_name))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-medium">Vehicle</p>
                <p className="text-lg font-semibold text-slate-700">
                  {selectedVehicle?.vehReg}
                </p>
              </div>
            </div>
          ) : (
            "Alert Details"
          )
        }
        width={"60%"}
        open={!!selectedAlarm}
        onCancel={() => setSelectedAlarm(null)}
        footer={null}
        centered
      >
        {selectedAlarm ? (
          <div className="space-y-4 font-sans">
            <div className="flex flex-col sm:flex-row gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-600">
              <div>
                <span className="font-semibold">Alarm Start Time: </span>
                {moment.utc(selectedAlarm.time_begin).format("YYYY-MM-DD HH:mm:ss")}
              </div>
              <div className="sm:border-l sm:pl-4 border-slate-200">
                <span className="font-semibold">Alarm End Time: </span>
                {moment.utc(selectedAlarm.time_end).format("YYYY-MM-DD HH:mm:ss")}
              </div>
            </div>

            <Tabs
              defaultActiveKey="alarm_snapshots"
              items={[
                {
                  label: "Snapshots",
                  key: "alarm_snapshots",
                  children: (
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      {selectedAlarm.image_attachment ? (
                        selectedAlarm.image_attachment
                          .split(",")
                          .map((url: string, index: number) => {
                            const trimmedUrl = url.trim();
                            return (
                              <div key={index} className="col-span-1 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                                <img
                                  src={trimmedUrl}
                                  alt="Alarm snapshot"
                                  className="w-full h-auto max-h-[300px] object-contain mx-auto"
                                />
                              </div>
                            );
                          })
                      ) : (
                        <div className="col-span-2 text-center text-slate-400 py-8">
                          No snapshots available
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  label: "Playback",
                  key: "alarm_playback",
                  children: (
                    <div className="flex justify-center items-center bg-black min-h-[352px] rounded-lg overflow-hidden mt-2">
                      {selectedAlarm.video_attachment ? (
                        <video
                          width="100%"
                          controls
                          key={selectedAlarm.video_attachment}
                          className="max-h-[450px]"
                        >
                          <source
                            src={selectedAlarm.video_attachment}
                            type="video/mp4"
                          />
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <div className="text-white text-center py-8">
                          No video available
                        </div>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        ) : null}
      </Modal>
    </>
  );
};
