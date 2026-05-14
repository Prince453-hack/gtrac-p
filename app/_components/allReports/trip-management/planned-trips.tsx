import React from "react";
import { TripList } from "./index";
import { ViewContext } from "./tripReportAndPlanningToggle";
import { useGetPlannedVehiclesQuery } from "@/app/_globalRedux/services/trackingDashboard";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import moment from "moment";
import CustomTableN, { DownloadReportTs } from "../../common/CustomTableN";
import { getTripsColumns } from "./getTripsColumns";
import { VehicleAllocationReportModal } from "../vehicle-allocation-report/vehicle-allocation-report-modal";

export const PlannedTrips = () => {
  const { groupId, userId } = useSelector((state: RootState) => state.auth);

  const tripParams = {
    userId,
    token: groupId,
    startDate: moment()
      .subtract(15, "days")
      .startOf("date")
      .format("YYYY-MM-DD HH:mm"),
    endDate: moment().format("YYYY-MM-DD HH:mm"),
    tripStatus: "On Trip",
    tripStatusBatch: "On Trip",
  };

  const { isLoading: isPlannedTripLoading, data: plannedTripData } =
    useGetPlannedVehiclesQuery(tripParams, {
      skip: !groupId || !userId,
    });

  const activeView = React.useContext(ViewContext);
  const [downloadReport, setDownloadReport] = React.useState<
    DownloadReportTs | undefined
  >(undefined);
  const [selectedData, setSelectedData] = React.useState<any>(null);

  return (
    <div className="flex flex-col gap-4 py-4 w-full font-proxima text-xs">
      <VehicleAllocationReportModal
        selectedData={selectedData}
        setSelectedData={setSelectedData}
      />
      {activeView === "TABLE" ? (
        <CustomTableN
          columns={getTripsColumns({
            data: plannedTripData ? plannedTripData : undefined,
            userId,
            setSelectedData,
          })}
          data={
            plannedTripData &&
            plannedTripData.list &&
            plannedTripData.list.length > 0
              ? plannedTripData.list
              : []
          }
          loading={isPlannedTripLoading}
          onDownloadBtnClick={() => {}}
          lazyLoad
          downloadReport={undefined}
          setDownloadReport={setDownloadReport}
          width="200%"
          height="max-h-[60vh]"
          fontSize="12px"
        />
      ) : (
        <TripList
          type="planning"
          tripData={plannedTripData?.list}
          isLoading={isPlannedTripLoading}
        />
      )}
    </div>
  );
};
