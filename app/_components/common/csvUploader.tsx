"use client";

import {
  useGetTripVehiclesQuery,
  useLazyGetAllVehiclesQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import { RootState } from "@/app/_globalRedux/store";
import { getLatLong } from "@/app/helpers/api";
import { checkLatLngExists } from "@/app/helpers/checkIfLatLngExists";
import { getDateRange } from "@/app/helpers/getDateRange";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloudUploadOutlined,
} from "@ant-design/icons";
import { Button, List, message, Modal, Typography } from "antd";
import dayjs from "dayjs";
import React, { useRef, useState } from "react";
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";

const { Title, Text } = Typography;

export const CsvUploader = ({
  setCsvData,
}: {
  setCsvData: React.Dispatch<React.SetStateAction<Record<string, string>[]>>;
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Redux state for auth data
  const { groupId, userId, extra, userName } = useSelector(
    (state: RootState) => state.auth,
  );

  // Direct API call function for trip creation
  const directCreateTrip = async (tripData: any, token: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_TRACKING_DASHBOARD;
      const url = `${baseUrl}/savetripbyvehicle`;
      const urlWithToken = `${url}?token=${token}`;

      const response = await fetch(urlWithToken, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tripData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          error: {
            message: `HTTP ${response.status}: ${errorText}`,
            status: response.status,
          },
        };
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : "Network Error",
        },
      };
    }
  };

  const [isCreateTripLoading, setIsCreateTripLoading] = useState(false);

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
      skip: !groupId || !userId,
      pollingInterval: 30000, // Refresh every 30 seconds
    },
  );

  // Helper function to check if vehicle is on trip
  const isVehicleOnTrip = (vehicleId: number) => {
    if (!tripVehiclesData?.list) return false;

    const vehicleOnTrip = tripVehiclesData.list.find(
      (trip) => trip.sys_service_id === vehicleId,
    );

    return !!vehicleOnTrip;
  };

  // Vehicle list query to get vehicle IDs
  const [getAllVehicles] = useLazyGetAllVehiclesQuery();

  // Function to fetch POI data using the existing API
  const fetchPOIData = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_MASTER_DATA;
      const url = `${baseUrl}/poilist?groupid=${groupId}&userid=${userId}`;

      const response = await fetch(url);
      if (!response.ok) {
        console.error("❌ POI API failed with status:", response.status);
        const errorText = await response.text();
        console.error("❌ POI API error response:", errorText);
        throw new Error(
          `Failed to fetch POI data: ${response.status} - ${errorText}`,
        );
      }

      const poiData = await response.json();
      const poiList = poiData?.list || poiData?.data || [];

      return poiList;
    } catch (error) {
      return [];
    }
  };

  // Function to find POI by name
  const findPOIByName = (poiList: any[], locationName: string) => {
    if (!locationName || !poiList.length) return null;

    const normalizedName = locationName.trim().toUpperCase();

    let poi = poiList.find(
      (p: any) =>
        p.poi_name?.toUpperCase() === normalizedName ||
        p.location?.toUpperCase() === normalizedName ||
        p.name?.toUpperCase() === normalizedName ||
        p.address?.toUpperCase() === normalizedName ||
        p.city?.toUpperCase() === normalizedName,
    );

    if (poi) {
      return poi;
    }

    // If no exact match, try partial match (case insensitive)
    poi = poiList.find(
      (p: any) =>
        p.poi_name?.toUpperCase().includes(normalizedName) ||
        p.location?.toUpperCase().includes(normalizedName) ||
        p.name?.toUpperCase().includes(normalizedName) ||
        p.address?.toUpperCase().includes(normalizedName) ||
        p.city?.toUpperCase().includes(normalizedName) ||
        normalizedName.includes(p.poi_name?.toUpperCase()) ||
        normalizedName.includes(p.location?.toUpperCase()) ||
        normalizedName.includes(p.name?.toUpperCase()) ||
        normalizedName.includes(p.address?.toUpperCase()) ||
        normalizedName.includes(p.city?.toUpperCase()),
    );

    if (poi) {
      return poi;
    }

    return null;
  };

  // Function to calculate distance between two coordinates
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return Math.round(distance);
  };

  // Message API for notifications
  const [messageApi, contextHolder] = message.useMessage();

  // State for processing and results modal
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tripResults, setTripResults] = useState<{
    successful: Array<{
      vehicleNo: string;
      customerName: string;
      tripId?: number;
    }>;
    failed: Array<{ vehicleNo: string; customerName: string; error: string }>;
    totalProcessed: number;
  }>({
    successful: [],
    failed: [],
    totalProcessed: 0,
  });

  const getAddressLatLong = async (address: string) => {
    if (!address || address.trim() === "") return address;

    const isLatLongExists = checkLatLngExists(address);
    if (isLatLongExists) return address;

    try {
      const result = await getLatLong({
        groupId,
        userId,
        address,
      });

      if (result && result.includes("##") && result !== address) {
        return result;
      } else {
        return `${address}##28.6139##77.2090`;
      }
    } catch (error) {
      return `${address}##28.6139##77.2090`;
    }
  };

  const shouldIgnoreRow = (row: Record<string, string>): boolean => {
    const vehicleNo = row["VEHICLE NO"] || row["VEHICLENO"] || "";
    const clientName = row["CLIENT NAME"] || row["CLIENTNAME"] || "";
    const from = row["FROM"] || "";
    const to = row["TO"] || "";

    // Ignore rows with missing essential data
    if (!vehicleNo || !clientName || !from || !to) return true;

    // Ignore header/section rows
    const ignorableTexts = [
      "DAILY DISPATCH REPORT",
      "TODAY NORTH DISPATCH",
      "TODAY INDORE DISPATCH",
      "TODAY GUJARAT DISPATCH",
      "TODAY MUMBAI DISPATCH",
      "GRAND TOTAL",
      "TOTAL",
      "SR NO",
      "DISPATCH DATE",
    ];

    const rowText = Object.values(row).join(" ").toUpperCase();
    return ignorableTexts.some((text) => rowText.includes(text));
  };

  const createTripFromExcel = async (
    row: Record<string, string>,
    vehicleList: any[],
    poiList: any[],
    retryCount = 0,
    tripIndex = 0,
  ) => {
    const maxRetries = 1; // Reduced to 1 retry for faster processing
    try {
      // Map Excel fields to trip format
      const vehicleNo = row["VEHICLE NO"] || row["VEHICLENO"] || "";
      const customerName = row["CLIENT NAME"] || row["CLIENTNAME"] || "";
      const source = row["FROM"] || "";
      const destination = row["TO"] || "";
      const weight = row["WEIGHT"] || "";
      const dispatchDate = row["DISPATCH DATE"] || row["DISPATCHDATE"] || "";

      // Find vehicle ID from vehicle number
      const vehicle = vehicleList.find(
        (v: any) =>
          v.veh_reg === vehicleNo ||
          v.vehReg === vehicleNo ||
          v.lorry_no === vehicleNo ||
          v.vehicleNumber === vehicleNo,
      );

      if (!vehicle) {
        throw new Error(
          `Vehicle not found: ${vehicleNo}. Please check if the vehicle number is correct.`,
        );
      }

      const vehicleId = vehicle.id || vehicle.vId || vehicle.sys_service_id;

      // Check if vehicle is already on a trip
      if (isVehicleOnTrip(vehicleId)) {
        return {
          success: false,
          vehicleNo,
          customerName,
          error: "Vehicle is already on an active trip",
          result: null,
          skipRetry: true,
        };
      }

      // Parse date - Handle both date and time from Excel
      let tripDate;
      if (dispatchDate) {
        // Handle Excel serial date format (like 45971.958333333336 which includes time)
        if (!isNaN(Number(dispatchDate))) {
          // Excel date serial number (days since 1900-01-01) with time as decimal
          const excelEpoch = new Date(1900, 0, 1);
          const excelDate = new Date(
            excelEpoch.getTime() +
              (Number(dispatchDate) - 2) * 24 * 60 * 60 * 1000,
          );
          tripDate = dayjs(excelDate); // Keep the exact time from Excel
        } else {
          // Handle text format like "11/10/2025 23:00"
          if (dispatchDate.includes("/") && dispatchDate.includes(":")) {
            // Format: MM/DD/YYYY HH:mm or DD/MM/YYYY HH:mm
            tripDate = dayjs(dispatchDate, [
              "MM/DD/YYYY HH:mm:ss",
              "DD/MM/YYYY HH:mm:ss",
              "MM/DD/YYYY HH:mm",
              "DD/MM/YYYY HH:mm",
            ]);
          } else if (dispatchDate.includes("-")) {
            // Handle DD-MM-YYYY format (legacy)
            const dateParts = dispatchDate.split("-");
            if (dateParts.length === 3) {
              tripDate = dayjs(
                `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`,
                "YYYY-MM-DD",
              ).startOf("day");
            }
          } else {
            tripDate = dayjs(dispatchDate);
          }
        }
      }

      if (!tripDate || !tripDate.isValid()) {
        tripDate = dayjs(); // Use current date and time if parsing fails
      }

      // Find POI matches for source and destination
      const sourcePOI = findPOIByName(poiList, source);
      const destinationPOI = findPOIByName(poiList, destination);

      // Format source with coordinates if POI found
      let sourceWithCoords = source;
      if (sourcePOI) {
        const sourceLat =
          sourcePOI.lat || sourcePOI.latitude || sourcePOI.gps_latitude;
        const sourceLng =
          sourcePOI.lng || sourcePOI.longitude || sourcePOI.gps_longitude;
        if (sourceLat && sourceLng) {
          sourceWithCoords = `${
            sourcePOI.poi_name || sourcePOI.location || sourcePOI.name
          }##${sourceLat}##${sourceLng}`;
        }
      }

      // Format destination with coordinates if POI found
      let destinationWithCoords = destination;
      if (destinationPOI) {
        const destLat =
          destinationPOI.lat ||
          destinationPOI.latitude ||
          destinationPOI.gps_latitude;
        const destLng =
          destinationPOI.lng ||
          destinationPOI.longitude ||
          destinationPOI.gps_longitude;
        if (destLat && destLng) {
          destinationWithCoords = `${
            destinationPOI.poi_name ||
            destinationPOI.location ||
            destinationPOI.name
          }##${destLat}##${destLng}`;
        }
      }

      // Calculate distance if both POIs found
      let calculatedDistance = 0;
      if (sourcePOI && destinationPOI) {
        const sourceLat =
          sourcePOI.lat || sourcePOI.latitude || sourcePOI.gps_latitude;
        const sourceLng =
          sourcePOI.lng || sourcePOI.longitude || sourcePOI.gps_longitude;
        const destLat =
          destinationPOI.lat ||
          destinationPOI.latitude ||
          destinationPOI.gps_latitude;
        const destLng =
          destinationPOI.lng ||
          destinationPOI.longitude ||
          destinationPOI.gps_longitude;

        if (sourceLat && sourceLng && destLat && destLng) {
          const straightLineDistance = calculateDistance(
            sourceLat,
            sourceLng,
            destLat,
            destLng,
          );
          // Apply route factor to approximate road distance (common factor is 1.25)
          calculatedDistance = Math.round(straightLineDistance * 1.25);
        }
      }

      // Calculate journey hours for ETA
      const journeyHours =
        calculatedDistance > 0
          ? Math.ceil((calculatedDistance / 60) * 2.25)
          : 24;

      // Prepare trip data object matching manual form format exactly
      const tripData = {
        CustomerName: customerName,
        Destination: destinationWithCoords, // Format: "LocationName##Lat##Lng"
        DestinationOr: "",
        DriverName: "", // Not required
        ETA: tripDate.add(journeyHours, "hour").format("YYYY-MM-DD HH:mm:ss"), // Add journey hours to dispatch date/time
        Source: sourceWithCoords, // Format: "LocationName##Lat##Lng"
        SourceOr: "",
        Via1: "",
        Via2: "",
        Via3: "",
        Via4: "",
        Via1Or: "",
        Via2Or: "",
        Via3Or: "",
        Via4Or: "",
        temp_range_to: "",
        temp_range_from: "",
        cargo_weight: weight,
        challan_date: tripDate.format("YYYY-MM-DD HH:mm"), // Use actual dispatch date and time
        challan_no: Math.floor(Math.random() * 100000).toString(),
        destination_party_name: customerName, // Same as customer name from Excel
        journey_KM: calculatedDistance.toString(), // Use calculated distance from POI matching
        journey_hours: journeyHours.toString(), // Use calculated journey hours
        lorry_no: vehicleNo,
        lorry_type: "", // Empty like in manual form when no trip_type is selected
        sys_service_id: vehicleId.toString(), // Vehicle ID from vehicle lookup
        sys_user_id: userId.toString(), // Convert to string like successful payload
        to_and_fro: "0", // Dynamic trip type
        viaone_halthr_input: "",
        viaone_party_name: "",
        viatwo_halthr_input: "",
        viatwo_party_name: "",
        viathree_halthr_input: "",
        viathree_party_name: "",
        viafour_halthr_input: "",
        viafour_party_name: "",
        createdBy: userName || "",
      };

      // Create the trip
      let result: any;
      try {
        // Build extraInfoData like TripForm does with proper error handling
        let extraInfoData = {};
        try {
          const extraInfoArray = extra ? JSON.parse(extra || "") : [];
          if (Array.isArray(extraInfoArray)) {
            extraInfoData = extraInfoArray.reduce(
              (acc: Record<string, string>, curr: string) => ({
                ...acc,
                [curr]: "",
              }),
              {},
            );
          }
        } catch (error) {
          extraInfoData = {};
        }

        // Structure the payload exactly like RTK Query mutation does
        const requestPayload = {
          ...tripData,
          extraInfo: JSON.stringify(extraInfoData),
        };

        // ACTUAL API CALL - ENABLED:
        setIsCreateTripLoading(true);
        const apiCallPromise = directCreateTrip(requestPayload, groupId);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  `API call timeout for vehicle ${vehicleNo} after 15 seconds - likely server-side issue`,
                ),
              ),
            15000,
          ),
        );
        result = await Promise.race([apiCallPromise, timeoutPromise]);
        setIsCreateTripLoading(false);
      } catch (error) {
        result = {
          error: {
            message: error instanceof Error ? error.message : "Unknown error",
            data: error,
          },
        };
      }

      const isSuccess =
        !result.error &&
        // Format 1: New API response format
        ((result.status === true && result.TripSaved === "Yes") ||
          // Format 2: result.data.list (RTK Query format)
          (result.data &&
            result.data.list &&
            result.data.list.length > 0 &&
            result.data.list[0].trip_id) ||
          // Format 3: Direct API response with list array
          (result.data &&
            Array.isArray(result.data) &&
            result.data.length > 0 &&
            result.data[0].trip_id) ||
          // Format 4: Direct list array in result
          (Array.isArray(result) && result.length > 0 && result[0].trip_id));
      let errorMessage: string | null = null;

      if (result.error) {
        // Handle different error formats using same approach as TripForm
        const error = result.error as any;
        if (typeof error === "string") {
          errorMessage = error;
        } else if (error?.data?.message) {
          errorMessage = error.data.message;
        } else if (error?.message) {
          errorMessage = error.message;
        } else if (error?.data) {
          errorMessage =
            typeof error.data === "string"
              ? error.data
              : JSON.stringify(error.data);
        } else {
          errorMessage = JSON.stringify(error);
        }

        // Special handling for "Trip already exists" - treat as informational, not error
        if (errorMessage && errorMessage.includes("Trip already exists")) {
          return {
            success: false,
            vehicleNo,
            customerName,
            error: "Trip already exists for this vehicle",
            result,
            skipRetry: true,
          };
        }

        const isTimeoutError =
          errorMessage !== null &&
          (errorMessage.includes("timeout") ||
            errorMessage.includes("TIMEOUT") ||
            errorMessage.includes("AbortError") ||
            errorMessage.includes("signal is aborted") ||
            errorMessage.includes("server-side issue"));

        if (
          isTimeoutError &&
          retryCount < maxRetries &&
          errorMessage !== null &&
          !errorMessage.includes("Trip already exists")
        ) {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Reduced wait time to 2 seconds
          return createTripFromExcel(
            row,
            vehicleList,
            poiList,
            retryCount + 1,
            tripIndex,
          );
        }
      }

      if (isSuccess) {
        let tripId;

        // Extract tripId from different response formats
        if (result.status === true && result.TripSaved === "Yes") {
          tripId = result.data || "Generated";
        } else if (result.data && result.data.list && result.data.list[0]) {
          tripId = result.data.list[0].trip_id;
        } else if (
          result.data &&
          Array.isArray(result.data) &&
          result.data[0]
        ) {
          tripId = result.data[0].trip_id;
        } else if (Array.isArray(result) && result[0]) {
          tripId = result[0].trip_id;
        }

        return {
          success: true,
          vehicleNo,
          customerName,
          error: null,
          result,
          tripId,
        };
      }

      return {
        success: false,
        vehicleNo,
        customerName,
        error: errorMessage || "Failed to create trip - no trip ID returned",
        result,
      };
    } catch (error) {
      // Check if it's a timeout/abort error and retry if possible
      const errorMessage = String(error);
      const isTimeoutError =
        errorMessage.includes("timeout") ||
        errorMessage.includes("abort") ||
        errorMessage.includes("TIMEOUT") ||
        errorMessage.includes("AbortError");

      if (isTimeoutError && retryCount < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
        return createTripFromExcel(
          row,
          vehicleList,
          poiList,
          retryCount + 1,
          tripIndex,
        );
      }

      return {
        success: false,
        vehicleNo: row["VEHICLE NO"] || "Unknown",
        customerName: row["CLIENT NAME"] || "Unknown",
        error: String(error),
        result: null,
      };
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files) return;

    const file = files[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      setIsProcessing(true);

      try {
        let jsonData: Record<string, string>[] = [];

        if (fileName.endsWith(".csv")) {
          // Handle CSV file (existing functionality)
          const reader = new FileReader();
          reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text !== "string") return;
            setCsvData(csvToJson(text));
            setIsProcessing(false);
          };
          reader.readAsText(file);
        } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
          jsonData = await excelToJson(file);
          setCsvData(jsonData);

          // Check authentication
          if (!groupId || !userId) {
            messageApi.error("Authentication required. Please login again.");
            setIsProcessing(false);
            return;
          }

          if (jsonData.length > 0) {
            // Fetch vehicle list and POI data
            let vehicleList: any[] = [];
            let poiList: any[] = [];

            try {
              // Fetch vehicles
              const vehicleResponse = await getAllVehicles({
                token: groupId,
              }).unwrap();
              vehicleList = vehicleResponse?.list || [];

              if (vehicleList.length === 0) {
                throw new Error("No vehicles found in your account");
              }

              // Fetch POI data
              try {
                poiList = await fetchPOIData();
              } catch (poiError) {
                poiList = [];
              }
            } catch (error) {
              messageApi.error(
                "Failed to fetch vehicle list or POI data. Please try again.",
              );
              setIsProcessing(false);
              return;
            }

            const successful: Array<{
              vehicleNo: string;
              customerName: string;
              tripId?: number;
            }> = [];
            const failed: Array<{
              vehicleNo: string;
              customerName: string;
              error: string;
            }> = [];

            // Process each row to create trips
            for (let i = 0; i < jsonData.length; i++) {
              const row = jsonData[i];

              try {
                const result = await createTripFromExcel(
                  row,
                  vehicleList,
                  poiList,
                  0,
                  i,
                );

                if (result.success) {
                  successful.push({
                    vehicleNo: result.vehicleNo,
                    customerName: result.customerName,
                    tripId: result.tripId,
                  });
                } else {
                  failed.push({
                    vehicleNo: result.vehicleNo,
                    customerName: result.customerName,
                    error: result.error || "Unknown error",
                  });
                }
              } catch (error) {
                failed.push({
                  vehicleNo: row["VEHICLE NO"] || "Unknown",
                  customerName: row["CLIENT NAME"] || "Unknown",
                  error: error instanceof Error ? error.message : String(error),
                });
              }
            }

            // Set results and show modal
            setTripResults({
              successful,
              failed,
              totalProcessed: jsonData.length,
            });
            setIsModalVisible(true);

            // Show simple success message with count
            messageApi.success(
              `Processed ${jsonData.length} vehicles: ${successful.length} successful`,
              3,
            );
          }

          setIsProcessing(false);
        }
      } catch (error) {
        messageApi.error(
          "Failed to process the file. Please check the file format and try again.",
        );
        setIsProcessing(false);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Helper function to handle quoted commas in CSV
  function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes; // Toggle in/out of quotes
      } else if (char === "," && !inQuotes) {
        // Only split if not within quotes
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    // Push the last value
    result.push(current.trim());
    return result;
  }

  function csvToJson(csv: string): Record<string, string>[] {
    const lines: string[] = csv.split("\n");
    const headers: string[] = parseCsvLine(lines[0]);

    return lines.slice(1, lines.length - 1).map((line) => {
      const values: string[] = parseCsvLine(line);
      return headers.reduce(
        (obj, header, index) => {
          obj[header.trim()] = values[index]?.trim() || "";
          return obj;
        },
        {} as Record<string, string>,
      );
    });
  }

  // Function to convert Excel file to JSON
  const excelToJson = (file: File): Promise<Record<string, string>[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });

          // Get the first worksheet
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];

          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
          }) as string[][];

          if (jsonData.length < 2) {
            resolve([]);
            return;
          }

          // Find the actual header row (look for "VEHICLE NO" or similar)
          let headerRowIndex = -1;
          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (
              row.some(
                (cell) =>
                  String(cell).toUpperCase().includes("VEHICLE") ||
                  String(cell).toUpperCase().includes("CLIENT"),
              )
            ) {
              headerRowIndex = i;
              break;
            }
          }

          if (headerRowIndex === -1) {
            resolve([]);
            return;
          }

          // Get headers from the found header row
          const headers = jsonData[headerRowIndex];

          // Convert data rows to object format
          const result = jsonData
            .slice(headerRowIndex + 1)
            .map((row) => {
              return headers.reduce(
                (obj, header, index) => {
                  obj[header?.toString().trim() || ""] =
                    row[index]?.toString().trim() || "";
                  return obj;
                },
                {} as Record<string, string>,
              );
            })
            .filter((row) => {
              // Filter out empty rows and irrelevant rows
              return !shouldIgnoreRow(row);
            });

          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read Excel file"));
      reader.readAsArrayBuffer(file);
    });
  };

  return (
    <div>
      {contextHolder}
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        id="csvInput"
        className="hidden"
        onChange={handleFileUpload}
        ref={fileInputRef}
        disabled={isProcessing || isCreateTripLoading}
      />
      <label
        htmlFor="csvInput"
        className={`text-xl text-primary-green cursor-pointer hover:bg-neutral-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors duration-300 ${
          isProcessing || isCreateTripLoading
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
      >
        <CloudUploadOutlined />
      </label>

      {/* Results Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <CheckCircleOutlined className="text-green-500" />
            <span>Trip Creation Results</span>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={600}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setIsModalVisible(false)}
          >
            Close
          </Button>,
        ]}
      >
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <Title level={5} className="mb-2">
              Summary
            </Title>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {tripResults.totalProcessed}
                </div>
                <div className="text-sm text-gray-600">Total Processed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {tripResults.successful.length}
                </div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {tripResults.failed.length}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>
          </div>

          {/* Successful Trips */}
          {tripResults.successful.length > 0 && (
            <div>
              <Title
                level={5}
                className="text-green-600 flex items-center gap-2"
              >
                <CheckCircleOutlined />
                Successful Trips ({tripResults.successful.length})
              </Title>
              <List
                size="small"
                bordered
                dataSource={tripResults.successful}
                renderItem={(item) => (
                  <List.Item>
                    <div className="w-full">
                      <div className="flex justify-between items-center">
                        <span>
                          <strong>Vehicle:</strong> {item.vehicleNo}
                        </span>
                        <span>
                          <strong>Customer:</strong> {item.customerName}
                        </span>
                      </div>
                      {item.tripId && (
                        <div className="text-green-600 text-sm mt-1">
                          ✅ <strong>Trip ID:</strong> {item.tripId}
                        </div>
                      )}
                    </div>
                  </List.Item>
                )}
                style={{ maxHeight: "200px", overflowY: "auto" }}
              />
            </div>
          )}

          {/* Failed Trips */}
          {tripResults.failed.length > 0 && (
            <div>
              <Title level={5} className="text-red-600 flex items-center gap-2">
                <CloseCircleOutlined />
                Failed Trips ({tripResults.failed.length})
              </Title>
              <List
                size="small"
                bordered
                dataSource={tripResults.failed}
                renderItem={(item) => (
                  <List.Item>
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-1">
                        <span>
                          <strong>Vehicle:</strong> {item.vehicleNo}
                        </span>
                        <span>
                          <strong>Customer:</strong> {item.customerName}
                        </span>
                      </div>
                      <Text type="danger" className="text-xs">
                        <strong>Error:</strong> {item.error}
                      </Text>
                    </div>
                  </List.Item>
                )}
                style={{ maxHeight: "200px", overflowY: "auto" }}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
