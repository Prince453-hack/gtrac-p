import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface FuelDataItem {
  id: number;
  sys_service_id: number;
  gps_time: string;
  rec_time: string;
  rv: number;
  av: number;
  timeinepoc: number;
  odometer: number;
  gps_latitude: string;
  gps_longitude: string;
  filling: number;
  fillingtheftaddress: string;
  fueltype: string;
}

interface FuelDataResponse {
  list: FuelDataItem[];
}

interface FuelVehicleDetailsState {
  fuelData: FuelDataItem[];
  selectedVehicle: string | number | null;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  filters: {
    sys_service_id: string | number | null;
    userid: string | number | null;
    TypeFT: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: FuelVehicleDetailsState = {
  fuelData: [],
  selectedVehicle: null,
  dateRange: {
    startDate: "",
    endDate: "",
  },
  filters: {
    sys_service_id: null,
    userid: null,
    TypeFT: 1,
  },
  loading: false,
  error: null,
};

const fuelVehicleDetailsSlice = createSlice({
  name: "fuelVehicleDetails",
  initialState,
  reducers: {
    setFuelData: (state, action: PayloadAction<FuelDataItem[]>) => {
      state.fuelData = action.payload;
      state.error = null;
    },
    setSelectedVehicle: (
      state,
      action: PayloadAction<string | number | null>
    ) => {
      state.selectedVehicle = action.payload;
    },
    setDateRange: (
      state,
      action: PayloadAction<{ startDate: string; endDate: string }>
    ) => {
      state.dateRange = action.payload;
    },
    setFilters: (
      state,
      action: PayloadAction<Partial<FuelVehicleDetailsState["filters"]>>
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearFuelData: (state) => {
      state.fuelData = [];
      state.error = null;
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.dateRange = initialState.dateRange;
      state.selectedVehicle = null;
    },
  },
});

export const {
  setFuelData,
  setSelectedVehicle,
  setDateRange,
  setFilters,
  setLoading,
  setError,
  clearFuelData,
  resetFilters,
} = fuelVehicleDetailsSlice.actions;

export default fuelVehicleDetailsSlice.reducer;

// Selectors
export const selectFuelData = (state: {
  fuelVehicleDetails: FuelVehicleDetailsState;
}) => state.fuelVehicleDetails.fuelData;

export const selectSelectedVehicle = (state: {
  fuelVehicleDetails: FuelVehicleDetailsState;
}) => state.fuelVehicleDetails.selectedVehicle;

export const selectDateRange = (state: {
  fuelVehicleDetails: FuelVehicleDetailsState;
}) => state.fuelVehicleDetails.dateRange;

export const selectFilters = (state: {
  fuelVehicleDetails: FuelVehicleDetailsState;
}) => state.fuelVehicleDetails.filters;

export const selectLoading = (state: {
  fuelVehicleDetails: FuelVehicleDetailsState;
}) => state.fuelVehicleDetails.loading;

export const selectError = (state: {
  fuelVehicleDetails: FuelVehicleDetailsState;
}) => state.fuelVehicleDetails.error;
