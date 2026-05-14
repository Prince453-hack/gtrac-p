"use client";

import { RootState } from "@/app/_globalRedux/store";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ClearOutlined, CloseOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Checkbox,
  ConfigProvider,
  DatePicker,
  Form,
  Input,
  message,
  Select,
  Tooltip,
} from "antd";
import { useGetPoiListQuery } from "@/app/_globalRedux/services/masterData";
import ReactGoogleAutocomplete from "react-google-autocomplete";
import moment from "moment";
import { AllVehiclesSelect } from "../AllVehiclesSelect";
import {
  initialSelectedVehicleState,
  setSelectedVehicleBySelectElement,
} from "@/app/_globalRedux/dashboard/selectedVehicleSlice";
import { setCreateTripOrTripPlanningActive } from "@/app/_globalRedux/dashboard/createTripOrTripPlanningActive";
import { CsvUploader } from "../../common/csvUploader";
import getGoogleApiKey from "@/app/helpers/getGoogleMapKeys";
import { getJourneyHours, getLatLong } from "@/app/helpers/api";
import { useAppDispatch } from "@/app/_globalRedux/provider";
import {
  setIsMapActive,
  setIsMapNotLoading,
} from "@/app/_globalRedux/dashboard/mapSlice";
import { checkLatLngExists } from "@/app/helpers/checkIfLatLngExists";
import {
  useCreateTripFormMutation,
  useMapYourVehicleMMutation,
  usePlanTripFormMutation,
} from "@/app/_globalRedux/services/trackingDashboard";
import { setHistoryReplayModeToggle } from "@/app/_globalRedux/dashboard/historyReplaySlice";
import { setAllMarkers } from "@/app/_globalRedux/dashboard/markersSlice";
import AdditionalFieldsModal from "./additionalFIeldsModal";
import { setFieldsFromCsv } from "./helpers/setFieldsFromCsv";
import dayjs from "dayjs";
import { TransporterOptions, TransporterSelect } from "./TransporterSelect";

const normalizeAlphaNum = (value: string) =>
  value ? value.toUpperCase().replace(/[^A-Z0-9]/g, "") : value;

const normalizeDigits = (value: string) =>
  value ? value.replace(/\D/g, "") : value;

const selectedStyles = {
  selectorBg: "transparent",
  colorBorder: "transparent",
  fontSize: 19,
  fontWeight: 600,
  optionFontSize: 14,
  optionPadding: "5px",
  optionSelectedColor: "#000",
};

