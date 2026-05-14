import axios from "axios";
import { AppDispatch } from "../_globalRedux/store";
import { setIsApmTotalKmLoading } from "../_globalRedux/dashboard/isApmTotalKmLoading";

export const apmTotalKm = async ({
  startDate,
  endDate,
  userId,
  vehicleId,
  parentUser,
  dispatch,
}: {
  startDate: string;
  endDate: string;
  userId: number;
  parentUser: number;
  vehicleId: number;
  dispatch: AppDispatch;
}) => {
  if ((userId === 4607 || parentUser === 4607) && vehicleId !== 0) {
    dispatch(setIsApmTotalKmLoading(true));
    try {
      const { data } = await axios.get(
        `https://gtrac.in/newtracking/reports/apmkm.php?vid=${vehicleId}&startdate=${startDate}&enddate=${endDate}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      dispatch(setIsApmTotalKmLoading(false));
      return `${data.km.toFixed(2)}`;
    } catch (e) {
      dispatch(setIsApmTotalKmLoading(false));
      return "";
    }
  } else {
    return "";
  }
};
