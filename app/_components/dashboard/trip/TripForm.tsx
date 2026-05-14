"use client";

import { RootState } from "@/app/_globalRedux/store";
import {
  ClearOutlined,
  CloseOutlined,
  MinusCircleFilled,
  PlusCircleFilled,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Checkbox,
  ConfigProvider,
  DatePicker,
  Form,
  Input,
  message,
  Radio,
  Select,
  Tooltip,
} from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

// * trip specific
import { setCreateTripOrTripPlanningActive } from "@/app/_globalRedux/dashboard/createTripOrTripPlanningActive";
import {
  setIsMapActive,
  setIsMapNotLoading,
} from "@/app/_globalRedux/dashboard/mapSlice";
import { setAllMarkers } from "@/app/_globalRedux/dashboard/markersSlice";
import {
  initialSelectedVehicleState,
  setSelectedVehicleBySelectElement,
} from "@/app/_globalRedux/dashboard/selectedVehicleSlice";
import { useAppDispatch } from "@/app/_globalRedux/provider";
import {
  useGetDriverListQuery,
  useGetPartyListQuery,
  useGetPoiListQuery,
} from "@/app/_globalRedux/services/masterData";
import {
  useCreateTripFormMutation,
  useGetTripVehiclesQuery,
  useGetVehiclesByStatusQuery,
  usePlanTripFormMutation,
} from "@/app/_globalRedux/services/trackingDashboard";
import { getJourneyHours, getLatLong } from "@/app/helpers/api";
import { checkLatLngExists } from "@/app/helpers/checkIfLatLngExists";
import { getDateRange } from "@/app/helpers/getDateRange";
import getGoogleApiKey from "@/app/helpers/getGoogleMapKeys";
import { isSinghTransportAccount } from "@/app/helpers/isSinghTransport";
import dayjs from "dayjs";
import moment from "moment";
import ReactGoogleAutocomplete from "react-google-autocomplete";
import { CsvUploader } from "../../common/csvUploader";
import { AllVehiclesSelect } from "../AllVehiclesSelect";
import AdditionalFieldsModal from "./additionalFIeldsModal";
import { setFieldsFromCsv } from "./helpers/setFieldsFromCsv";

const selectedStyles = {
  selectorBg: "transparent",
  colorBorder: "transparent",
  fontSize: 19,
  fontWeight: 600,
  optionFontSize: 14,
  optionPadding: "5px",
  optionSelectedColor: "#000",
};

