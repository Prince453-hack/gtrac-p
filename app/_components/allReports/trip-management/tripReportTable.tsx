import React, { useState } from "react";
import CustomTableN, { DownloadReportTs } from "../../common/CustomTableN";
import { downloadTripReport, getTripsColumns2 } from "./getTripColumns2";
import { downloadTripReport as downloadTripUnique } from "./getTripsColumns";
import { VehicleAllocationReportModal } from "../vehicle-allocation-report/vehicle-allocation-report-modal";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import { Button, DatePicker, Input, Modal } from "antd";
import dayjs from "dayjs";
import { useLazyAddTripEndQuery } from "@/app/_globalRedux/services/gtrac_newtracking";
import { getTripsColumns } from "./getTripsColumns";
import { isSinghTransportAccount } from "@/app/helpers/isSinghTransport";

export const TripReportTable = ({
  isLoading,
  tripHistory,
  refetch,
  isTripHistory = false,
}: {
  isLoading: boolean;
  tripHistory: getTripVehiclesResponse | undefined;
  refetch: any;
  isTripHistory?: boolean;
}) => {
  const {
    userId,
    groupId,
    parentUser: puserId,
    extra,
    userName,
  } = useSelector((state: RootState) => state.auth);
  const [addTripEnd] = useLazyAddTripEndQuery();

  const [tripEndModal, setTripEndModal] = React.useState<
    PlannedTrips | undefined
  >();

  const [tripEnddate, seTripEndtDate] = useState<undefined | dayjs.Dayjs>(
    undefined,
  );
  const [tripEndRemark, setTripEndRemark] = useState<string>("");

  const [downloadReport, setDownloadReport] = React.useState<
    DownloadReportTs | undefined
  >(undefined);
  const [selectectedData, setSelectedData] = useState<any>(null);

  return (
    <div className="flex flex-col gap-4 pb-4 w-full font-proxima text-xs">
      <VehicleAllocationReportModal
        selectedData={selectectedData}
        setSelectedData={setSelectedData}
      />
      <CustomTableN
        columns={
          isSinghTransportAccount(userId) ||
          Number(userId) === 87259 ||
          Number(puserId) === 87259 ||
          Number(userId) === 80933
            ? getTripsColumns({
                data: tripHistory ? tripHistory : undefined,
                userId,
                setTripEndModal,
                isTripHistory,
                setSelectedData,
              })
            : getTripsColumns2({
                data: tripHistory ? tripHistory : undefined,
                setSelectedData,
                userId,
                setTripEndModal,
              })
        }
        data={
          tripHistory && tripHistory.list && tripHistory.list.length > 0
            ? tripHistory.list
            : []
        }
        loading={isLoading}
        onDownloadBtnClick={() => {
          isSinghTransportAccount(userId) ||
          Number(userId) === 87259 ||
          Number(puserId) === 87259 ||
          Number(userId) === 80933
            ? downloadTripUnique({
                data: tripHistory,
                setDownloadReport,
                userId,
              })
            : downloadTripReport({ data: tripHistory, setDownloadReport });
        }}
        downloadReport={downloadReport}
        setDownloadReport={setDownloadReport}
        height="max-h-[66vh]"
        fontSize="12px"
      />

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
