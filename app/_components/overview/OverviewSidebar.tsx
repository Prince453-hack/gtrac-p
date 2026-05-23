'use client';

import { FileTextOutlined } from '@ant-design/icons';
import React, { Dispatch, SetStateAction } from 'react';

interface SectionProps {
	title: string;
	count: number;
	sectionType: 'ALERTS' | 'TRENDS' | 'ANALYSIS';
	toggleSection: (sectionKey: 'ALERTS' | 'TRENDS' | 'ANALYSIS') => void;
}

const Section = ({ title, count, sectionType, toggleSection }: SectionProps) => (
	<div className='border-b border-gray-100 last:border-b-0' onClick={() => toggleSection(sectionType)}>
		<button className='w-full flex items-center justify-between py-3 px-3 hover:bg-gray-50 transition-colors'>
			<div className='flex items-center gap-3'>
				<span className='text-xs font-medium text-gray-700'>{title}</span>
			</div>
		</button>
	</div>
);

const OverviewSidebar = ({
	expandedSection,
	setExpandedSection,
}: {
	expandedSection: 'ALERTS' | 'TRENDS' | 'ANALYSIS';
	setExpandedSection: Dispatch<SetStateAction<'ALERTS' | 'TRENDS' | 'ANALYSIS'>>;
}) => {
	const toggleSection = (sectionKey: 'ALERTS' | 'TRENDS' | 'ANALYSIS') => {
		setExpandedSection(sectionKey);
	};

	const alertsData = [
		{ key: 'driverBehaviour', title: 'Driver Behaviour', count: 163 },
		{ key: 'vehicleHealth', title: 'Vehicle Health', count: 53 },
		{ key: 'gpsAlerts', title: 'Gps Alerts', count: 98 },
		{ key: 'serviceDocument', title: 'Service & Document Reminder', count: 86 },
	];

	const trendsData = [
		{ key: 'runIdle', title: 'Run/Idle', count: 45 },
		{ key: 'runTrend', title: 'Run Trend', count: 23 },
		{ key: 'idleTrend', title: 'Idle Trend', count: 89 },
		// { key: 'fuelTrend', title: 'Fuel Trend', count: 67 },
	];

	const analysisData = [
		{ key: 'leastUsedVehicles', title: 'Least Used Vehicles', count: 45 },
		{ key: 'productivityMeter', title: 'Fuel Efficiency Report', count: 23 },
		{ key: 'vehicleWithMostAlerts', title: 'Vehicle With Most Alerts', count: 89 },
	];

	return (
		<div className='bg-white rounded-lg shadow-sm border border-gray-200'>
			<div className='flex items-center gap-2 p-2 py-1.5 border-b border-gray-200'>
				<FileTextOutlined className='text-gray-600' />
				<h2 className='text-sm font-semibold text-gray-900'>Overview</h2>
			</div>

			<div className='space-y-6 max-h-[calc(100vh-378px)] overflow-y-scroll scrollbar scrollbar-w-0.5 scrollbar-thumb-blue-500 scrollbar-thumb-rounded-full'>
				<div>
					<div
						className='flex items-center justify-between mb-4 py-2 px-3 cursor-pointer hover:text-gray-700 bg-gray-100'
						onClick={() => toggleSection('ALERTS')}
					>
						<div className='flex items-center gap-2 '>
							<input type='radio' name='overview-section' checked={expandedSection === 'ALERTS'} />
							<h3 className='text-sm font-medium text-gray-700'>Alerts</h3>
						</div>
					</div>

					<div className='space-y-0'>
						{alertsData.map((alert) => (
							<Section key={alert.key} title={alert.title} count={alert.count} sectionType={'ALERTS'} toggleSection={toggleSection} />
						))}
					</div>
				</div>

				<div>
					<div
						className='flex items-center justify-between mb-4 py-2 px-3 cursor-pointer hover:text-gray-700 bg-gray-100'
						onClick={() => toggleSection('TRENDS')}
					>
						<div className='flex items-center gap-2'>
							<input type='radio' name='overview-section' checked={expandedSection === 'TRENDS'} />
							<h3 className='text-sm font-medium text-gray-700'>Trends</h3>
						</div>
					</div>

					<div className='space-y-0'>
						{trendsData.map((trend) => (
							<Section key={trend.key} title={trend.title} count={trend.count} sectionType={'TRENDS'} toggleSection={toggleSection} />
						))}
					</div>
				</div>

				<div>
					<div
						className='flex items-center justify-between mb-4 py-2 px-3 cursor-pointer hover:text-gray-700 bg-gray-100'
						onClick={() => toggleSection('ANALYSIS')}
					>
						<div className='flex items-center gap-2'>
							<input type='radio' name='overview-section' checked={expandedSection === 'ANALYSIS'} />
							<h3 className='text-sm font-medium text-gray-700'>Analysis</h3>
						</div>
					</div>

					<div className='space-y-0'>
						{analysisData.map((item) => (
							<Section key={item.key} title={item.title} count={item.count} sectionType={'ANALYSIS'} toggleSection={toggleSection} />
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default OverviewSidebar;
