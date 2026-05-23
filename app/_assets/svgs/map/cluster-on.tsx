import React from 'react';

function ClusterOn() {
	return (
		<div className='w-6 h-6 flex items-center justify-center relative right-1'>
			<svg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'>
				{/* <rect width='40' height='40' rx='2' fill='white' /> */}
				<circle cx='20.5' cy='20.5' r='14.5' fill='url(#paint0_radial_190_26)' />
				<circle cx='21' cy='21' r='9' fill='#2693EB' />
				<defs>
					<radialGradient
						id='paint0_radial_190_26'
						cx='0'
						cy='0'
						r='1'
						gradientUnits='userSpaceOnUse'
						gradientTransform='translate(20.5 20.5) rotate(90) scale(14.5)'
					>
						<stop stop-color='#158BED' stop-opacity='0.69' />
						<stop offset='1' stop-color='#158BED' stop-opacity='0.2' />
					</radialGradient>
				</defs>
			</svg>
		</div>
	);
}

export default ClusterOn;
