"use client";

import {
  DevRecordQueryFileItem,
  useDevRecordQueryMutation,
} from "@/app/_globalRedux/services/recordQuery";
import { getSingleVehicleStatus } from "@/app/helpers/api/showVehicleStatus";
import BlurBg from "@/public/assets/images/common/blurbg.jpg";
import { PlayCircleFilled, PlayCircleOutlined } from "@ant-design/icons";
import { Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import moment from "moment";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";

interface VideoPlaybackProps {
  deviceId: string;
  isDeviceOffline?: boolean;
}

interface PlaybackTableRow {
  key: string;
  no: number;
  beginTime: string;
  endTime: string;
  channel: string;
  record: DevRecordQueryFileItem;
}

const baseUrl = "https://y.gpstracktech.com/#/videoapi/rec";
const wsConfig = {
  url: "wss://y.gpstracktech.com/videows/",
  apiToken: process.env.NEXT_PUBLIC_BSJ_VIDEO_API_TOKEN || "",
  apiName: "",
  lang: "en",
};

const parseRecordTime = (value: string) => moment(value, "YYYYMMDDHHmmss");

const formatRecordTime = (value: string) => {
  const parsed = parseRecordTime(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : value;
};

const buildPlaybackUrl = (record: DevRecordQueryFileItem) => {
  const params = {
    device: record.deviceId,
    channel: record.channel,
    protocolType: 1,
    codetype: record.codetype,
    datatype: record.datatype,
    begintime: record.begintime,
    endtime: record.endtime,
    storgetype: record.storgetype,
  };

  const controls = "play,fullscreen,record,mute,screenshot,playbackRate";
  const videoFormat = 1;
  const isSleep = 0;
  const countdown = 0;
  const timestamp = Date.now();

  const encodedParams = encodeURIComponent(JSON.stringify(params));
  const encodedConfig = encodeURIComponent(
    JSON.stringify({
      url: "",
      apiToken: wsConfig.apiToken,
      apiName: "",
      lang: wsConfig.lang,
    }),
  );

  return `${baseUrl}?param=${encodedParams}&config=${encodedConfig}&controls=${controls}&videoFormat=${videoFormat}&isSleep=${isSleep}&countdown=${countdown}&t=${timestamp}`;
};

const VideoPlayback: React.FC<VideoPlaybackProps> = ({
  deviceId,
  isDeviceOffline = false,
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateDeviceId, setSelectedDateDeviceId] = useState<
    string | null
  >(null);
  const [records, setRecords] = useState<DevRecordQueryFileItem[]>([]);
  const [selectedRecord, setSelectedRecord] =
    useState<DevRecordQueryFileItem | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState("");

  const [devRecordQuery, { isLoading }] = useDevRecordQueryMutation();

  const weekDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        moment()
          .startOf("day")
          .subtract(6 - index, "day"),
      ),
    [],
  );

  const tableData = useMemo<PlaybackTableRow[]>(() => {
    return records.map((record, index) => ({
      key: `${record.deviceId}-${record.channel}-${record.begintime}-${index}`,
      no: index + 1,
      beginTime: formatRecordTime(record.begintime),
      endTime: formatRecordTime(record.endtime),
      channel: `CH${record.channel}`,
      record,
    }));
  }, [records]);

  const channelFilters = useMemo(() => {
    const unique = Array.from(new Set(tableData.map((r) => r.channel)));
    const defaults = ["CH1", "CH2"];
    const all = Array.from(new Set([...unique, ...defaults]));
    return all.map((ch) => ({ text: ch, value: ch }));
  }, [tableData]);

  const fetchRecordsByDate = async (selected: string) => {
    setSelectedRecord(null);
    setPlaybackUrl("");

    if (isDeviceOffline) {
      setRecords([]);
      message.warning("Device is Offline");
      return;
    }

    if (!selected || !deviceId) {
      setRecords([]);
      return;
    }

    try {
      const liveStatus = await getSingleVehicleStatus(deviceId);
      const isOfflineByLiveStatus = liveStatus ? !liveStatus.isOnline : false;

      if (isOfflineByLiveStatus || isDeviceOffline) {
        setRecords([]);
        message.warning("Device is Offline");
        return;
      }

      const startTime = `${selected} 00:00:00`;
      const endTime = `${selected} 23:59:59`;

      const response = await devRecordQuery({
        startTime,
        endTime,
        queryType: 1,
        queryParam: deviceId,
        channelNo: 0,
      }).unwrap();

      const list = response?.data?.listFile || [];
      setRecords(list);

      if (list.length === 0) {
        message.info("No recordings found for selected date.");
      }
    } catch (error) {
      setRecords([]);
      message.error("Failed to fetch recordings.");
    }
  };

  useEffect(() => {
    setSelectedDate(null);
    setSelectedDateDeviceId(null);
    setRecords([]);
    setSelectedRecord(null);
    setPlaybackUrl("");
  }, [deviceId]);

  useEffect(() => {
    if (isDeviceOffline) {
      setRecords([]);
      setSelectedRecord(null);
      setPlaybackUrl("");
      return;
    }

    if (selectedDate && selectedDateDeviceId === deviceId) {
      fetchRecordsByDate(selectedDate);
      return;
    }

    setRecords([]);
    setSelectedRecord(null);
    setPlaybackUrl("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedDateDeviceId, deviceId, isDeviceOffline]);

  const handlePlayRecord = (record: DevRecordQueryFileItem) => {
    setSelectedRecord(record);
    setPlaybackUrl(buildPlaybackUrl(record));
  };

  const columns: ColumnsType<PlaybackTableRow> = [
    {
      title: "No.",
      dataIndex: "no",
      key: "no",
      width: 48,
    },
    {
      title: "Start",
      dataIndex: "beginTime",
      key: "beginTime",
      width: 100,
      render: (value: string) => {
        const [datePart, timePart] = value.split(" ");
        return (
          <div className="leading-tight">
            <div className="whitespace-nowrap">{datePart || value}</div>
            {timePart ? (
              <div className="whitespace-nowrap text-xs text-gray-500">
                {timePart}
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "End",
      dataIndex: "endTime",
      key: "endTime",
      width: 100,
      render: (value: string) => {
        const [datePart, timePart] = value.split(" ");
        return (
          <div className="leading-tight">
            <div className="whitespace-nowrap">{datePart || value}</div>
            {timePart ? (
              <div className="whitespace-nowrap text-xs text-gray-500">
                {timePart}
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "Channel",
      dataIndex: "channel",
      key: "channel",
      width: 96,
      filters: channelFilters,
      filterMultiple: false,
      onFilter: (value, record) => record.channel === value,
    },
    {
      title: "Play",
      key: "play",
      width: 56,
      align: "center",
      render: (_, row) => {
        const isPlaying =
          selectedRecord?.deviceId === row.record.deviceId &&
          selectedRecord?.channel === row.record.channel &&
          selectedRecord?.begintime === row.record.begintime &&
          selectedRecord?.endtime === row.record.endtime;

        return (
          <button
            type="button"
            onClick={() => handlePlayRecord(row.record)}
            className={`transition-colors ${
              isPlaying
                ? "text-primary-green"
                : "text-gray-700 hover:text-primary-green"
            }`}
            title="Play"
          >
            <PlayCircleFilled className="text-2xl" />
          </button>
        );
      },
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden space-y-3">
      <div className="grid grid-cols-7 gap-5 pb-1">
        {weekDates.map((date) => {
          const dateValue = date.format("YYYY-MM-DD");
          const isSelected = selectedDate === dateValue;

          return (
            <button
              key={dateValue}
              type="button"
              onClick={() => {
                if (isDeviceOffline) {
                  setSelectedDate(null);
                  setSelectedDateDeviceId(null);
                  setRecords([]);
                  message.warning("Device is Offline");
                  return;
                }

                setSelectedDate(dateValue);
                setSelectedDateDeviceId(deviceId);
              }}
              className={`w-full h-[55px] rounded-[10px] border flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isSelected
                  ? "bg-[#47b495] border-[#47b495] text-white"
                  : "bg-[#f3f3f3] border-[#c8c8c8] text-[#7a7a7a] hover:bg-[#ededed]"
              }`}
            >
              <span className="text-[8px] leading-3 uppercase font-medium">
                {date.format("ddd")}
              </span>
              <span className="text-[18px] leading-[22px] font-medium">
                {date.format("D")}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 pr-1 overflow-y-auto overflow-x-hidden space-y-3 scrollbar-thumb-thumb-green scrollbar-w-1  scrollbar-thumb-rounded-md scrollbar">
        <div className="aspect-video relative rounded-lg overflow-hidden border bg-black mb-2">
          {selectedRecord && playbackUrl ? (
            <iframe
              src={playbackUrl}
              className="w-full h-full"
              allowFullScreen
              title="BSJ Video Playback"
            />
          ) : (
            <div className="w-full h-full relative">
              <div className="absolute inset-0 bg-gray-200">
                <Image
                  src={BlurBg}
                  alt="Playback Placeholder"
                  fill
                  className="object-cover blur-lg"
                />
              </div>
              <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center gap-2 text-white">
                <PlayCircleOutlined className="text-5xl opacity-90 cursor-pointer" />
              </div>
            </div>
          )}
        </div>

        <div className="min-h-0 overflow-x-hidden">
          <Table
            rowKey="key"
            size="small"
            tableLayout="fixed"
            className="compact-records-table"
            getPopupContainer={(triggerNode) => document.body}
            loading={isLoading}
            columns={columns}
            dataSource={tableData}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
            }}
            locale={{
              emptyText: selectedDate
                ? "No recordings found for selected date"
                : "Select a date to see recordings",
            }}
          />
        </div>
      </div>

      <style jsx global>{`
        .compact-records-table .ant-table-thead > tr > th,
        .compact-records-table .ant-table-tbody > tr > td {
          padding-left: 6px !important;
          padding-right: 6px !important;
        }

        .compact-records-table .ant-table-thead > tr > th {
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};

export default VideoPlayback;
