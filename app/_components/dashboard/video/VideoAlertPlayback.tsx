import React, { useEffect } from 'react';

import { useGetMettaxAlarmFileMutation } from '@/app/_globalRedux/services/mettax';
import { VideoAlarmsRecord } from '@/app/_globalRedux/services/types/post/getVideoAlerts';
import { Spin, Tabs } from 'antd';
import Image from 'next/image';
import { useIndiaGetMettaxAlarmFileMutation } from '@/app/_globalRedux/services/indiaMettax';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';

function VideoAlertPlayback({ selectedAlarm }: { selectedAlarm: VideoAlarmsRecord }) {
	const { userId } = useSelector((state: RootState) => state.auth);
	const [getAlarmFileTrigger, { data: alarmFileData, isLoading: isAlarmFileLoading }] = useGetMettaxAlarmFileMutation();
	const [getIndiaAlarmFileTrigger, { data: indiaAlarmFileData, isLoading: isIndiaAlarmFileLoading }] = useIndiaGetMettaxAlarmFileMutation();

	useEffect(() => {
		if (Number(userId) === 5360) {
			if (selectedAlarm) {
				getIndiaAlarmFileTrigger({
					alarmId: selectedAlarm.id,
				});
			}
		} else {
			if (selectedAlarm) {
				getAlarmFileTrigger({
					alarmId: selectedAlarm.id,
				});
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedAlarm]);

	return (
		<div>
			{(Number(userId) === 5360 && indiaAlarmFileData && !isIndiaAlarmFileLoading) || (alarmFileData && !isAlarmFileLoading) ? (
				<Tabs
					defaultActiveKey=''
					items={[
						{
							label: 'Snapshots',
							key: 'alarm_snapshots',
							children: (
								<>
									<div className='grid grid-cols-2 gap-4'>
										{Number(userId) === 5360
											? indiaAlarmFileData &&
											  indiaAlarmFileData.data
													?.filter((file) => file.fileType === '00')
													?.map((file, index) => (
														<div key={index} className='col-span-1'>
															<Image src={file.fileUrl} width={500} height={500} alt={file.alarmId} />
														</div>
													))
											: alarmFileData &&
											  alarmFileData.data
													?.filter((file) => file.fileType === '00')
													?.map((file, index) => (
														<div key={index} className='col-span-1'>
															<Image src={file.fileUrl} width={500} height={500} alt={file.alarmId} />
														</div>
													))}
									</div>
								</>
							),
						},
						{
							label: 'Playback',
							key: 'alarm_playback',
							children: (
								<div className='flex justify-center items-center bg-black min-h-[352px]'>
									{isAlarmFileLoading ? (
										<div className='text-white'>
											<Spin spinning size='large' />
										</div>
									) : Number(userId) === 5360 ? (
										indiaAlarmFileData &&
										indiaAlarmFileData.data
											?.filter((file) => file.fileType === '02')
											?.map((file, index) => (
												<div key={index}>
													<video width={'100%'} controls>
														<source src={file.fileUrl} type='video/mp4' />
													</video>
												</div>
											))
									) : (
										alarmFileData &&
										alarmFileData.data
											?.filter((file) => file.fileType === '02')
											?.map((file, index) => (
												<div key={index}>
													<video width={'100%'} controls>
														<source src={file.fileUrl} type='video/mp4' />
													</video>
												</div>
											))
									)}
								</div>
							),
						},
					]}
				/>
			) : null}
		</div>
	);
}

export default VideoAlertPlayback;
