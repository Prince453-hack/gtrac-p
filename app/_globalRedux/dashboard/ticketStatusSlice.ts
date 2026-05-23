import { createSlice } from "@reduxjs/toolkit";

interface TicketStatusState {
  onlyTicketEnabled: boolean;
}

const initialState: TicketStatusState = {
  onlyTicketEnabled: false,
};

export const ticketStatusSlice = createSlice({
  name: "ticketStatus",
  initialState,
  reducers: {
    toggleTicketFilter: (state) => {
      state.onlyTicketEnabled = !state.onlyTicketEnabled;
    },
  },
});

export const { toggleTicketFilter } = ticketStatusSlice.actions;
export default ticketStatusSlice.reducer;
