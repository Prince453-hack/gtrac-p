import { AlarmType } from '../_globalRedux/services/types/post/videoAlerts';

// "alarmName": "Smoking"
export const getAlertsWithVideoPlayback = ({ alarmType }: { alarmType: AlarmType }) => {
	let isAlertsWithVideoPlayback = false;
	if (
		alarmType === 'seatBelt' ||
		alarmType === 'handheldPhoneCall' ||
		alarmType === 'smoking' ||
		alarmType === 'fatigueWarn' ||
		alarmType === 'forwardCollisionWarning' ||
		alarmType === 'longTimeWithoutLookingAhead' ||
		alarmType === 'pedestrianBang'
	) {
		isAlertsWithVideoPlayback = true;
	}
	return isAlertsWithVideoPlayback;
};
