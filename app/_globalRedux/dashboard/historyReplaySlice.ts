import { createSlice } from '@reduxjs/toolkit';

type HistoryReplay = {
	isHistoryReplayPlaying: boolean;
	isHistoryReplayMode: boolean;
	currentPathArrayIndex: number;
	manualPath: number;
	playTimeInMilliseconds: number;
	historyReplayInterval: NodeJS.Timeout | null;
	justStartedPlaying: boolean;
};

const initialState: HistoryReplay = {
	isHistoryReplayPlaying: false,
	currentPathArrayIndex: 0,
	manualPath: 0,
	playTimeInMilliseconds: 200,
	isHistoryReplayMode: true,
	historyReplayInterval: null,
	justStartedPlaying: false,
};

const historyReplaySlice = createSlice({
	name: 'history-replay-slice',
	initialState,
	reducers: {
		setHistoryReplayPlayPause: (state, action: { payload: boolean; type: string }) => {
			state.isHistoryReplayPlaying = action.payload;
			return state;
		},
		setHistoryReplayModeToggle: (state, action: { payload: boolean; type: string }) => {
			state.isHistoryReplayMode = action.payload;
			return state;
		},
		setCurrentPathArrayIndex: (state, action: { payload: number; type: string }) => {
			state.currentPathArrayIndex = action.payload;
			return state;
		},
		setIncrement: (state, action: { payload: undefined; type: string }) => {
			state.currentPathArrayIndex++;
			return state;
		},
		setHistoryReplayPathManual: (state, action: { payload: number; type: string }) => {
			state.manualPath = action.payload;
			return state;
		},
		setHistoryReplayInterval: (state, action: { payload: NodeJS.Timeout; type: string }) => {
			state.historyReplayInterval = action.payload;

			return state;
		},
		stopHistoryReplayInterval: (state, action: { payload: undefined; type: string }) => {
			if (state.historyReplayInterval) {
				clearInterval(state.historyReplayInterval);
				state.historyReplayInterval = null;
			}
			return state;
		},
		setHistoryReplayJustStartedPlaying: (state, action: { payload: boolean; type: string }) => {
			state.justStartedPlaying = action.payload;
			return state;
		},
		setStopHistoryReplay: (state, action: { payload: undefined; type: string }) => {
			state.isHistoryReplayPlaying = false;
			state.currentPathArrayIndex = 0;
			state.manualPath = 0;

			if (state.historyReplayInterval) {
				clearInterval(state.historyReplayInterval);
				state.historyReplayInterval = null;
			}
			return state;
		},
		resetHistoryReplay: (state) => {
			state = initialState;
			return state;
		},
	},
});
export const {
	setHistoryReplayPlayPause,
	setStopHistoryReplay,
	setIncrement,
	setHistoryReplayModeToggle,
	setHistoryReplayInterval,
	stopHistoryReplayInterval,
	setHistoryReplayPathManual,
	setCurrentPathArrayIndex,
	resetHistoryReplay,
	setHistoryReplayJustStartedPlaying,
} = historyReplaySlice.actions;
export default historyReplaySlice.reducer;