export const VehicleAllocationTripForm = () => {
  const collapseVehicleStatusToggle = useSelector(
    (state: RootState) => state.collapseTripStatusToggle
  );
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle
  );
  const {
    groupId,
    userId,
    extra,
    userName: username,
    parentUser,
  } = useSelector((state: RootState) => state.auth);
  const { type: createTripOrPlanningTripType } = useSelector(
    (state: RootState) => state.createTripOrPlanningTripActive
  );
  const { isMapActive } = useSelector((state: RootState) => state.map);
  const markers = useSelector((state: RootState) => state.markers);
  const dispatch = useAppDispatch();

  const [form] = Form.useForm();
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);

  const { data: poiListData, isLoading: isPoiListLoading } = useGetPoiListQuery(
    {
      groupId,
      userId,
    },
    {
      skip: !groupId || !userId,
    }
  );

  const [sourceAndDestinationOptions, setSourceAndDestinationOptions] =
    useState<{ id: number; value: string }[]>([]);

  useEffect(() => {
    if (poiListData && poiListData.data.length > 1) {
      let tempSourceAndDestinationOptions: { id: number; value: string }[] = [];
      poiListData.data.forEach((poi) =>
        tempSourceAndDestinationOptions.push({ id: poi.id, value: poi.name })
      );
      setSourceAndDestinationOptions(tempSourceAndDestinationOptions);
    }
  }, [poiListData]);

  useEffect(
    () => {
      if (selectedVehicle.vId === 0) {
        form.setFieldValue("device_no", "");
        if (collapseVehicleStatusToggle) {
          setVisibleDetailsStyling("-translate-x-[442px]");
        } else {
          setVisibleDetailsStyling("-translate-x-[20px]");
        }
      } else if (selectedVehicle.vId !== 0) {
        form.setFieldValue("device_no", selectedVehicle.gpsDtl.controllernum);
        if (collapseVehicleStatusToggle) {
          setVisibleDetailsStyling("translate-x-[20px]");
        } else {
          setVisibleDetailsStyling("translate-x-[442px]");
        }
      }
    },
    // eslint-disable-next-line
    [selectedVehicle, collapseVehicleStatusToggle]
  );

  const [selectedRouteType, setSelectedRouteType] = useState<
    "None" | "Express" | "Normal" | "Fix Hours"
  >("Normal");

  const [visibleDetailsStyling, setVisibleDetailsStyling] = useState("");
  const [viaCounter, setViaCounter] = useState(0);

  const [isCurrentViaAuto, setIsCurrentViaAuto] = useState([
    false,
    false,
    false,
    false,
  ]);
  const [currentViaValue, setCurrentViaValue] = useState(["", "", "", ""]);
  const [viaArray, setViaArray] = useState<number[]>([]);
  const [viaHaltHrs, setViaHaltHrs] = useState<number[]>([0, 0, 0, 0]);

  const [isDestinationAuto, setIsDestinationAuto] = useState(false);
  const [destinationValue, setDestinationValue] = useState("");

  const [isSourceAuto, setIsSourceAuto] = useState(false);
  const [sourceValue, setSourceValue] = useState<string>("");

  const [isUnMap, setIsUnMap] = useState(true);

  const [date, setDate] = useState<dayjs.Dayjs | undefined>(undefined);

  const auth = JSON.parse(localStorage.getItem("auth-session") || "");
  const extraInfo = auth.extraInfo
    ? JSON.parse(auth.extraInfo || "")
    : ([] as string[]);
  const [extraInfoData, setExtraInfoData] = useState<any>(
    extraInfo.reduce(
      (acc: Record<string, string>, curr: string) => ({ ...acc, [curr]: "" }),
      {}
    )
  );
  const [isAdditionalInfoModalActive, setIsAdditionalInfoModalActive] =
    useState(false);

  const [eta, setEta] = useState("");

  const [selectedTransport, setSelectedTransport] =
    useState<TransporterOptions | null>(null);

  const handleTransportChange = (value: TransporterOptions | null) => {
    setSelectedTransport(value);
  };

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

  const [mapYourVehicleTrigger] = useMapYourVehicleMMutation();

  useEffect(() => {
    let tempError = createTripError as any;
    setCreateTripErrorState(tempError);
  }, [createTripError]);

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

  const resetFields = () => {
    setIsSubmitting(false);
    setCreateTripErrorState("");
    form.resetFields();
    setSelectedRouteType("None");

    setViaCounter(0);

    setIsCurrentViaAuto([false, false, false, false]);
    setCurrentViaValue(["", "", "", ""]);
    setViaArray([]);
    setViaHaltHrs([0, 0, 0, 0]);

    setIsDestinationAuto(false);
    setDestinationValue("");
    setIsSourceAuto(false);
    setSourceValue("");
  };

  const getJourneyHoursHandler = async (e: any, isExcel: boolean) => {
    let eta: string = "";
    let journeyHours: string = "";
    let journeyKm: string = "";

    await getJourneyHours({
      userId: Number(userId),
      source: sourceValue.split("##")[0],
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
            }
          );
          const selectedStartDateInMilliseconds = date?.toDate()
            ? date.toDate().getTime()
            : new Date().getTime();
          const estimateHoursInMilliseconds =
            Number(adjustedArray[1]) * 60 * 60 * 1000;
          const tempEta = new Date(
            selectedStartDateInMilliseconds + estimateHoursInMilliseconds
          );

          setEta(moment(tempEta).format("YYYY-MM-DD HH:mm:ss"));
          eta = moment(tempEta).format("YYYY-MM-DD HH:mm:ss");
          journeyHours = adjustedArray[1];
          journeyKm = adjustedArray[0];

          form.setFieldValue("journey_hrs", adjustedArray[1]);
          form.setFieldValue("journey_km", adjustedArray[0]);
        }
      })
      .catch((err) => {
        let result = err as any;
      });
    return { eta, journeyHours, journeyKm };
  };

  const onFinish = async () => {
    const {
      eta: tempEta,
      journeyHours,
      journeyKm,
    } = await getJourneyHoursHandler(selectedRouteType, true);
    const formValues = form.getFieldsValue();

    if (selectedVehicle.vId === 0) {
      messageApi.open({
        type: "error",
        content: "Please select a vehicle",
        duration: 10,
      });
      return;
    }

    if (sourceValue.split("##")[0] === "") {
      messageApi.open({
        type: "error",
        content: "Please enter source",
        duration: 10,
      });
      return;
    }

    if (destinationValue.split("##")[0] === "") {
      messageApi.open({
        type: "error",
        content: "Please enter destination",
        duration: 10,
      });
      return;
    }

    if (date === undefined) {
      messageApi.open({
        type: "error",
        content: "Please select date",
        duration: 10,
      });
      return;
    }

    if (selectedTransport === null && formValues.transporter_number === "") {
      messageApi.open({
        type: "error",
        content: "Please select transport type",
        duration: 10,
      });
      return;
    }

    setIsSubmitting(true);
    const formSubmitObj = {
      CustomerName:
        Number(userId) === 87317
          ? formValues.transporter_number
          : selectedTransport,
      Destination: !isDestinationAuto
        ? await getAddressLatLong(destinationValue)
        : "",
      DestinationOr: isDestinationAuto
        ? await getAddressLatLong(destinationValue)
        : "",
      DriverName: `${formValues.driver.name}##${formValues.driver.number}`,
      ETA: tempEta,
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
      cargo_weight: formValues.shipment_number,
      challan_date: `${date?.format("YYYY-MM-DD HH:mm")}`,
      challan_no: formValues.device_no,
      destination_party_name: formValues.gc_number,
      journey_KM: journeyKm,
      journey_hours: journeyHours,
      lorry_no: formValues.vehicle_number,
      lorry_type: formValues.trip_type,
      sys_service_id: selectedVehicle.vId
        ? `${selectedVehicle.vId}`
        : `${selectedVehicle.vehicleTrip.sys_service_id}`,
      sys_user_id: userId,
      to_and_fro: "0",
      viaone_halthr_input: formValues.via?.via1 ? formValues.via.via1.halt : "",
      viaone_party_name: formValues.via?.via1
        ? formValues.via.via1.party_name
        : "",
      viatwo_halthr_input: formValues.via?.via2 ? formValues.via.via2.halt : "",
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
      createdBy: "",
    };

    const lorry_no_string = `${formValues.shipment_number}/${formValues.gc_number}${selectedTransport}/${formValues.vehicle_number}`;

    if (createTripOrPlanningTripType === "create-trip") {
      const data = await createTrip({
        body: { ...formSubmitObj, extraInfo: JSON.stringify(extraInfoData) },
        token: groupId,
      });

      if (data.error) {
        error({ tripType: "Create" });
      } else {
        mapYourVehicleTrigger({
          group_id: Number(groupId),
          lorry_no: lorry_no_string,
          oldlorry_no: selectedVehicle.vehicleTrip.lorry_no
            ? selectedVehicle.vehicleTrip.lorry_no
            : selectedVehicle.vehReg,
          sys_service_id: `${selectedVehicle.vId}`,
          username,
        }).then((res) => {
          success({ tripType: "Create" });
        });
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
          "Please complete the form and enter valid inputs."
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
          {}
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdditionalInfoModalActive]);

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
          <div className="flex items-center ">
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
                setSelectedVehicleBySelectElement(initialSelectedVehicleState)
              );
              dispatch(setCreateTripOrTripPlanningActive({ type: "" }));
              dispatch(setHistoryReplayModeToggle(false));
              dispatch(
                setAllMarkers(
                  markers.map((m) => ({
                    ...m,
                    isVisible: true,
                    isVisibility: true,
                    visibility: true,
                  }))
                )
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
            <div className="mt-3 ml-2">
              <Checkbox.Group
                options={[{ label: "Un-Map", value: "un-map" }]}
                value={isUnMap ? ["un-map"] : []}
                onChange={() => setIsUnMap((prev) => !prev)}
              />
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

            {/* Vehicle Number */}
            <p className="text-sm font-semibold mt-[18px] mb-1 ml-1 text-neutral-600">
              Vehicle Number:{" "}
            </p>
            <Form.Item
              name="vehicle_number"
              rules={[
                { required: true, message: "Vehicle number is required" },
                {
                  pattern: /^[A-Z0-9]+$/,
                  message: "Only uppercase letters and numbers allowed",
                },
              ]}
              normalize={normalizeAlphaNum}
            >
              <Input className="w-full h-9" />
            </Form.Item>

            <p className="text-sm font-semibold mt-3 mb-1 ml-1 text-neutral-600">
              Transporter Name:{" "}
            </p>
            {Number(userId) === 87317 ? (
              <Form.Item
                name="transporter_number"
                rules={[
                  {
                    required: true,
                    min: 3,
                    message: "GC Number should be at least 3 characters",
                  },
                  {
                    pattern: /^[A-Z0-9]+$/,
                    message: "Only uppercase letters and numbers allowed",
                  },
                ]}
                normalize={normalizeAlphaNum}
              >
                <Input className="w-full h-9" />
              </Form.Item>
            ) : (
              <TransporterSelect onChange={handleTransportChange} />
            )}

            {/* GC Number */}
            <p className="text-sm font-semibold mt-3 mb-1 ml-1 text-neutral-600">
              GC Number:{" "}
            </p>
            <Form.Item
              name="gc_number"
              rules={[
                {
                  required: true,
                  min: 3,
                  message: "GC Number should be at least 3 characters",
                },
                {
                  pattern: /^[A-Z0-9]+$/,
                  message: "Only uppercase letters and numbers allowed",
                },
              ]}
              normalize={normalizeAlphaNum}
            >
              <Input className="w-full h-9" />
            </Form.Item>

            {/* Shipment Number */}
            <p className="text-sm font-semibold mt-3 mb-1 ml-1 text-neutral-600">
              Shipment Number:{" "}
            </p>
            <Form.Item
              name="shipment_number"
              rules={[
                {
                  required: true,
                  min: 1,
                  message: "Shipment number should be at least 1 character",
                },
                {
                  pattern: /^[A-Z0-9]+$/,
                  message: "Only uppercase letters and numbers allowed",
                },
              ]}
              normalize={normalizeAlphaNum}
            >
              <Input className="w-full h-9" />
            </Form.Item>

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
                    }`
                  );
                }}
                onChange={(e) => {
                  setSourceValue(e.currentTarget.value);
                }}
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
                    (item) => item.name === value
                  );
                  setSourceValue(
                    `${poi?.name}##${poi?.gps_latitude}##${poi?.gps_longitude}`
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
                    }`
                  );
                }}
                onChange={(e) => {
                  setDestinationValue(e.currentTarget.value);
                }}
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
                    (item) => item.name === value
                  );
                  setDestinationValue(
                    `${poi?.name}##${poi?.gps_latitude}##${poi?.gps_longitude}`
                  );
                }}
                options={sourceAndDestinationOptions}
                loading={isPoiListLoading}
              />
            )}

            {/* Additional Details ~ */}
            <p className="text-lg font-semibold mt-6 mb-2 ml-1 text-neutral-600">
              Additional Details ~
            </p>

            {/* Driver Details Start */}
            <p className="text-lg font-semibold mt-6 mb-2 ml-1 text-neutral-600">
              Driver Details ~
            </p>

            <p className="text-sm font-semibold  mb-1 ml-1 text-neutral-600">
              Driver&apos;s Name:{" "}
            </p>
            <Form.Item
              name={["driver", "name"]}
              rules={[
                { required: true, message: "Driver's name is required" },
                {
                  pattern: /^[A-Z0-9]+$/,
                  message: "Only uppercase letters and numbers allowed",
                },
              ]}
              normalize={normalizeAlphaNum}
            >
              <Input className="w-full h-9" />
            </Form.Item>

            <p className="text-sm font-semibold mt-3 mb-1 ml-1 text-neutral-600">
              Driver&apos;s Number:{" "}
            </p>
            <Form.Item
              name={["driver", "number"]}
              rules={[
                { required: true, message: "Driver's number is required" },
                {
                  pattern: /^[0-9]{10}$/,
                  message: "Number must be exactly 10 digits",
                },
              ]}
              normalize={normalizeDigits}
            >
              <Input
                type="text"
                maxLength={10}
                className="w-full h-9"
                style={{ width: "400px" }}
                onKeyPress={(e) => {
                  if (!/^\d$/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </Form.Item>
            {/* Driver Details End */}

            {/* Extra Info Fields */}
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
                    <Form.Item
                      name={info}
                      rules={[
                        {
                          pattern: /^[A-Z0-9]+$/,
                          message: "Only uppercase letters and numbers allowed",
                        },
                      ]}
                      normalize={normalizeAlphaNum}
                    >
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
              <Button htmlType="submit" type="primary" loading={isSubmitting}>
                Submit
              </Button>
            </div>
          </Form>
        </ConfigProvider>
      </div>
    </div>
  );
};
