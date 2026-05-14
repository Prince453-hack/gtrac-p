import { useEffect } from 'react';
import usePolylineDrawer from './hooks/usePolylineDrawer';
import { GetItnaryWithMapResponse, PathArrayItem } from '@/app/_globalRedux/services/types/getItnaryWithMapResponse';

const anchor = { x: 4.05, y: 4.05, equals: () => false };

const lineSymbol = {
	path: 'M4.21032 0.0488281L8.00463 6.62076H0.416016L4.21032 0.0488281Z',
	strokeOpacity: 1,
	fillColor: '#000',
	fillOpacity: 2,
	scale: 1.5,
	anchor,
};

const options = {
	strokeColor: '#0390fc',
	strokeOpacity: 2.8,
	strokeWeight: 4,
	fillColor: '#0390fc',
	fillOpacity: 1.35,
	optimized: false,
	clickable: false,
	draggable: false,
	editable: false,
	visible: true,
	radius: 30000,
	icons: [
		{
			icon: lineSymbol,
			fill: '#000',
			repeat: '150px',
		},
	],
	zIndex: 1,
};

function CustomPolyline({ path }: { path: GetItnaryWithMapResponse['patharry'] | PathArrayItem[] }) {
	const drawPolyline = usePolylineDrawer();

	const handleDrawPolyline = () => {
		drawPolyline(path, options);
	};
	useEffect(() => {
		handleDrawPolyline();

		// eslint-disable-next
	}, [path]);

	return <> </>;
}

export default CustomPolyline;
