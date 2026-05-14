'use client';
import React from 'react';
import { VideoCameraFilled } from '@ant-design/icons';
import { VideoAlarmsRecord } from '@/app/_globalRedux/services/types/post/getVideoAlerts';
import { getAlarmName, VideoAlarmType } from '@/app/helpers/getVideoAlertName';

export const VideoNotificationCard = ({ alarm }: { alarm: VideoAlarmsRecord }) => {
	// Format timestamp for display
	const formatDateTime = (timestamp: string) => {
		if (!timestamp) return '';
		const date = new Date(timestamp);
		return date.toLocaleString();
	};

	return (
		<div>
			<div className='flex items-center gap-3'>
				<div className='bg-orange-500 px-3 py-2 rounded-full'>
					<div className='text-lg text-white'>
						<VideoCameraFilled />
					</div>
				</div>
				<div className='flex-1'>
					<p className='text-base font-semibold text-gray-800'>{getAlarmName(alarm.alarmType as VideoAlarmType)}</p>
					<p className='text-sm text-gray-600'>{alarm.deviceName}</p>
					<p className='text-xs text-gray-500'>{formatDateTime(alarm.alarmTs)}</p>
				</div>
			</div>
		</div>
	);
};

// Example usage component
export default function VideoNotifications({ alerts }: { alerts: VideoAlarmsRecord[] }) {
	return (
		<div className='max-w-md mx-auto bg-white rounded-lg shadow-sm'>
			<div className='flex justify-between items-center p-4 py-6 border-b border-gray-200'>
				<h2 className='text-lg font-semibold'>Alert Notifications</h2>
				<span className='bg-red-500 text-white text-xs px-2 py-1 rounded-full'>{alerts.length}</span>
			</div>

			<div className='max-h-96 overflow-y-auto'>
				{alerts.map((alarm) => (
					<VideoNotificationCard key={alarm.id} alarm={alarm} />
				))}
			</div>
		</div>
	);
}