export const TripForm = () => {
  const collapseVehicleStatusToggle = useSelector(
    (state: RootState) => state.collapseTripStatusToggle,
  );
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle,
  );
  const { groupId, userId, extra, userName } = useSelector(
    (state: RootState) => state.auth,
  );
  const { type: createTripOrPlanningTripType } = useSelector(
    (state: RootState) => state.createTripOrPlanningTripActive,
  );
  const { isMapActive } = useSelector((state: RootState) => state.map);
  const markers = useSelector((state: RootState) => state.markers);
  const dispatch = useAppDispatch();

  const isVehicleNotWorkingForMoreThan24Hours = () => {
    if (selectedVehicle.vId === 0) return false;
    if (selectedVehicle.gpsDtl?.mode !== "NOT WORKING") return false;

    const modeTime = selectedVehicle.gpsDtl?.modeTime || "";
    if (!modeTime) return false;

    // Extract hours from strings like "337 hrs:31 min"
    const hoursMatch = modeTime.match(/(\d+)\s*hrs/i);
    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1], 10);
      return hours > 24;
    }

    return false;
  };

  // Fetch vehicle data using existing mob API to get current status
  const { data: vehiclesData } = useGetVehiclesByStatusQuery(
    {
      token: groupId || "",
      userId: userId || "",
      pUserId: userId || "",
      mode: "",
    },
    {
      skip: !groupId || !userId || selectedVehicle.vId === 0,
      pollingInterval: 30000, // Refresh every 30 seconds
    },
  );

  // Fetch trip vehicles data to check if vehicle is on trip
  const dateRange = getDateRange();
  const { data: tripVehiclesData } = useGetTripVehiclesQuery(
    {
      token: groupId || "",
      userId: userId || "",
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      tripStatus: "On Trip",
      tripStatusBatch: "On Trip",
    },
    {
      skip: !groupId || !userId || selectedVehicle.vId === 0,
      pollingInterval: 30000, // Refresh every 30 seconds
    },
  );

  const isVehicleOnTrip = () => {
    if (selectedVehicle.vId === 0) return false;
    if (!tripVehiclesData?.list) return false;

    const vehicleOnTrip = tripVehiclesData.list.find(
      (trip) => trip.sys_service_id === selectedVehicle.vId,
    );

    return !!vehicleOnTrip;
  };

  // Update selected vehicle with current GPS data when API data changes
  useEffect(() => {
    if (vehiclesData?.list && selectedVehicle.vId !== 0) {
      const currentVehicleData = vehiclesData.list.find(
        (vehicle: any) => vehicle.vId === selectedVehicle.vId,
      );

      if (currentVehicleData && currentVehicleData.gpsDtl) {
        // Update Redux with fresh vehicle data
        dispatch(
          setSelectedVehicleBySelectElement({
            ...selectedVehicle,
            gpsDtl: currentVehicleData.gpsDtl,
          }),
        );
      }
    }
  }, [vehiclesData, selectedVehicle.vId, dispatch]);

  const [form] = Form.useForm();
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);

  const { data: poiListData, isLoading: isPoiListLoading } = useGetPoiListQuery(
    {
      groupId,
      userId,
    },
    {
      skip: !groupId || !userId,
    },
  );

  const [sourceAndDestinationOptions, setSourceAndDestinationOptions] =
    useState<{ id: number; value: string }[]>([]);

  useEffect(() => {
    if (poiListData && poiListData.data.length > 1) {
      let tempSourceAndDestinationOptions: { id: number; value: string }[] = [];
      poiListData.data.forEach((poi) =>
        tempSourceAndDestinationOptions.push({ id: poi.id, value: poi.name }),
      );
      setSourceAndDestinationOptions(tempSourceAndDestinationOptions);
    }
  }, [poiListData]);

  useEffect(() => {
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
    }
  }, [selectedVehicle, collapseVehicleStatusToggle]);

  // * route type
  const routeOptions = ["None", "Express", "Normal", "Fix Hours"];
  const [selectedRouteType, setSelectedRouteType] = useState<
    "None" | "Express" | "Normal" | "Fix Hours"
  >("None");

  //  trip type
  const [selectedTripType, setSelectedTripType] = useState<"Dynamic" | "Fixed">(
    "Dynamic",
  );

  // * journey data start
  const [visibleDetailsStyling, setVisibleDetailsStyling] = useState("");
  const [viaCounter, setViaCounter] = useState(0);

  // * via states
  const [isCurrentViaAuto, setIsCurrentViaAuto] = useState([
    false,
    false,
    false,
    false,
  ]);
  const [currentViaValue, setCurrentViaValue] = useState(["", "", "", ""]);
  const [viaArray, setViaArray] = useState<number[]>([]);
  const [viaHaltHrs, setViaHaltHrs] = useState<number[]>([0, 0, 0, 0]);

  // * source and destination states
  const [isDestinationAuto, setIsDestinationAuto] = useState(false);
  const [destinationValue, setDestinationValue] = useState("");

  const [isSourceAuto, setIsSourceAuto] = useState(false);
  const [sourceValue, setSourceValue] = useState<string>("");

  // date picker
  const [date, setDate] = useState<dayjs.Dayjs | undefined>(undefined);

  // additional info
  const auth = JSON.parse(localStorage.getItem("auth-session") || "");
  const extraInfo = auth.extraInfo
    ? JSON.parse(auth.extraInfo || "")
    : ([] as string[]);
  const [extraInfoData, setExtraInfoData] = useState<any>(
    extraInfo.reduce(
      (acc: Record<string, string>, curr: string) => ({ ...acc, [curr]: "" }),
      {},
    ),
  );
  const [isAdditionalInfoModalActive, setIsAdditionalInfoModalActive] =
    useState(false);

  const { data: driverListData, isLoading: isDriverListLoading } =
    useGetDriverListQuery({ token: groupId }, { skip: !groupId });
  const { data: partyListData, isLoading: isPartyListLoading } =
    useGetPartyListQuery({ token: groupId }, { skip: !groupId });

  const [eta, setEta] = useState("");

  useEffect(() => {
    let tempArray = new Array(viaCounter).fill(0) as number[];
    setViaArray(tempArray);
  }, [viaCounter]);

  const [
    createTrip,
    {
      isLoading: isCreateTripLoading,
      isError: isCreateTripError,
      error: createTripError,
    },
  ] = useCreateTripFormMutation();
  const [planTrip, { isLoading: isPlanTripLoading, isError: isPlanTripError }] =
    usePlanTripFormMutation();
  const [createTripErrorState, setCreateTripErrorState] = useState("");
  const [isManualDriverListSelected, setIsManualDriverListSelected] =
    useState(false);
  const [driverListOptions, setDriverListOptions] = useState<
    { id: number; value: string }[]
  >([]);

  const [isManualPartyListSelected, setIsManualPartyListSelected] =
    useState(false);
  const [
    isManualDestinationPartyListSelected,
    setManualDestinationPartyListSelected,
  ] = useState(false);
  const [partyListOptions, setPartyListOptions] = useState<
    { id: number; value: string }[]
  >([]);

  useEffect(() => {
    let tempError = createTripError as any;
    setCreateTripErrorState(tempError);
  }, [createTripError]);

  useEffect(() => {
    if (driverListData && isDriverListLoading === false) {
      const driverListOptionsTemp = driverListData?.list?.map((driver) => ({
        id: driver.id,
        value: driver.driver_name,
      }));
      setDriverListOptions(driverListOptionsTemp);
    }
  }, [driverListData, isDriverListLoading]);

  useEffect(() => {
    if (partyListData && isPartyListLoading === false) {
      const partyListOptionsTemp = partyListData?.list?.map((party) => ({
        id: party.id,
        value: party.name,
      }));
      setPartyListOptions(partyListOptionsTemp);
    }
  }, [partyListData, isPartyListLoading]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  const success = ({ tripType }: { tripType: string }) => {
    messageApi.open({
      type: "success",
      content: `Successfully ${tripType} trip`,
      duration: 10,
    });
  };

  const error = ({ tripType }: { tripType: string }) => {
    messageApi.open({
      type: "error",
      content: `Failed to ${tripType} trip`,
      duration: 10,
    });
  };

  const triggerMapActive = () => {
    if (!isMapActive) {
      dispatch(setIsMapNotLoading(false));
      dispatch(setIsMapActive(true));
    }
  };

  const getAddressLatLong = async (address: string) => {
    const isLatLongExists = checkLatLngExists(address);

    if (isLatLongExists) return address;

    let tempAdd = "";

    try {
      const data = await getLatLong({
        userId: userId,
        groupId: groupId,
        address,
      });
      tempAdd = `${address}${data}`;
    } catch (err) {}

    return tempAdd;
  };

  useEffect(() => {
    triggerMapActive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDestinationAuto, isCurrentViaAuto, isSourceAuto]);

  const [customerName, setCustomerName] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverNumber, setDriverNumber] = useState("");

  const resetFields = () => {
    setIsSubmitting(false);
    setCreateTripErrorState("");
    form.resetFields();
    setSelectedRouteType("None");

    // Reset new state variables
    setCustomerName("");
    setDriverName("");
    setDriverNumber("");

    // * journey data start
    setViaCounter(0);

    // * via states
    setIsCurrentViaAuto([false, false, false, false]);
    setCurrentViaValue(["", "", "", ""]);
    setViaArray([]);
    setViaHaltHrs([0, 0, 0, 0]);

    // * source and destination states
    setIsDestinationAuto(false);
    setDestinationValue("");
    setIsSourceAuto(false);
    setSourceValue("");
  };

  const getJourneyHoursHandler = async (e: any, isExcel: boolean) => {
    await getJourneyHours({
      userId: Number(userId),
      source: sourceValue?.split("##")[0],
      destination: destinationValue.split("##")[0],
      via: viaCounter > 0 && currentViaValue[0] ? true : false,
      viaOne: currentViaValue[0] ? currentViaValue[0].split("##")[0] : "",
      viaTwo: currentViaValue[1] ? currentViaValue[1].split("##")[0] : "",
      viaThree: currentViaValue[2] ? currentViaValue[2].split("##")[0] : "",
      viaFour: currentViaValue[3] ? currentViaValue[3].split("##")[0] : "",
      routeType: isExcel ? e : e.target.value,
      viaOneHaltHr: `${viaHaltHrs[0]}` || "",
      viaTwoHaltHr: `${viaHaltHrs[1]}` || "",
      viaThreeHaltHr: `${viaHaltHrs[2]}` || "",
      viaFourHaltHr: `${viaHaltHrs[3]}` || "",
      groupId: groupId,
      extra: extra,
    })
      .then((res) => {
        if (res) {
          let tempResultAsArray = res.split("##");
          let adjustedArray: string[] = tempResultAsArray.map(
            (part: string) => {
              let adjustedString = part.match(/\d+(?:\.\d+)?/);
              return adjustedString ? `${adjustedString[0]}` : "0";
            },
          );
          const selectedStartDateInMilliseconds = date?.toDate()
            ? date.toDate().getTime()
            : new Date().getTime();
          const estimateHoursInMilliseconds =
            Number(adjustedArray[1]) * 60 * 60 * 1000;
          const tempEta = new Date(
            selectedStartDateInMilliseconds + estimateHoursInMilliseconds,
          );

          setEta(moment(tempEta).format("YYYY-MM-DD HH:mm:ss"));

          form.setFieldValue("journey_hrs", adjustedArray[1]);
          form.setFieldValue("journey_km", adjustedArray[0]);
        }
      })
      .catch((err) => {
        let result = err as any;
      });
  };

  // * form submit
  const onFinish = async () => {
    try {
      // Check if vehicle is not working for more than 24 hours
      if (isVehicleNotWorkingForMoreThan24Hours()) {
        messageApi.open({
          type: "error",
          content: "Cannot create trip for Not Working Vehicles.",
          duration: 5,
        });
        return;
      }

      // Check if vehicle is on trip
      if (isVehicleOnTrip()) {
        messageApi.open({
          type: "error",
          content: "Cannot create trip. Vehicle is already on an active trip.",
          duration: 5,
        });
        return;
      }

      await form.validateFields();
      setIsSubmitting(true);

      const formValues = form.getFieldsValue();

      const formSubmitObj = {
        CustomerName: customerName,
        Destination: !isDestinationAuto
          ? await getAddressLatLong(destinationValue)
          : "",
        DestinationOr: isDestinationAuto
          ? await getAddressLatLong(destinationValue)
          : "",
        DriverName: driverName,
        ETA: eta,
        RouteType: formValues.selectedRouteType,
        Source: !isSourceAuto ? await getAddressLatLong(sourceValue) : "",
        SourceOr: isSourceAuto ? await getAddressLatLong(sourceValue) : "",
        Via1: !isCurrentViaAuto[0]
          ? await getAddressLatLong(currentViaValue[0])
          : "",
        Via2: !isCurrentViaAuto[1]
          ? await getAddressLatLong(currentViaValue[1])
          : "",
        Via3: !isCurrentViaAuto[2]
          ? await getAddressLatLong(currentViaValue[2])
          : "",
        Via4: !isCurrentViaAuto[3]
          ? await getAddressLatLong(currentViaValue[3])
          : "",
        Via1Or: isCurrentViaAuto[0]
          ? await getAddressLatLong(currentViaValue[0])
          : "",
        Via2Or: isCurrentViaAuto[1]
          ? await getAddressLatLong(currentViaValue[1])
          : "",
        Via3Or: isCurrentViaAuto[2]
          ? await getAddressLatLong(currentViaValue[2])
          : "",
        Via4Or: isCurrentViaAuto[3]
          ? await getAddressLatLong(currentViaValue[3])
          : "",
        temp_range_to: formValues.temp_range_to || "",
        temp_range_from: formValues.temp_range_from || "",
        cargo_weight: formValues.weight || "",
        challan_date: `${date?.format("YYYY-MM-DD HH:mm")}`,
        challan_no: Math.floor(Math.random() * 100000).toString(),
        destination_party_name: formValues.destination_party_name || "",
        journey_KM: formValues.journey_km || "",
        journey_hours: formValues.journey_hrs || "",
        lorry_no: selectedVehicle.vehicleTrip.lorry_no
          ? selectedVehicle.vehicleTrip.lorry_no
          : selectedVehicle.vehReg,
        lorry_type:
          (isSinghTransportAccount(userId)
            ? formValues.lr_number
            : formValues.trip_type) ?? "",
        sys_service_id: selectedVehicle.vId
          ? `${selectedVehicle.vId}`
          : `${selectedVehicle.vehicleTrip.sys_service_id}`,
        sys_user_id: userId,
        to_and_fro: selectedTripType === "Fixed" ? "1" : "0",
        viaone_halthr_input: formValues.via?.via1
          ? formValues.via.via1.halt
          : "",
        viaone_party_name: formValues.via?.via1
          ? formValues.via.via1.party_name
          : "",
        viatwo_halthr_input: formValues.via?.via2
          ? formValues.via.via2.halt
          : "",
        viatwo_party_name: formValues.via?.via2
          ? formValues.via.via2.party_name
          : "",
        viathree_halthr_input: formValues.via?.via3
          ? formValues.via.via3.halt
          : "",
        viathree_party_name: formValues.via?.via3
          ? formValues.via.via3.party_name
          : "",
        viafour_halthr_input: formValues.via?.via4
          ? formValues.via.via4.halt
          : "",
        viafour_party_name: formValues.via?.via4
          ? formValues.via.via4.party_name
          : "",
        createdBy: formValues.created_by ? formValues.created_by : userName,
      };

      if (createTripOrPlanningTripType === "create-trip") {
        const data = await createTrip({
          body: { ...formSubmitObj, extraInfo: JSON.stringify(extraInfoData) },
          token: groupId,
        });

        if (data.error) {
          error({ tripType: "Create" });
        } else {
          success({ tripType: "Create" });
        }
        setIsSubmitting(false);
      } else {
        const data = await planTrip({ body: formSubmitObj, token: groupId });

        if (data.error) {
          error({ tripType: "Planned" });
        } else {
          success({ tripType: "Planned" });
        }
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error in onFinish:", error);
      setIsSubmitting(false);
      setCreateTripErrorState("An error occurred. Please try again later.");
    }
  };

  useEffect(() => {
    if (isPlanTripLoading || isCreateTripLoading) {
      setIsSubmitting(true);
      setCreateTripErrorState("");
    }

    if (
      isPlanTripError ||
      (isCreateTripError && !isPlanTripLoading && !isCreateTripLoading)
    ) {
      let tempErrorState = createTripError as any;

      setCreateTripErrorState(
        tempErrorState?.data?.message ||
          "Please complete the form and enter valid inputs.",
      );
      setIsSubmitting(false);
    }
  }, [
    isPlanTripLoading,
    isCreateTripLoading,
    createTripError,
    isCreateTripError,
    isPlanTripError,
  ]);

  useEffect(() => {
    resetFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (csvData.length > 0) {
      const data = csvData[0];
      setCustomerName(data.CustomerName || "");
      setDriverName(data.DriverName || "");

      setFieldsFromCsv({
        data,
        form,
        setIsSourceAuto,
        setIsDestinationAuto,
        setViaCounter,
        setIsCurrentViaAuto,
        setCurrentViaValue,
        setViaHaltHrs,
        setDestinationValue,
        setSourceValue,
        setSelectedTripType,
        setSelectedRouteType,
        setDate,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [csvData]);

  useEffect(() => {
    if (!isAdditionalInfoModalActive && extraInfo && extraInfo.length > 0) {
      setExtraInfoData(
        extraInfo.reduce(
          (acc: Record<string, string>, crr: string) =>
            Object.assign(acc, { [crr]: "" }),
          {},
        ),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdditionalInfoModalActive]);

  useEffect(() => {
    getJourneyHoursHandler(selectedRouteType, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRouteType]);

  return (
    <div
      className={`ml-2 absolute py-[22px] z-20 ${visibleDetailsStyling} min-w-[450px] w-[450px] bg-white h-[calc(100vh-60px)] transition-transform duration-300`}
    >
      {contextHolder}
      <AdditionalFieldsModal
        isModalActive={isAdditionalInfoModalActive}
        setIsModalActive={setIsAdditionalInfoModalActive}
      />
      <div className="flex items-center justify-between px-5 mb-4">
        <div className="flex gap-2 items-center ml-1">
          <p className="text-primary-green font-semibold ">
            {createTripOrPlanningTripType === "create-trip"
              ? "Create Trip Form"
              : "Trip Planning Form"}
          </p>
          <div className="flex items-center">
            <Tooltip title="Upload Trip Data" mouseEnterDelay={1}>
              <CsvUploader setCsvData={setCsvData} />
            </Tooltip>
            <Tooltip title="Reset Fields" mouseEnterDelay={1}>
              <div
                onClick={() => resetFields()}
                className="text-xl text-primary-green cursor-pointer hover:bg-neutral-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors duration-300"
              >
                <ClearOutlined />
              </div>
            </Tooltip>

            <Tooltip title="Customize Additional Fields" mouseEnterDelay={1}>
              <div
                onClick={() => setIsAdditionalInfoModalActive(true)}
                className="text-xl text-primary-green cursor-pointer hover:bg-neutral-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors duration-300"
              >
                <PlusOutlined />
              </div>
            </Tooltip>
          </div>
        </div>
        <Tooltip title="Close" placement="right" mouseEnterDelay={1}>
          <div
            className="pr-1"
            onClick={() => {
              dispatch(
                setSelectedVehicleBySelectElement(initialSelectedVehicleState),
              );
              dispatch(setCreateTripOrTripPlanningActive({ type: "" }));
              // dispatch(setHistoryReplayModeToggle(false));
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
            }}
          >
            <CloseOutlined className="cursor-pointer" />
          </div>
        </Tooltip>
      </div>

      <div className="overflow-y-scroll max-h-[calc(100vh-140px)] scrollbar-thumb-thumb-green scrollbar-w-2 scrollbar-thumb-rounded-md scrollbar pb-10">
        <ConfigProvider
          theme={{
            components: {
              Input: {
                colorBgContainerDisabled: "rgb(255,255,255)",
                colorTextDisabled: "rgb(0,0,0)",
              },
            },
          }}
        >
          <Form
            style={{ paddingInline: "20px" }}
            layout="vertical"
            form={form}
            onSubmitCapture={() => onFinish()}
          >
            <AllVehiclesSelect selectedStyles={selectedStyles} />

            {/* Vehicle Not Working Warning Banner */}
            {isVehicleNotWorkingForMoreThan24Hours() && (
              <div className="mt-4 mb-4 mx-1 bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Not able to create trip
                    </h3>
                    <div className="mt-1 text-xs text-red-700">
                      <p>GPS Not Working</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vehicle On Trip Warning Banner */}
            {isVehicleOnTrip() && (
              <div className="mt-4 mb-4 mx-1 bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Not able to create trip
                    </h3>
                    <div className="mt-1 text-xs text-red-700">
                      <p>Vehicle is already on an active trip</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3 ml-2">
              <Radio.Group
                name="dynamicOrFixed"
                onChange={(e) => setSelectedTripType(e.target.value)}
                value={selectedTripType}
              >
                <Radio value="Dynamic" required>
                  Dynamic
                </Radio>
                <Radio value="Fixed" required>
                  Fixed
                </Radio>
              </Radio.Group>
            </div>
            <p className="text-sm font-semibold mt-4 -mb-1 ml-1 text-neutral-600">
              Select Date:{" "}
            </p>

            <DatePicker
              format="Do MMMM, YYYY HH:mm"
              className="absolute top-2  z-20 w-full"
              size="large"
              showTime
              value={date}
              onChange={(e) => setDate(e)}
            />

            {isSinghTransportAccount(userId) ? (
              <>
                <p className="text-sm font-semibold  mb-1 ml-1 text-neutral-600 mt-6">
                  Created By:{" "}
                </p>
                <Form.Item
                  name="created_by"
                  rules={[
                    {
                      required: true,
                      min: 3,
                      message: "Created by should be more than 3 characters",
                    },
                  ]}
                >
                  <Input className="w-full h-9" defaultValue={userName} />
                </Form.Item>
              </>
            ) : null}

            {isSinghTransportAccount(userId) ? (
              <div className="w-full flex justify-between mt-6">
                <p className="text-sm font-semibold  mb-1 ml-1 text-neutral-600">
                  Customer Name:{" "}
                </p>
                <Checkbox
                  className="relative font-semibold"
                  style={{ color: "rgb(82,82,82)" }}
                  checked={isManualPartyListSelected}
                  onChange={() => {
                    setIsManualPartyListSelected(!isManualPartyListSelected);
                  }}
                >
                  Manually Enter Customer
                </Checkbox>
              </div>
            ) : null}

            {isSinghTransportAccount(userId) === false ||
            isManualPartyListSelected ? (
              <>
                {isSinghTransportAccount(userId) === false ? (
                  <p className="text-sm font-semibold  mb-1 ml-1 text-neutral-600 mt-6">
                    Customer Name:{" "}
                  </p>
                ) : null}
                <Form.Item
                  name="customer_name"
                  rules={[
                    {
                      required: true,
                      min: 3,
                      message: "Customer name should be atleast 3 characters",
                    },
                  ]}
                >
                  <Input
                    className="w-full h-9"
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </Form.Item>
              </>
            ) : (
              <Select
                className="w-[400px]"
                size="middle"
                showSearch
                options={partyListOptions}
                filterOption={(input, option) =>
                  (option?.value ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                onChange={(value, option: any) => {
                  if (partyListData) {
                    const party = partyListData.list.find(
                      (item) => item.id === option.id,
                    );

                    if (party) {
                      setCustomerName(party.name);
                      form.setFieldValue(["customer_name"], party.name);
                    } else {
                      setCustomerName("");
                      form.setFieldValue(["customer_name"], "");
                    }
                  }
                }}
              />
            )}

            {isSinghTransportAccount(userId) ? (
              <div className="w-full flex justify-between mt-6">
                <p className="text-sm font-semibold  mb-1 ml-1 text-neutral-600">
                  Destination Party:{" "}
                </p>
                <Checkbox
                  className="relative font-semibold"
                  style={{ color: "rgb(82,82,82)" }}
                  checked={isManualDestinationPartyListSelected}
                  onChange={() => {
                    setManualDestinationPartyListSelected(
                      !isManualDestinationPartyListSelected,
                    );
                  }}
                >
                  Manually Enter Party
                </Checkbox>
              </div>
            ) : null}

            {isSinghTransportAccount(userId) === false ||
            isManualDestinationPartyListSelected ? (
              <>
                {isSinghTransportAccount(userId) === false ? (
                  <p className="text-sm font-semibold  mb-1 ml-1 text-neutral-600 mt-6">
                    Destination Party:{" "}
                  </p>
                ) : null}
                <Form.Item
                  name="destination_party_name"
                  rules={[
                    {
                      required: true,
                      min: 3,
                      message: "Customer name should be atleast 3 characters",
                    },
                  ]}
                >
                  <Input
                    className="w-full h-9"
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </Form.Item>
              </>
            ) : (
              <Select
                className="w-[400px]"
                size="middle"
                showSearch
                options={partyListOptions}
                filterOption={(input, option) =>
                  (option?.value ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                onChange={(value, option: any) => {
                  if (partyListData) {
                    const party = partyListData.list.find(
                      (item) => item.id === option.id,
                    );

                    if (party) {
                      setCustomerName(party.name);
                      form.setFieldValue(
                        ["destination_party_name"],
                        party.name,
                      );
                    } else {
                      setCustomerName("");
                      form.setFieldValue(["destination_party_name"], "");
                    }
                  }
                }}
              />
            )}

            {/* Source and Destination Start */}
            <p className="text-lg font-semibold mt-6 mb-2 ml-1 text-neutral-600">
              Source and Destination ~
            </p>

            <div className="flex justify-between items-center mt-3  mb-1 ml-1">
              <p className="text-sm font-semibold  mb-1 ml-1 text-neutral-600">
                Source:{" "}
              </p>
              <Checkbox
                className="relative font-semibold"
                style={{ color: "rgb(82,82,82)" }}
                checked={isSourceAuto}
                onChange={() => {
                  form.setFieldValue("source", "");
                  form.setFieldValue("sourceOr", "");
                  setIsSourceAuto((prev) => !prev);
                  setSourceValue("");
                }}
              >
                Google Search
              </Checkbox>
            </div>

            {isSourceAuto ? (
              <ReactGoogleAutocomplete
                onPlaceSelected={(place) => {
                  setSourceValue(
                    `${place.formatted_address}##${
                      place.geometry && place.geometry.location
                        ? place.geometry.location.lat()
                        : ""
                    }##${
                      place.geometry && place.geometry.location
                        ? place.geometry.location.lng()
                        : ""
                    }`,
                  );
                }}
                onChange={(e) => {
                  setSourceValue(e.currentTarget.value);
                }}
                // apiKey={process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY || ''}
                apiKey={getGoogleApiKey() || ""}
                googleMapsScriptBaseUrl="https://maps.googleapis.com/maps/api/js"
                defaultValue={sourceValue}
                className="text-md p-1.5 rounded-md border border-neutral-300 w-full"
                placeholder="Enter Source"
              />
            ) : (
              <Select
                className="w-full h-9"
                style={{ height: "36px" }}
                showSearch
                value={sourceValue.split("##")[0]}
                onChange={(value) => {
                  const poi = poiListData?.data.find(
                    (item) => item.name === value,
                  );
                  setSourceValue(
                    `${poi?.name}##${poi?.gps_latitude}##${poi?.gps_longitude}`,
                  );
                }}
                options={sourceAndDestinationOptions}
                loading={isPoiListLoading}
              />
            )}

            <div className="flex justify-between items-center mt-3  mb-1 ml-1">
              <p className="text-sm font-semibold text-neutral-600">
                Destination:{" "}
              </p>
              <Checkbox
                className="relative font-semibold"
                style={{ color: "rgb(82,82,82)" }}
                checked={isDestinationAuto}
                onChange={() => {
                  form.setFieldValue("destination", "");
                  form.setFieldValue("destinationOr", "");
                  setIsDestinationAuto((prev) => !prev);
                  setDestinationValue("");
                }}
              >
                Google Search
              </Checkbox>
            </div>

            {isDestinationAuto ? (
              <ReactGoogleAutocomplete
                onPlaceSelected={(place) => {
                  setDestinationValue(
                    `${place.formatted_address}##${
                      place.geometry && place.geometry.location
                        ? place.geometry.location.lat()
                        : ""
                    }##${
                      place.geometry && place.geometry.location
                        ? place.geometry.location.lng()
                        : ""
                    }`,
                  );
                }}
                onChange={(e) => {
                  setDestinationValue(e.currentTarget.value);
                }}
                // apiKey={process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY || ''}

                apiKey={getGoogleApiKey() || ""}
                defaultValue={destinationValue}
                className="text-md p-1.5 rounded-md border border-neutral-300 w-full"
                placeholder="Enter Destination"
              />
            ) : (
              <Select
                className="w-full h-9"
                style={{ height: "36px" }}
                showSearch
                value={destinationValue.split("##")[0]}
                onChange={(value) => {
                  const poi = poiListData?.data.find(
                    (item) => item.name === value,
                  );
                  setDestinationValue(
                    `${poi?.name}##${poi?.gps_latitude}##${poi?.gps_longitude}`,
                  );
                }}
                options={sourceAndDestinationOptions}
                loading={isPoiListLoading}
              />
            )}

            {/* Source Destination End */}

            {/* Via Start */}
            <div className="flex justify-between items-center mt-6 ml-1">
              <p className="text-lg font-semibold text-neutral-600">
                Add Via ~
              </p>
              <div className="flex justify-center items-center">
                <Tooltip
                  title={
                    viaCounter === 0
                      ? "Minimum Via Points Reached"
                      : `Remove Via ${viaCounter}`
                  }
                  mouseEnterDelay={1}
                >
                  <MinusCircleFilled
                    className="text-xl mr-2"
                    style={{
                      color: viaCounter === 0 ? "rgb(212,212,212)" : "",
                    }}
                    disabled={viaCounter === 0}
                    onClick={() => {
                      const tempViaCounter = viaCounter - 1;

                      setViaCounter((prev) => (prev === 0 ? 0 : prev - 1));
                      setIsCurrentViaAuto((prev) =>
                        prev.map((item, index) =>
                          index === tempViaCounter ? false : item,
                        ),
                      );
                      setCurrentViaValue((prev) =>
                        prev.map((item, index) =>
                          index === tempViaCounter ? "" : item,
                        ),
                      );
                      setViaArray((prev) =>
                        prev.filter((item, index) => index !== tempViaCounter),
                      );
                      setViaHaltHrs((prev) =>
                        prev.map((item, index) =>
                          index === tempViaCounter ? 0 : item,
                        ),
                      );

                      tempViaCounter === 0 &&
                        form.setFieldsValue({
                          via: {
                            via1: {
                              halt: "",
                              party_name: "",
                            },
                          },
                        });

                      tempViaCounter === 1 &&
                        form.setFieldsValue({
                          via: {
                            via2: {
                              halt: "",
                              party_name: "",
                            },
                          },
                        });

                      tempViaCounter === 2 &&
                        form.setFieldsValue({
                          via: {
                            via3: {
                              halt: "",
                              party_name: "",
                            },
                          },
                        });

                      tempViaCounter === 3 &&
                        form.setFieldsValue({
                          via: {
                            via4: {
                              halt: "",
                              party_name: "",
                            },
                          },
                        });
                    }}
                  />
                </Tooltip>
                <Tooltip
                  title={
                    viaCounter === 4
                      ? "Maximum Via Points Reached"
                      : `Add Via ${viaCounter + 1}`
                  }
                  mouseEnterDelay={1}
                >
                  <PlusCircleFilled
                    className="text-xl"
                    style={{
                      color: viaCounter === 4 ? "rgb(212,212,212)" : "",
                    }}
                    disabled={viaCounter === 4}
                    onClick={() => {
                      setViaCounter((prev) => (prev >= 4 ? 4 : prev + 1));
                    }}
                  />
                </Tooltip>
              </div>
            </div>
            {viaArray.length ? (
              viaArray.map((_: number, index) => {
                return (
                  <div key={index}>
                    <p className="text-lg font-semibold mt-3 mb-2 ml-1 text-neutral-600">
                      Via {index + 1}
                    </p>

                    <p className="text-sm font-semibold  mb-1 ml-1 text-neutral-600">
                      Party Name:{" "}
                    </p>
                    <Form.Item
                      name={["via", `via${index + 1}`, "party_name"]}
                      rules={[
                        {
                          required: true,
                          min: 3,
                          message: "Please enter valid via name",
                        },
                      ]}
                    >
                      <Input className="w-full h-9" />
                    </Form.Item>
                    <div className="flex justify-between items-center mt-3  mb-1 ml-1">
                      <p className="text-sm font-semibold mt-3  mb-1 ml-1 text-neutral-600">
                        Via Location:{" "}
                      </p>
                      <Checkbox
                        className="relative font-semibold"
                        style={{ color: "rgb(82,82,82)" }}
                        checked={isCurrentViaAuto[index]}
                        onChange={() => {
                          form.setFieldValue(
                            ["via", `via${index + 1}`, "location"],
                            "",
                          );
                          setIsCurrentViaAuto((prev) => {
                            const updatedArray = [...prev];
                            updatedArray[index] = !prev[index];
                            return updatedArray;
                          });
                          setCurrentViaValue((prev) => {
                            const updatedArray = [...prev];
                            updatedArray[index] = "";
                            return updatedArray;
                          });
                        }}
                      >
                        Google Search
                      </Checkbox>
                    </div>

                    {isCurrentViaAuto[index] ? (
                      <ReactGoogleAutocomplete
                        onPlaceSelected={(place) => {
                          setCurrentViaValue((prev) => {
                            const updatedViaArray = prev;
                            updatedViaArray[index] = `${
                              place.formatted_address
                            }##${
                              place.geometry && place.geometry.location
                                ? place.geometry.location.lat()
                                : ""
                            }##${
                              place.geometry && place.geometry.location
                                ? place.geometry.location.lng()
                                : ""
                            }`;
                            return updatedViaArray;
                          });
                        }}
                        onChange={(e) => {
                          if (
                            e.currentTarget !== null &&
                            e.currentTarget.value !== null
                          ) {
                            setCurrentViaValue((prev) => {
                              const updatedViaArray = prev;

                              if (e.currentTarget) {
                                updatedViaArray[index] = e.currentTarget.value;
                              }
                              return updatedViaArray;
                            });
                          }
                        }}
                        apiKey={getGoogleApiKey() || ""}
                        defaultValue={currentViaValue[index]}
                        className="text-md p-1.5 rounded-md border border-neutral-300 w-full"
                        placeholder={`Enter Via ${index + 1}  Location`}
                      />
                    ) : (
                      <Select
                        className="w-full h-9"
                        style={{ height: "36px" }}
                        showSearch
                        onChange={(value) => {
                          setCurrentViaValue((prev) => {
                            const updatedViaArray = [...prev];
                            const poi = poiListData?.data.find(
                              (item) => item.name === value,
                            );
                            updatedViaArray[index] =
                              `${poi?.name}##${poi?.gps_latitude}##${poi?.gps_longitude}`;
                            return updatedViaArray;
                          });
                        }}
                        value={currentViaValue[index].split("##")[0]}
                        options={sourceAndDestinationOptions}
                        loading={isPoiListLoading}
                      />
                    )}

                    <p className="text-sm font-semibold mt-3 ml-1 text-neutral-600">
                      Halt:{" "}
                    </p>
                    <Form.Item
                      name={["via", `via${index + 1}`, "halt"]}
                      rules={[
                        { required: true, message: "Please enter valid halt" },
                      ]}
                    >
                      <Input
                        className="w-full h-9"
                        style={{ width: "400px" }}
                        value={viaHaltHrs[index]}
                        type="number"
                        onChange={(e) => {
                          setViaHaltHrs((prev) => {
                            let temp = [...prev]; // Copy the previous array to avoid mutating state directly
                            temp[index] = Number(e.target.value); // Assuming index is valid
                            return temp;
                          });
                        }}
                      />
                    </Form.Item>
                    <span className="mb-4 block w-full"></span>
                  </div>
                );
              })
            ) : (
              <p></p>
            )}
            {/* Via End */}
            {/* Route Start */}
            <p className="text-lg font-semibold mt-3 mb-2 ml-1 text-neutral-600">
              Route Type ~
            </p>

            <Form.Item>
              <Radio.Group
                options={routeOptions}
                onChange={async (e) => {
                  setSelectedRouteType(e.target.value);
                  await getJourneyHoursHandler(e, false);
                }}
                value={selectedRouteType}
              />
            </Form.Item>

            <div className="py-1"></div>

            <p className="text-sm font-semibold mt-3 mb-1.5 ml-1 text-neutral-600">
              Journey Hours:{" "}
            </p>
            <Form.Item
              name="journey_hrs"
              rules={[
                { required: true, message: "Please enter valid journey hours" },
              ]}
            >
              <Input
                type="number"
                className="w-full h-9 "
                style={{ width: "400px" }}
                disabled={selectedRouteType === "Fix Hours" ? false : true}
              />
            </Form.Item>

            <p className="text-sm font-semibold mt-3 mb-1 ml-1 text-neutral-600">
              Journey Km:{" "}
            </p>
            <Form.Item
              name="journey_km"
              rules={[
                { required: true, message: "Please enter valid journey km" },
              ]}
            >
              <Input
                type="number"
                className="w-full h-9"
                style={{ width: "400px" }}
                disabled={true}
              />
            </Form.Item>

            {/* Route End */}

            {/* Temperature Data */}
            {isSinghTransportAccount(userId) ? (
              <div className="pt-1">
                <p className="text-lg font-semibold mt-6 mb-2 ml-1 text-neutral-600">
                  Temperature Details ~
                </p>
                <p className="text-sm font-semibold mt-3 mb-1.5 ml-1 text-neutral-600">
                  Temperature Range From:{" "}
                </p>
                <Form.Item
                  name="temp_range_from"
                  rules={[
                    {
                      required: true,
                      message: "Temperature Range from is required",
                    },
                  ]}
                >
                  <Input
                    type="number"
                    className="w-full h-9 "
                    style={{ width: "400px" }}
                  />
                </Form.Item>

                <p className="text-sm font-semibold mt-3 mb-1.5 ml-1 text-neutral-600">
                  Temperature Range To:{" "}
                </p>
                <Form.Item
                  name="temp_range_to"
                  rules={[
                    {
                      required: true,
                      message: "Temperature Range to is required",
                    },
                  ]}
                >
                  <Input
                    type="number"
                    className="w-full h-9 "
                    style={{ width: "400px" }}
                  />
                </Form.Item>
              </div>
            ) : null}

            <p className="text-lg font-semibold mt-6 mb-2 ml-1 text-neutral-600">
              Additional Details ~
            </p>

            <p className="text-sm font-semibold mt-3 mb-1 ml-1 text-neutral-600">
              {isSinghTransportAccount(userId) ? "LR Number" : "Trip Type"}
              :{" "}
            </p>
            {isSinghTransportAccount(userId) ? (
              <Form.Item name="lr_number">
                <Input className="w-full h-9" />
              </Form.Item>
            ) : (
              <Form.Item name="trip_type">
                <Input className="w-full h-9" />
              </Form.Item>
            )}

            <p className="text-sm font-semibold mt-3 mb-1 ml-1 text-neutral-600">
              Weight:{" "}
            </p>
            <Form.Item name="weight">
              <Input
                type="number"
                className="w-full h-9"
                style={{ width: "400px" }}
              />
            </Form.Item>

            {/* Driver Details Start */}
            <p className="text-lg font-semibold mt-6 mb-2 ml-1 text-neutral-600">
              Driver Details ~
            </p>

            {isSinghTransportAccount(userId) ? (
              <div className="w-full flex justify-end">
                <Checkbox
                  className="relative font-semibold"
                  style={{ color: "rgb(82,82,82)" }}
                  checked={isManualDriverListSelected}
                  onChange={() => {
                    setIsManualDriverListSelected((prev) => !prev);
                  }}
                >
                  Manually Enter Driver
                </Checkbox>
              </div>
            ) : null}

            {isSinghTransportAccount(userId) === false ||
            isManualDriverListSelected ? (
              <>
                <p className="text-sm font-semibold  mb-1 ml-1 text-neutral-600">
                  Driver&apos;s Name:{" "}
                </p>
                <Form.Item name={["driver", "name"]}>
                  <Input
                    className="w-full h-9"
                    onChange={(e) => setDriverName(e.target.value)}
                  />
                </Form.Item>

                <p className="text-sm font-semibold mt-3 mb-1 ml-1 text-neutral-600">
                  Driver&apos;s Number:{" "}
                </p>
                <Form.Item name={["driver", "number"]}>
                  <Input
                    type="number"
                    className="w-full h-9"
                    style={{ width: "400px" }}
                    onChange={(e) => setDriverNumber(e.target.value)}
                  />
                </Form.Item>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold  mb-1 ml-1 text-neutral-600">
                  Driver&apos;s Name:{" "}
                </p>

                <Select
                  className="w-[400px]"
                  size="middle"
                  showSearch
                  options={driverListOptions}
                  filterOption={(input, option) =>
                    (option?.value ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  onChange={(value, option: any) => {
                    if (driverListData) {
                      const driver = driverListData.list.find(
                        (item) => item.id === option.id,
                      );

                      if (driver) {
                        setDriverName(driver.driver_name);
                        setDriverNumber(driver.driver_number);
                        form.setFieldValue(
                          ["driver", "name"],
                          driver.driver_name,
                        );
                        form.setFieldValue(
                          ["driver", "number"],
                          driver.driver_number,
                        );
                      } else {
                        setDriverName("");
                        setDriverNumber("");
                        form.setFieldValue(["driver", "name"], "");
                        form.setFieldValue(["driver", "number"], "");
                      }
                    }
                  }}
                />

                <p className="text-sm font-semibold mt-3 mb-1 ml-1 text-neutral-600">
                  Driver&apos;s Number:{" "}
                </p>
                <Form.Item name={["driver", "number"]}>
                  <Input
                    type="number"
                    className="w-full h-9"
                    style={{ width: "400px" }}
                    disabled
                  />
                </Form.Item>
              </>
            )}
            {/* Driver Details End */}

            {/* Additional Details Start */}
            {extraInfo.length > 0 ? (
              <>
                <p className="text-lg font-semibold mt-6 mb-2 ml-1 text-neutral-600">
                  Extra Info ~
                </p>

                {extraInfo.map((info: string, index: number) => (
                  <div key={index}>
                    <p className="text-sm font-semibold mt-3 mb-1 ml-1 text-neutral-600">
                      {info}
                    </p>
                    <Form.Item name={info}>
                      <Input
                        className="w-full h-9"
                        value={extraInfoData[info]}
                        onChange={(e) =>
                          setExtraInfoData({
                            ...extraInfoData,
                            [info]: e.target.value,
                          })
                        }
                      />
                    </Form.Item>
                  </div>
                ))}
              </>
            ) : null}

            {/* Additional Details End */}

            {/* Driver  */}
            {createTripErrorState ? (
              <div className="w-full bg-red-100 py-1 px-1 mt-4 -mb-1 ml-1">
                <p className="text-sm font-semibold  text-red-500">
                  {createTripErrorState}
                </p>
              </div>
            ) : (
              <p></p>
            )}
            <div className="flex gap-2 w-full justify-end mt-6">
              <Button
                htmlType="submit"
                type="primary"
                loading={isSubmitting}
                disabled={
                  isVehicleNotWorkingForMoreThan24Hours() || isVehicleOnTrip()
                }
              >
                Submit
              </Button>
            </div>
          </Form>
        </ConfigProvider>
      </div>
    </div>
  );
};
