"use client";

import React, { useState } from "react";
import { ViewContext } from "./tripReportAndPlanningToggle";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import CustomTableN, { DownloadReportTs } from "../../common/CustomTableN";
import { downloadTripReport, getTripsColumns } from "./getTripsColumns";
import { TripList } from "./trip-list";
import { useLazyAddTripEndQuery } from "@/app/_globalRedux/services/gtrac_newtracking";
import { Button, DatePicker, Input, Modal } from "antd";
import dayjs from "dayjs";
import { isSinghTransportAccount } from "@/app/helpers/isSinghTransport";
import { VehicleAllocationReportModal } from "../vehicle-allocation-report/vehicle-allocation-report-modal";

export const Trips = ({
  tripHistory,
  isTripLoading,
  refetch,
}: {
  tripHistory: getTripVehiclesResponse | undefined;
  isTripLoading: boolean;
  refetch: any;
}) => {
  const {
    groupId,
    userId,
    extra,
    parentUser: puserId,
    userName,
  } = useSelector((state: RootState) => state.auth);
  const [addTripEnd] = useLazyAddTripEndQuery();
  const [tripEndModal, setTripEndModal] = React.useState<
    PlannedTrips | undefined
  >();

  const [downloadReport, setDownloadReport] = React.useState<
    DownloadReportTs | undefined
  >(undefined);
  const [selectedData, setSelectedData] = useState<any>(null);

  const activeView = React.useContext(ViewContext);

  const [tripEnddate, seTripEndtDate] = useState<undefined | dayjs.Dayjs>(
    undefined,
  );
  const [tripEndRemark, setTripEndRemark] = useState<string>("");

  return (
    <div className="flex flex-col gap-4 py-4 w-full font-proxima text-xs">
      <VehicleAllocationReportModal
        selectedData={selectedData}
        setSelectedData={setSelectedData}
      />
      {activeView === "TABLE" ? (
        <CustomTableN
          columns={getTripsColumns({
            data: tripHistory ? tripHistory : undefined,
            userId,
            setTripEndModal,
            setSelectedData,
          })}
          data={
            tripHistory && tripHistory.list && tripHistory.list.length > 0
              ? tripHistory.list
              : []
          }
          loading={isTripLoading}
          onDownloadBtnClick={() => {
            downloadTripReport({
              data: tripHistory,
              setDownloadReport,
              userId,
            });
          }}
          downloadReport={downloadReport}
          setDownloadReport={setDownloadReport}
          width={
            isSinghTransportAccount(userId) || Number(userId) === 80933
              ? "100%"
              : "200%"
          }
          lazyLoad
          height="max-h-[60vh]"
          fontSize="12px"
        />
      ) : (
        <TripList
          type="planning"
          tripData={tripHistory?.list}
          isLoading={isTripLoading}
        />
      )}

      <Modal
        open={tripEndModal?.trip_id ? true : false}
        onCancel={() => setTripEndModal(undefined)}
        footer={null}
        title={`End Trip: (${tripEndModal?.trip_id})`}
      >
        <div className="flex flex-col gap-4">
          <DatePicker
            format="Do MMMM, YYYY HH:mm"
            size="large"
            showTime
            value={tripEnddate}
            onChange={(e) => seTripEndtDate(e)}
          />
          <Input
            placeholder="Remark"
            value={tripEndRemark}
            onChange={(e) => setTripEndRemark(e.target.value)}
            className="h-10"
          />

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setTripEndModal(undefined);
                seTripEndtDate(undefined);
                setTripEndRemark("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={() => {
                if (
                  !tripEnddate ||
                  !tripEndRemark ||
                  tripEndModal === undefined
                )
                  return;
                addTripEnd({
                  tripEndId: `${tripEndModal.trip_id}`,
                  tripEndDate: tripEnddate.format("YYYY-MM-DD HH:mm"),
                  tripEndGroupId: `${tripEndModal.sys_service_id}`,
                  tripEndLorryNo: `${tripEndModal.lorry_no}`,
                  tripEndRemark: tripEndRemark,
                  userId,
                  token: groupId,
                  puserId,
                  extra,
                  username: userName,
                }).then(() => refetch());

                setTripEndModal(undefined);
                seTripEndtDate(undefined);
                setTripEndRemark("");
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
