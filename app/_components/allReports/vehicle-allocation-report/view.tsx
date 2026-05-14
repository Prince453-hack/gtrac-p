'use client';

import React from 'react';

import { VehicleAllocationReportHeader } from './vehicle-allocation-report-header';
import { VehicleAllocationReportTable } from './vehicle-allocation-report-table';

export const View = () => {
	return (
		<div className={`flex flex-col gap-4 px-4 py-4 w-full font-proxima`}>
			<div className='py-4 relative'>
				<VehicleAllocationReportHeader />
				<VehicleAllocationReportTable />
			</div>
		</div>
	);
};
