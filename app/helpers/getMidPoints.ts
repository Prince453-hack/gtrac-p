const getMidPoints = ({ mk1, mk2, numMidPoints }: { mk1: { x1: number; y1: number }; mk2: { x2: number; y2: number }; numMidPoints: number }) => {
	const { x1, y1 } = mk1;
	const { x2, y2 } = mk2;

	let midPoints = [];

	let xStep = (x2 - x1) / (numMidPoints + 1);
	let yStep = (y2 - y1) / (numMidPoints + 1);

	for (let i = 1; i <= numMidPoints; i++) {
		let midX = x1 + i * xStep;
		let midY = y1 + i * yStep;
		midPoints.push([midX, midY]);
	}

	return midPoints;
};

export default getMidPoints;
