import React, { Dispatch, useEffect, useState } from 'react';
import { Circle, Polygon, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button, Input, Modal } from 'antd';
import { EditFilled } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import { useLazyEditPOIQuery } from '@/app/_globalRedux/services/trackingDashboard';
import { POI } from '@/app/_globalRedux/dashboard/poiSlice';

export const ReactLeafletPoiMarkers = () => {
	const poiData = useSelector((state: RootState) => state.poiData);
	const [hover, setHover] = useState(-1);
	const [poiOpenIndex, setPoiIndex] = useState(-1);

	const togglePoiEditModal = (index: number) => {
		setPoiIndex(index);
	};

	return (
		<>
			{/* Render POI Circles */}
			{poiData.poi &&
				Array.isArray(poiData.poi) &&
				poiData.poi.length > 0 &&
				poiData.poi
					.filter((item) => poiData.selectedPOI.id === -1 || item.id === poiData.selectedPOI.id)
					.map((item, index) => (
						<Circle
							key={index}
							center={[item.gps_latitude, item.gps_longitude]}
							radius={item.gps_radius}
							pathOptions={{ color: '#04A144', fillOpacity: 0.3, weight: 2 }}
							eventHandlers={{
								mouseover: () => setHover(index),
								mouseout: () => setHover(-1),
							}}
						>
							<Tooltip direction='top' offset={[0, -10]} opacity={1} permanent>
								<div style={{ display: 'flex', alignItems: 'center' }}>
									<span>{item.name.substring(0, 20)}</span>
									{/* <EditFilled style={{ marginLeft: 5, cursor: 'pointer' }} onClick={() => togglePoiEditModal(item.id)} /> */}
								</div>
							</Tooltip>
						</Circle>
					))}

			{/* Render Geofences */}
			{poiData.geofenceList &&
				Array.isArray(poiData.geofenceList) &&
				poiData.geofenceList.length > 0 &&
				poiData.geofenceList
					.filter((item) => item.points.length > 0 && (poiData.selectedPOI.id === -1 || item.id === poiData.selectedPOI.id))
					.map((item, index) => (
						<Polygon
							key={index}
							positions={item.points.map((point) => [point.gps_latitude, point.gps_longitude])}
							pathOptions={{ color: '#027832', fillOpacity: 0.35, weight: 2 }}
						>
							<Tooltip direction='top' offset={[0, -10]} opacity={1} permanent>
								<div style={{ display: 'flex', alignItems: 'center' }}>
									<span>{item.name.substring(0, 20)}</span>
								</div>
							</Tooltip>
						</Polygon>
					))}

			{/* Edit POI Modal */}
			{poiOpenIndex !== -1 && (
				<EditPoi poiData={poiData.poi.find((poi) => poi.id === poiOpenIndex)} poiIndex={poiOpenIndex} setPoiIndex={setPoiIndex} />
			)}
		</>
	);
};

const EditPoi = ({
	poiData,
	poiIndex,
	setPoiIndex,
}: {
	poiData: POI | undefined;
	poiIndex: number;
	setPoiIndex: Dispatch<React.SetStateAction<number>>;
}) => {
	const { userId } = useSelector((state: RootState) => state.auth);
	const [triggerEditPoi] = useLazyEditPOIQuery();

	const [promiseLoading, setPromiseLoading] = useState(false);
	const [radius, setRadius] = useState(0);
	const [poiName, setPoiName] = useState('');
	const [latLng, setLatLng] = useState({ lat: poiData?.gps_latitude.toFixed(2), lng: poiData?.gps_longitude.toFixed(2) });

	useEffect(() => {
		if (!poiData) return;

		setPoiName(poiData.name);
		setRadius(poiData.gps_radius);
	}, [poiData]);

	if (!poiData) return null;

	const onFinish = () => {
		setPromiseLoading(true);
		triggerEditPoi({
			userId,
			poiName,
			radius,
			lat: Number(latLng.lat),
			lng: Number(latLng.lng),
			poiId: poiData.id,
		}).then(() => {
			setPromiseLoading(false);
			setPoiIndex(-1);
		});
	};

	return (
		<Modal title='Edit POI' open={poiIndex === poiData.id} onCancel={() => setPoiIndex(-1)} width={400} footer={null}>
			<div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: '15px' }} className='select-none'>
				<div className='text-sm text-neutral-800 flex flex-col gap-2 mt-3 overflow-clip rounded-lg font-medium'>
					<div className=' pb-3 flex flex-col gap-2'>
						<div className='grid grid-cols-3 gap-2 items-center'>
							<div className='font-bold'>Name :</div>
							<div className='col-span-2'>
								<Input placeholder="Enter POI's Name" value={poiName} onChange={(e) => setPoiName(e.target.value)} />
							</div>

							<div className='font-bold'>Radius :</div>
							<div className='col-span-2'>
								<Input
									placeholder='Enter Radius in KM'
									value={radius}
									onChange={(e) => !isNaN(Number(e.target.value)) && setRadius(Number(e.target.value))}
								/>
							</div>

							<div className='font-bold'>Latitude :</div>
							<div className='col-span-2'>
								<Input value={latLng.lat} onChange={(e) => setLatLng({ ...latLng, lat: e.target.value })} />
							</div>

							<div className='font-bold'>Longitude :</div>
							<div className='col-span-2'>
								<Input value={latLng.lng} onChange={(e) => setLatLng({ ...latLng, lng: e.target.value })} />
							</div>
						</div>
					</div>
				</div>

				<div className='flex gap-2 justify-end mt-6'>
					<Button
						type='primary'
						onClick={() => onFinish()}
						loading={promiseLoading}
						disabled={!poiName && !radius && !latLng.lat && !latLng.lng && !userId}
					>
						Submit
					</Button>

					<Button onClick={() => setPoiIndex(-1)}>Cancel</Button>
				</div>
			</div>
		</Modal>
	);
};
