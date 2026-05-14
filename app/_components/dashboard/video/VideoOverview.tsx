"use client";

import { setAllMarkers } from "@/app/_globalRedux/dashboard/markersSlice";
import {
  initialSelectedVehicleState,
  setSelectedVehicleBySelectElement,
} from "@/app/_globalRedux/dashboard/selectedVehicleSlice";
import { RootState } from "@/app/_globalRedux/store";
import {
  ArrowRightOutlined,
  CloseOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { Button, Modal, Tabs, Tooltip, Select } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { VehicleDetailsSelect } from "../VehicleDetailsSelect";
import { setVehicleDetailsStatus } from "@/app/_globalRedux/dashboard/isVehicleStatusOrTripStatusActive";
import Image from "next/image";
import BlurBg from "@/public/assets/images/common/blurbg.jpg";
import {
  useGetMettaxAlarmsMutation,
  useGetMettaxDeviceInfoMutation,
} from "@/app/_globalRedux/services/mettax";
import { setChannels } from "@/app/_globalRedux/dashboard/videoTelematics";
import { getToken as getIndiaToken } from "@/lib/mettax";
import { getToken } from "@/lib/singapore-mettax";
import { getOtherToken } from "@/lib/other-mettax";
import { getOther2Token } from "@/lib/other2-mettax";
import moment from "moment";
import { useInView } from "react-intersection-observer";
import { useGetAlarmInfoMutation } from "@/app/_globalRedux/services/gpstracktech";
import { VideoAlarmsRecord } from "@/app/_globalRedux/services/types/post/getVideoAlerts";
import { getAlarmName, VideoAlarmType } from "@/app/helpers/getVideoAlertName";
import { AlarmType } from "@/app/_globalRedux/services/types/post/videoAlerts";
import { getAlertsWithVideoPlayback } from "@/app/helpers/getAlertsWithVideoPlayback";
import VideoAlertPlayback from "./VideoAlertPlayback";
import { setHours, setMinutes } from "date-fns";
import { CustomRangePickerReuse } from "../CustomRangePickerReuse";
import {
  useIndiaGetMettaxAlarmsMutation,
  useIndiaGetMettaxDeviceInfoMutation,
  useIndiaGetMettaxTalkChannelMutation,
} from "@/app/_globalRedux/services/indiaMettax";
import BSJVideoPlayer from "./BSJVideoPlayer";
import { MicIcon } from "@/public/assets/svgs/nav";
import MettaxTalkComponent from "./MettaxTalkComponent";
import { useGetMettaxTalkChannelMutation } from "@/app/_globalRedux/services/mettax";
import VideoPlayback from "./VideoPlayback";

const selectedStyles = {
  selectorBg: "transparent",
  colorBorder: "transparent",
  fontSize: 19,
  optionFontSize: 14,
  optionPadding: "5px",
  optionSelectedColor: "#000",
};

// Constants
const ALLOWED_ALERT_TYPES: VideoAlarmType[] = [
  "seatBelt",
  "handheldPhoneCall",
  "smoking",
  "fatigueWarn",
  "coverningCamera",
];

const ALARM_TYPE_MAP: { [key: number]: string } = {
  201: "handheldPhoneCall",
  38: "fatigueWarn",
  202: "smoking",
  213: "seatBelt",
  200: "fatigueWarn",
  209: "coverningCamera",
};

// Helper functions
const mapGPSTrackTechAlarmType = (alarmType: number): string | null => {
  return ALARM_TYPE_MAP[alarmType] || null;
};

const deduplicateAlarms = (
  currentAlarms: VideoAlarmsRecord[],
  newAlarms: VideoAlarmsRecord[],
): VideoAlarmsRecord[] => {
  const existingIds = new Set(currentAlarms.map((a) => a.id));
  return newAlarms.filter((alarm) => !existingIds.has(alarm.id));
};

const filterAllowedAlarms = (
  alarms: VideoAlarmsRecord[],
): VideoAlarmsRecord[] => {
  return alarms.filter(
    (alarm) =>
      ALLOWED_ALERT_TYPES.includes(alarm.alarmType as VideoAlarmType) &&
      hasMediaOnAlarmRecord(alarm) &&
      getAlertsWithVideoPlayback({
        alarmType: alarm.alarmType as AlarmType,
      }),
  );
};

const hasValidMediaValue = (value: unknown): boolean =>
  typeof value === "string" && value.trim() !== "";

const hasMediaOnRawAlarm = (alarm: any): boolean => {
  const hasAviPath = hasValidMediaValue(alarm?.aviPath);
  const hasImagePath = hasValidMediaValue(alarm?.imagePath);
  const hasMediaPath = hasValidMediaValue(alarm?.mediaPath);
  const hasFilePath = hasValidMediaValue(alarm?.filePath);

  return hasAviPath || hasImagePath || hasMediaPath || hasFilePath;
};

const hasMediaOnAlarmRecord = (alarm: VideoAlarmsRecord): boolean => {
  const hasVideo = hasValidMediaValue((alarm as any)?.videoUrl);
  const hasImages =
    Array.isArray((alarm as any)?.imageUrls) &&
    (alarm as any).imageUrls.length > 0;
  const hasAviPath = hasValidMediaValue((alarm as any)?.aviPath);
  const hasImagePath = hasValidMediaValue((alarm as any)?.imagePath);
  const hasMediaPath = hasValidMediaValue((alarm as any)?.mediaPath);
  const hasFilePath = hasValidMediaValue((alarm as any)?.filePath);

  return (
    hasVideo ||
    hasImages ||
    hasAviPath ||
    hasImagePath ||
    hasMediaPath ||
    hasFilePath
  );
};

const VideoOverview = () => {
  const dispatch = useDispatch();
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle,
  );
  const collapseVehicleStatusToggle = useSelector(
    (state: RootState) => state.collapseVehicleStatusToggle,
  );
  const markers = useSelector((state: RootState) => state.markers);
  const { channels, selectedVehicleDeviceId } = useSelector(
    (state: RootState) => state.videoTelematics,
  );
  const { userId } = useSelector((state: RootState) => state.auth);

  const [getMettaxDeviceInfo] = useGetMettaxDeviceInfoMutation();
  const [videoAlertsTrigger, { isLoading: isFetchingAlarms }] =
    useGetMettaxAlarmsMutation();

  const [getIndiatMettaxDeviceInfo] = useIndiaGetMettaxDeviceInfoMutation();
  const [indiaVideoAlertsTrigger, { isLoading: isIndiaFetchingAlarms }] =
    useIndiaGetMettaxAlarmsMutation();

  const [getGPSTrackTechAlarms] = useGetAlarmInfoMutation();
  const [getMettaxTalkChannel] = useGetMettaxTalkChannelMutation();
  const [getIndiaMettaxTalkChannel] = useIndiaGetMettaxTalkChannelMutation();

  const [activeChannelId, setActiveChannelId] = useState<number[]>([]);
  const [visibleDetailsStyling, setVisibleDetailsStyling] = useState("");
  const [channelsVideoLinks, setChannelsVideoLinks] = useState<string[]>([]);
  const [usingIndiaAPI, setUsingIndiaAPI] = useState(false);
  const [smartWitnessWidgetUrl, setSmartiWitnessWidgetUrl] =
    useState<string>("");
  const [loadingSmartiWitness, setLoadingSmartiWitness] = useState(false);
  const [shouldShowSmartWitnessVideo, setShouldShowSmartWitnessVideo] =
    useState(false);

  const alarms = useRef<VideoAlarmsRecord[]>([]);
  const allAlarms = useRef<VideoAlarmsRecord[]>([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [alarmsVersion, setAlarmsVersion] = useState(0);
  const [selectedAlarm, setSelectedAlarm] = useState<VideoAlarmsRecord | null>(
    null,
  );
  const [isError, setIsError] = useState(false);
  const [customDateRange, setCustomDateRange] = useState([
    setHours(setMinutes(new Date(), 0), 0),
    new Date(),
  ]);
  const [selectedAlarmType, setSelectedAlarmType] = useState<string>("all");

  const [ref, inView] = useInView({
    threshold: 0,
  });

  const isBSJVehicle = selectedVehicle.gpsDtl.model?.includes("##BSJ") ?? false;
  const isSelectedVehicleOffline =
    selectedVehicle.gpsDtl.inactiveStatus === 1 ||
    selectedVehicle.gpsDtl.inactiveStatus === "1";

  const extractAndSetChannels = (channelName: string) => {
    const channelObj = JSON.parse(channelName) as Array<{
      id: number;
      name: string;
    }>;
    dispatch(setChannels(channelObj.map((channel) => channel.id)));
  };

  const setChannelsFn = async () => {
    const isBSJModel = selectedVehicleDeviceId?.includes("##BSJ");
    const deviceIdToUse = isBSJModel
      ? selectedVehicleDeviceId?.replace("##BSJ", "")
      : selectedVehicleDeviceId;

    if (Number(userId) === 4343) {
      try {
        const response = await getMettaxDeviceInfo({
          model: deviceIdToUse,
        }).unwrap();

        extractAndSetChannels(response.data.channelName);
        setUsingIndiaAPI(false); // Using Singapore
        return; // Exit early if Singapore works
      } catch (error: any) {
        console.warn(
          "Singapore IP is not fetching Live Stream channel data, switching to India fallback:",
          error,
        );

        try {
          const fallbackResponse = await getIndiatMettaxDeviceInfo({
            model: deviceIdToUse,
          }).unwrap();

          extractAndSetChannels(fallbackResponse.data.channelName);
          setUsingIndiaAPI(true); // Using India as fallback
        } catch (fallbackError) {
          console.error("Both APIs failed:", fallbackError);
        }
      }
    } else if (Number(userId) === 81707) {
      try {
        const response = await getMettaxDeviceInfo({
          model: deviceIdToUse,
        }).unwrap();

        extractAndSetChannels(response.data.channelName);
        setUsingIndiaAPI(false);
      } catch (error: any) {
        console.warn("Singapore API failed for user:", error);
      }
    } else {
      // For other users (including 5360), use the original logic
      try {
        const response =
          Number(userId) === 5360
            ? await getIndiatMettaxDeviceInfo({
                model: deviceIdToUse,
              }).unwrap()
            : await getMettaxDeviceInfo({
                model: deviceIdToUse,
              }).unwrap();

        extractAndSetChannels(response.data.channelName);
        setUsingIndiaAPI(Number(userId) === 5360);
      } catch (error: any) {
        console.error(error);
      }
    }
  };

  useEffect(() => {
    setIsError(false);
  }, [selectedVehicle]);

  // Fetch alarms when selectedVehicle or pageIndex changes
  useEffect(() => {
    if (isError === false) {
      if (selectedVehicle.gpsDtl.model !== null && hasMore) {
        if (isBSJVehicle) {
          getGPSTrackTechAlarms({
            ids: [201, 38, 202, 213, 200, 209],
            pageNumber: 1,
            pageSize: 100,
            queryParams: [selectedVehicle.gpsDtl.model.replace("##BSJ", "")],
            queryType: 1,
            startTime: moment(customDateRange[0]).format("YYYY-MM-DD HH:mm:ss"),
            endTime: moment(customDateRange[1]).format("YYYY-MM-DD HH:mm:ss"),
          })
            .then((response) => {
              if (response.data && response.data.code === 200) {
                const mappedAlarms = response.data.data
                  .filter((alarm) => hasMediaOnRawAlarm(alarm))
                  .map((alarm) => {
                    const mappedAlarmType = mapGPSTrackTechAlarmType(
                      alarm.alarmType,
                    );
                    if (!mappedAlarmType) return null;

                    const baseUrl = "https://y.gpstracktech.com";
                    const videoUrl = alarm.aviPath
                      ? `${baseUrl}${alarm.aviPath}`
                      : undefined;
                    const imageUrls = alarm.imagePath
                      ? alarm.imagePath
                          .split(",")
                          .map((path) => `${baseUrl}${path}`)
                      : undefined;

                    const transformedAlarm: VideoAlarmsRecord = {
                      id: alarm.alarmId,
                      deviceId: alarm.deviceId,
                      deviceName: alarm.deviceName,
                      alarmType: mappedAlarmType,
                      alarmTs: alarm.alarmTime,
                      alarmTsEnd: alarm.alarmTime,
                      lat: parseFloat(alarm.lat) || 0,
                      lon: parseFloat(alarm.lon) || 0,
                      alarmText: 0,
                      serialNo: alarm.deviceId,
                      fenceId: null,
                      videoUrl: videoUrl,
                      imageUrls: imageUrls,
                      alarmName: alarm.alarmName,
                      speed: alarm.speed,
                      duration: alarm.duration,
                      driverName: alarm.driverName,
                    };
                    return transformedAlarm;
                  })
                  .filter(Boolean) as VideoAlarmsRecord[];

                const uniqueNewAlarms = deduplicateAlarms(
                  alarms.current,
                  mappedAlarms,
                );

                if (uniqueNewAlarms.length > 0) {
                  alarms.current = [...alarms.current, ...uniqueNewAlarms];
                  setAlarmsVersion((prev) => prev + 1);
                }

                if (mappedAlarms.length < 100) {
                  setHasMore(false);
                }
              }
            })
            .catch((error) => {
              setIsError(true);
            });
        } else if (Number(userId) === 5360) {
          // User 5360 uses India API only
          indiaVideoAlertsTrigger({
            startTime: moment(customDateRange[0]).format("YYYY-MM-DD HH:mm:ss"),
            endTime: moment(customDateRange[1]).format("YYYY-MM-DD HH:mm:ss"),
            deviceIds: selectedVehicle.gpsDtl.model as string,
            alarmType: null,
            pageSize: 100,
            pageIndex,
          }).then((response) => {
            if (response.data && response.data.code === 63001) {
              setIsError(true);
            }
            if (response.data && response.data.data) {
              const newAlarms = response.data.data.records;
              const filteredNewAlarms = filterAllowedAlarms(
                newAlarms.filter((alarm: any) => hasMediaOnRawAlarm(alarm)),
              );
              const uniqueNewAlarms = deduplicateAlarms(
                alarms.current,
                filteredNewAlarms,
              );

              if (uniqueNewAlarms.length > 0) {
                alarms.current = [...alarms.current, ...uniqueNewAlarms];
              }
              const total = response.data.data.total;
              if (alarms.current.length >= total) {
                setHasMore(false);
              }
            }
          });
        } else if (Number(userId) === 4343) {
          // User 4343 tries Singapore first, then India as fallback
          videoAlertsTrigger({
            startTime: moment(customDateRange[0]).format("YYYY-MM-DD HH:mm:ss"),
            endTime: moment(customDateRange[1]).format("YYYY-MM-DD HH:mm:ss"),
            deviceIds: selectedVehicle.gpsDtl.model as string,
            alarmType: null,
            pageSize: 100,
            pageIndex,
          })
            .then((response) => {
              if (response.data && response.data.code === 63001) {
                setIsError(true);
              }
              if (
                response.data &&
                response.data.data &&
                response.data.data.records.length > 0
              ) {
                const newAlarms = response.data.data.records;
                const filteredNewAlarms = filterAllowedAlarms(
                  newAlarms.filter((alarm: any) => hasMediaOnRawAlarm(alarm)),
                );
                const uniqueNewAlarms = deduplicateAlarms(
                  alarms.current,
                  filteredNewAlarms,
                );

                if (uniqueNewAlarms.length > 0) {
                  alarms.current = [...alarms.current, ...uniqueNewAlarms];
                }
                const total = response.data.data.total;
                if (alarms.current.length >= total) {
                  setHasMore(false);
                }
              } else {
                indiaVideoAlertsTrigger({
                  startTime: moment(customDateRange[0]).format(
                    "YYYY-MM-DD HH:mm:ss",
                  ),
                  endTime: moment(customDateRange[1]).format(
                    "YYYY-MM-DD HH:mm:ss",
                  ),
                  deviceIds: selectedVehicle.gpsDtl.model as string,
                  alarmType: null,
                  pageSize: 100,
                  pageIndex,
                }).then((fallbackResponse) => {
                  if (
                    fallbackResponse.data &&
                    fallbackResponse.data.code === 63001
                  ) {
                    setIsError(true);
                  }
                  if (fallbackResponse.data && fallbackResponse.data.data) {
                    const newAlarms = fallbackResponse.data.data.records;
                    const filteredNewAlarms = filterAllowedAlarms(
                      newAlarms.filter((alarm: any) =>
                        hasMediaOnRawAlarm(alarm),
                      ),
                    );
                    const uniqueNewAlarms = deduplicateAlarms(
                      alarms.current,
                      filteredNewAlarms,
                    );

                    if (uniqueNewAlarms.length > 0) {
                      alarms.current = [...alarms.current, ...uniqueNewAlarms];
                    }
                    const total = fallbackResponse.data.data.total;
                    if (alarms.current.length >= total) {
                      setHasMore(false);
                    }
                  }
                });
              }
            })
            .catch((error) => {
              indiaVideoAlertsTrigger({
                startTime: moment(customDateRange[0]).format(
                  "YYYY-MM-DD HH:mm:ss",
                ),
                endTime: moment(customDateRange[1]).format(
                  "YYYY-MM-DD HH:mm:ss",
                ),
                deviceIds: selectedVehicle.gpsDtl.model as string,
                alarmType: null,
                pageSize: 100,
                pageIndex,
              }).then((fallbackResponse) => {
                if (
                  fallbackResponse.data &&
                  fallbackResponse.data.code === 63001
                ) {
                  setIsError(true);
                }
                if (fallbackResponse.data && fallbackResponse.data.data) {
                  const newAlarms = fallbackResponse.data.data.records;
                  const filteredNewAlarms = filterAllowedAlarms(
                    newAlarms.filter((alarm: any) => hasMediaOnRawAlarm(alarm)),
                  );
                  const uniqueNewAlarms = deduplicateAlarms(
                    alarms.current,
                    filteredNewAlarms,
                  );

                  if (uniqueNewAlarms.length > 0) {
                    alarms.current = [...alarms.current, ...uniqueNewAlarms];
                  }
                  const total = fallbackResponse.data.data.total;
                  if (alarms.current.length >= total) {
                    setHasMore(false);
                  }
                }
              });
            });
        } else if (Number(userId) === 81707) {
          videoAlertsTrigger({
            startTime: moment(customDateRange[0]).format("YYYY-MM-DD HH:mm:ss"),
            endTime: moment(customDateRange[1]).format("YYYY-MM-DD HH:mm:ss"),
            deviceIds: selectedVehicle.gpsDtl.model as string,
            alarmType: null,
            pageSize: 100,
            pageIndex,
          }).then((response) => {
            if (response.data && response.data.code === 63001) {
              setIsError(true);
            }
            if (response.data && response.data.data) {
              const newAlarms = response.data.data.records;
              const filteredNewAlarms = filterAllowedAlarms(
                newAlarms.filter((alarm: any) => hasMediaOnRawAlarm(alarm)),
              );
              const uniqueNewAlarms = deduplicateAlarms(
                alarms.current,
                filteredNewAlarms,
              );

              if (uniqueNewAlarms.length > 0) {
                alarms.current = [...alarms.current, ...uniqueNewAlarms];
              }

              const allAlarmsData = [...allAlarms.current, ...newAlarms];
              allAlarms.current = allAlarmsData;

              const total = response.data.data.total;
              if (allAlarmsData.length >= total) {
                setHasMore(false);
              }
            }
          });
        } else {
          // Other users use Singapore API
          videoAlertsTrigger({
            startTime: moment(customDateRange[0]).format("YYYY-MM-DD HH:mm:ss"),
            endTime: moment(customDateRange[1]).format("YYYY-MM-DD HH:mm:ss"),
            deviceIds: selectedVehicle.gpsDtl.model as string,
            alarmType: null,
            pageSize: 100,
            pageIndex,
          }).then((response) => {
            if (response.data && response.data.code === 63001) {
              setIsError(true);
            }
            if (response.data && response.data.data) {
              const newAlarms = response.data.data.records;
              const filteredNewAlarms = filterAllowedAlarms(
                newAlarms.filter((alarm: any) => hasMediaOnRawAlarm(alarm)),
              );
              const uniqueNewAlarms = deduplicateAlarms(
                alarms.current,
                filteredNewAlarms,
              );

              if (uniqueNewAlarms.length > 0) {
                alarms.current = [...alarms.current, ...uniqueNewAlarms];
              }
              const total = response.data.data.total;
              if (alarms.current.length >= total) {
                setHasMore(false);
              }
            }
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedVehicle,
    pageIndex,
    hasMore,
    videoAlertsTrigger,
    indiaVideoAlertsTrigger,
    customDateRange,
  ]);

  // Reset alarms when selectedVehicle changes
  useEffect(() => {
    alarms.current = [];
    allAlarms.current = [];
    setPageIndex(1);
    setHasMore(true);
    setSelectedAlarmType("all");
  }, [selectedVehicle, customDateRange]);

  useEffect(() => {
    const isLoadingForCurrentUser =
      Number(userId) === 5360 ? isIndiaFetchingAlarms : isFetchingAlarms;

    if (isBSJVehicle) {
      if (inView && hasMore && isError === false) {
        setPageIndex((prev) => prev + 1);
      }
    } else {
      if (inView && hasMore && !isLoadingForCurrentUser && isError === false) {
        setPageIndex((prev) => prev + 1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasMore, isFetchingAlarms, isIndiaFetchingAlarms]);

  useEffect(
    () => {
      if (selectedVehicle.vId === 0) {
        if (collapseVehicleStatusToggle) {
          setVisibleDetailsStyling("-translate-x-[442px]");
        } else {
          setVisibleDetailsStyling("-translate-x-[20px]");
        }
      } else if (selectedVehicle.vId !== 0) {
        if (collapseVehicleStatusToggle) {
          setVisibleDetailsStyling("translate-x-[20px]");
        } else {
          setVisibleDetailsStyling("translate-x-[442px]");
        }
        dispatch(setChannels([]));
        setChannelsFn();

        // Reset SmartWitness state when vehicle changes
        if (Number(userId) === 833590) {
          setShouldShowSmartWitnessVideo(false);
          setSmartiWitnessWidgetUrl("");
        }
      }
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedVehicle, collapseVehicleStatusToggle, dispatch],
  );

  useEffect(() => {
    if (channels.length > 0) {
      if (Number(userId) === 5360) {
        getIndiaToken().then((token) => {
          const channelsLinksList: string[] = [];
          channels.forEach((channel) => {
            const link = `${process.env.NEXT_PUBLIC_INDIA_METTAX_API}/h5/#/live/v2?deviceId=${selectedVehicleDeviceId}&channelId=${channel}&token=${token}`;
            channelsLinksList.push(link);
          });
          setChannelsVideoLinks(channelsLinksList);
        });
      } else if (Number(userId) === 4343) {
        if (usingIndiaAPI) {
          getIndiaToken().then((token) => {
            const channelsLinksList: string[] = [];
            channels.forEach((channel) => {
              const link = `${process.env.NEXT_PUBLIC_INDIA_METTAX_API}/h5/#/live/v2?deviceId=${selectedVehicleDeviceId}&channelId=${channel}&token=${token}`;
              channelsLinksList.push(link);
            });
            setChannelsVideoLinks(channelsLinksList);
          });
        } else {
          getToken().then((token) => {
            const channelsLinksList: string[] = [];
            channels.forEach((channel) => {
              const link = `${process.env.NEXT_PUBLIC_METTAX_API}/h5/#/live/v2?deviceId=${selectedVehicleDeviceId}&channelId=${channel}&token=${token}`;
              channelsLinksList.push(link);
            });
            setChannelsVideoLinks(channelsLinksList);
          });
        }
      } else if (Number(userId) === 81707 || Number(userId) === 833563) {
        // User 81707: Use OTHER2 keys for specific vehicles, OTHER keys for others
        const isSpecialVehicle =
          selectedVehicle.vId === 12436055 ||
          selectedVehicle.vId === 12435769 ||
          selectedVehicle.vId === 12459750;
        const tokenFunction = isSpecialVehicle ? getOther2Token : getOtherToken;

        tokenFunction().then((token) => {
          const channelsLinksList: string[] = [];
          channels.forEach((channel) => {
            const link = `${process.env.NEXT_PUBLIC_METTAX_API}/h5/#/live/v2?deviceId=${selectedVehicleDeviceId}&channelId=${channel}&token=${token}`;
            channelsLinksList.push(link);
          });
          setChannelsVideoLinks(channelsLinksList);
        });
      } else {
        getToken().then((token) => {
          const channelsLinksList: string[] = [];
          channels.forEach((channel) => {
            const link = `${process.env.NEXT_PUBLIC_METTAX_API}/h5/#/live/v2?deviceId=${selectedVehicleDeviceId}&channelId=${channel}&token=${token}`;
            channelsLinksList.push(link);
          });
          setChannelsVideoLinks(channelsLinksList);
        });
      }
      setActiveChannelId([]);
    }
  }, [channels, selectedVehicleDeviceId, usingIndiaAPI]);

  // Get available alarm types for dropdown
  const getAvailableAlarmTypes = () => {
    const alarmTypes = Array.from(
      new Set(alarms.current.map((alarm) => alarm.alarmType)),
    );
    return alarmTypes.map((type) => ({
      value: type,
      label: getAlarmName(type as VideoAlarmType),
    }));
  };

  const getFilteredAlarms = (): VideoAlarmsRecord[] => {
    if (selectedAlarmType === "all") {
      return alarms.current;
    }
    return alarms.current.filter(
      (alarm: VideoAlarmsRecord) => alarm.alarmType === selectedAlarmType,
    );
  };

  // Stop SmartWitness stream for user 833590
  const stopSmartWitnessStream = async () => {
    if (Number(userId) !== 833590) return;

    try {
      const response = await fetch(
        "https://sv.smartwitness.co/SmartWitness/RESTCommandWebService/ExecuteServerCommand/Snapshots/StopEnhancedLiveStreaming?RecorderID=016124006428023",
        {
          method: "GET",
          headers: {
            APIKey: "1WH2qXgUVh0H9X3OBul0rhb3qyCjFf6Jn1TzMC",
          },
        },
      );

      if (!response.ok) {
        console.error("Failed to stop SmartWitness stream");
      }
    } catch (error) {
      console.error("Error stopping SmartWitness stream:", error);
    }
  };

  // Fetch SmartWitness stream for user 833590
  const fetchSmartWitnessStream = async () => {
    if (Number(userId) !== 833590) return;

    try {
      setLoadingSmartiWitness(true);

      const response = await fetch(
        "https://sv.smartwitness.co/SmartWitness/RESTCommandWebService/ExecuteServerCommand/Snapshots/StartEnhancedLiveStreaming?RecorderID=016124001192004",
        {
          method: "GET",
          headers: {
            APIKey: "1WH2qXgUVh0H9X3OBul0rhb3qyCjFf6Jn1TzMC",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.MoreInfo?.WidgetUrl) {
          setSmartiWitnessWidgetUrl(data.MoreInfo.WidgetUrl);
        }
      } else {
        console.error("Failed to fetch SmartWitness stream");
      }
    } catch (error) {
      console.error("Error fetching SmartWitness stream:", error);
    } finally {
      setLoadingSmartiWitness(false);
    }
  };

  // Auto-refresh SmartWitness stream every 58 seconds
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (shouldShowSmartWitnessVideo && Number(userId) === 833590) {
      // Set up interval to stop then start stream every 58 seconds
      intervalId = setInterval(async () => {
        // First stop the stream
        await stopSmartWitnessStream();
        // Then start a new stream
        await fetchSmartWitnessStream();
      }, 58000); // 58 seconds
    }

    // Cleanup interval on unmount or when shouldShowSmartWitnessVideo changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [shouldShowSmartWitnessVideo, userId]);

  // Helper function to get talk channel based on user
  const getTalkChannelForUser = async (params: {
    deviceId: string;
    channelId?: number;
  }) => {
    if (Number(userId) === 5360) {
      // User 5360 uses India API
      return getIndiaMettaxTalkChannel(params).unwrap();
    } else if (Number(userId) === 4343) {
      try {
        return await getMettaxTalkChannel(params).unwrap();
      } catch (error) {
        console.warn("Singapore API failed, trying India fallback:", error);
        return getIndiaMettaxTalkChannel(params).unwrap();
      }
    } else if (Number(userId) === 81707) {
      // User 81707: For now use Singapore API (can be extended later for specific tokens)
      return getMettaxTalkChannel(params).unwrap();
    } else {
      // Default: Use Singapore API
      return getMettaxTalkChannel(params).unwrap();
    }
  };

  return (
    <div
      className={`ml-2 absolute py-[22px] z-20 ${visibleDetailsStyling} min-w-[450px] w-[450px] bg-white h-[calc(100vh-60px)] transition-all duration-300`}
    >
      <div className="flex items-center justify-between px-5 mb-4">
        <div className="flex gap-2 items-start flex-col">
          <div className="flex items-center gap-2">
            <Tooltip
              title="Back to Vehicle Details"
              placement="bottom"
              mouseEnterDelay={1}
            >
              <ArrowRightOutlined
                className="cursor-pointer text-primary-green hover:text-green-600 transition-colors rotate-180"
                onClick={() => {
                  dispatch(setVehicleDetailsStatus({ type: "vehicle" }));
                }}
              />
            </Tooltip>
            <p className="text-primary-green font-semibold text-sm">
              Video Overview
            </p>
          </div>
          <div className="w-full">
            <VehicleDetailsSelect selectedStyles={selectedStyles} type="" />
          </div>
        </div>
        <Tooltip title="Close" placement="right" mouseEnterDelay={1}>
          <div
            className="pr-1"
            onClick={() => {
              dispatch(
                setSelectedVehicleBySelectElement(initialSelectedVehicleState),
              );
              setActiveChannelId([]);
              dispatch(
                setAllMarkers(
                  markers.map((m) => ({
                    ...m,
                    isVisible: true,
                    isVisibility: true,
                    visibility: true,
                  })),
                ),
              );
              dispatch(setVehicleDetailsStatus({ type: "vehicle" }));
            }}
          >
            <CloseOutlined className="cursor-pointer" />
          </div>
        </Tooltip>
      </div>

      <div className="space-y-2 px-6 mt-4 flex-col items-center">
        <Tabs
          defaultActiveKey=""
          tabBarGutter={22}
          items={[
            {
              label: "Live Stream",
              key: "live_stream",
              children: (
                <div className="overflow-y-scroll h-[calc(100vh-240px)] space-y-2">
                  {channels.map((channel, index) => (
                    <div key={channel} className="aspect-video relative">
                      {activeChannelId.includes(channel) ? (
                        <iframe
                          src={channelsVideoLinks[index]}
                          className="w-full h-full rounded-lg shadow-lg"
                          allowFullScreen
                        />
                      ) : (
                        <div className="w-full h-full relative rounded-lg overflow-hidden">
                          <div className="absolute inset-0 bg-gray-200 blur-lg">
                            <Image src={BlurBg} alt="Placeholder" fill />
                          </div>
                          <button
                            onClick={() => {
                              setActiveChannelId((prev) => [...prev, channel]);
                            }}
                            className="absolute inset-0 flex items-center justify-center hover:bg-black/10 transition-colors"
                          >
                            <PlayCircleOutlined className="text-white text-4xl opacity-80 hover:opacity-100 transition-opacity" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* BSJ Stream Videos */}
                  {isBSJVehicle && selectedVehicle.gpsDtl.model && (
                    <div className="mt-4">
                      <BSJVideoPlayer
                        deviceId={selectedVehicle.gpsDtl.model.replace(
                          "##BSJ",
                          "",
                        )}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              ),
            },
            {
              label: "Video Alarms",
              key: "video_alarms",
              children: (
                <>
                  <div className="mb-4">
                    <CustomRangePickerReuse
                      customDateRange={customDateRange}
                      setCustomDateRange={setCustomDateRange}
                    />
                  </div>
                  <div className="mb-4">
                    <Select
                      placeholder="Select alarm type"
                      value={selectedAlarmType}
                      onChange={setSelectedAlarmType}
                      className="w-48"
                      options={[
                        { value: "all", label: "All Alarms" },
                        ...getAvailableAlarmTypes(),
                      ]}
                    />
                  </div>
                  <div className="overflow-y-scroll h-[calc(100vh-340px)] space-y-2">
                    {getFilteredAlarms().length === 0 ? (
                      <p>No alarms found.</p>
                    ) : (
                      getFilteredAlarms().map((alarm: VideoAlarmsRecord) => {
                        return (
                          <div
                            key={alarm.id}
                            className="bg-white p-4 rounded shadow"
                          >
                            <div>
                              <p>
                                <strong>Type:</strong>{" "}
                                {getAlarmName(
                                  alarm.alarmType as VideoAlarmType,
                                )}
                              </p>
                              <p>
                                <strong>Time:</strong>{" "}
                                {isBSJVehicle
                                  ? moment(alarm.alarmTs).format(
                                      "YYYY-MM-DD HH:mm:ss",
                                    )
                                  : moment(alarm.alarmTs)
                                      .add(5.5, "hours")
                                      .format("YYYY-MM-DD HH:mm:ss")}
                              </p>
                            </div>

                            {/* View Details button - available for all vehicles */}
                            <div className="w-full flex justify-end mt-2">
                              <Button
                                type="text"
                                onClick={() => setSelectedAlarm(alarm)}
                              >
                                View Details <ArrowRightOutlined />
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {(Number(userId) === 5360 ||
                      (Number(userId) === 4343 && isIndiaFetchingAlarms) ||
                      isFetchingAlarms) && <p>Loading more alarms...</p>}
                    <div ref={ref} />
                  </div>
                </>
              ),
            },
            ...(isBSJVehicle
              ? [
                  {
                    label: "Video Playback",
                    key: "video_playback",
                    children: (
                      <div className="h-[calc(100vh-240px)]">
                        <VideoPlayback
                          deviceId={String(
                            selectedVehicle.gpsDtl.model || "",
                          ).replace("##BSJ", "")}
                          isDeviceOffline={isSelectedVehicleOffline}
                        />
                      </div>
                    ),
                  },
                ]
              : []),
            ...(!isBSJVehicle && selectedVehicleDeviceId
              ? [
                  {
                    label: (
                      <div className="flex items-center gap-2">
                        <Image
                          src={MicIcon}
                          alt="Talk"
                          className="w-4 h-4"
                          width={16}
                          height={16}
                        />
                        <span>Talk</span>
                      </div>
                    ),
                    key: "mettax_talk",
                    children: (
                      <div className="h-[calc(100vh-240px)]">
                        <MettaxTalkComponent
                          deviceId={selectedVehicleDeviceId.replace(
                            "##BSJ",
                            "",
                          )}
                          channelId={1}
                          getTalkChannel={getTalkChannelForUser}
                        />
                      </div>
                    ),
                  },
                ]
              : []),
            // Add MicIcon tab only for BSJ devices
            ...(isBSJVehicle
              ? [
                  {
                    label: (
                      <div className="flex items-center gap-2">
                        <Image
                          src={MicIcon}
                          alt="Mic"
                          className="w-4 h-4"
                          width={30}
                          height={30}
                        />
                        <span>Talk</span>
                      </div>
                    ),
                    key: "bsj_talk",
                    children: (
                      <div className="h-[calc(100vh-240px)]">
                        <iframe
                          src={(() => {
                            const deviceId =
                              selectedVehicle.gpsDtl.model?.replace(
                                "##BSJ",
                                "",
                              ) || "";
                            const fullLink = `https://y.gpstracktech.com/#/videoapi/talk?param={"device":"${deviceId}"}&config={"url":"wss://y.gpstracktech.com/videows/","apiToken":"ba3c5a15-cd8a-4706-b9d7-b34a64244541","apiName":"","lang":"en"}&isSleep=0&countdown=0&t=${Date.now()}`;
                            return fullLink;
                          })()}
                          className="w-full h-full rounded-lg"
                          allowFullScreen
                          allow="microphone; camera"
                        />
                      </div>
                    ),
                  },
                ]
              : []),
            // Add SmartWitness tab for user 833590
            ...(Number(userId) === 833590
              ? [
                  {
                    label: "New Stream",
                    key: "smart_witness",
                    children: (
                      <div className="space-y-2">
                        {loadingSmartiWitness ? (
                          <div className="flex items-center justify-center w-full h-[300px]">
                            <p>Loading stream...</p>
                          </div>
                        ) : shouldShowSmartWitnessVideo &&
                          smartWitnessWidgetUrl ? (
                          <iframe
                            src={smartWitnessWidgetUrl}
                            className="w-full h-[230px] rounded-lg shadow-lg border"
                            allowFullScreen
                            title="SmartWitness Live Stream"
                          />
                        ) : (
                          <div className="w-full h-[230px] relative rounded-lg overflow-hidden bg-gray-200">
                            <Image
                              src={BlurBg}
                              alt="Placeholder"
                              fill
                              className="object-cover blur-lg"
                            />
                            <button
                              onClick={() => {
                                setShouldShowSmartWitnessVideo(true);
                                fetchSmartWitnessStream();
                              }}
                              className="absolute inset-0 flex items-center justify-center hover:bg-black/10 transition-colors"
                            >
                              <PlayCircleOutlined className="text-white text-6xl opacity-80 hover:opacity-100 transition-opacity" />
                            </button>
                          </div>
                        )}
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </div>

      <Modal
        title={
          selectedAlarm ? (
            <div className="flex justify-between items-center mt-2">
              <div>
                <p className="text-xs">Alert Details</p>
                <p className="text-lg font-semibold">
                  {getAlarmName(selectedAlarm.alarmType as AlarmType)}
                </p>
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {selectedAlarm.deviceName}
                </p>
              </div>
            </div>
          ) : (
            "Alert Details"
          )
        }
        style={{ top: 30, position: "relative" }}
        width={"60%"}
        open={!!selectedAlarm}
        onCancel={() => setSelectedAlarm(null)}
        footer={null}
        centered
        className=""
      >
        {selectedAlarm ? (
          <>
            <div className="flex gap-5 mb-4">
              <p>
                Alarm Start Time:{" "}
                <span className="font-medium">
                  {isBSJVehicle
                    ? moment(selectedAlarm.alarmTs).format(
                        "YYYY-MM-DD HH:mm:ss",
                      )
                    : moment(selectedAlarm.alarmTs)
                        .add(5.5, "hours")
                        .format("YYYY-MM-DD HH:mm:ss")}
                </span>
              </p>
              <hr />
              <p>
                Alarm End Time:{" "}
                <span className="font-medium">
                  {isBSJVehicle
                    ? moment(selectedAlarm.alarmTsEnd).format(
                        "YYYY-MM-DD HH:mm:ss",
                      )
                    : moment(selectedAlarm.alarmTsEnd)
                        .add(5.5, "hours")
                        .format("YYYY-MM-DD HH:mm:ss")}
                </span>
              </p>
            </div>

            {/* BSJ Vehicle - Exact Mettax UI match */}
            {isBSJVehicle ? (
              <Tabs
                defaultActiveKey=""
                items={[
                  {
                    label: "Snapshots",
                    key: "alarm_snapshots",
                    children: (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          {selectedAlarm.imageUrls &&
                          selectedAlarm.imageUrls.length > 0 ? (
                            selectedAlarm.imageUrls.map((imageUrl, index) => (
                              <div key={index} className="col-span-1">
                                <img
                                  src={imageUrl}
                                  width={500}
                                  height={500}
                                  alt={selectedAlarm.id}
                                />
                              </div>
                            ))
                          ) : (
                            <div className="col-span-2 text-center text-gray-500 py-8">
                              No snapshots available
                            </div>
                          )}
                        </div>
                      </>
                    ),
                  },
                  {
                    label: "Playback",
                    key: "alarm_playback",
                    children: (
                      <div className="flex justify-center items-center bg-black min-h-[352px]">
                        {selectedAlarm.videoUrl ? (
                          <div>
                            <video
                              width="100%"
                              controls
                              key={selectedAlarm.videoUrl}
                            >
                              <source
                                src={selectedAlarm.videoUrl}
                                type="video/mp4"
                              />
                            </video>
                          </div>
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
            ) : (
              /* Use existing VideoAlertPlayback for regular Mettax vehicles */
              <VideoAlertPlayback selectedAlarm={selectedAlarm} />
            )}
          </>
        ) : null}
      </Modal>
    </div>
  );
};

export default VideoOverview;
