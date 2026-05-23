const checkIfIgnitionOnOrOff = ({
	ignitionState,
	speed,
	mode,
}: {
	ignitionState: 'on' | 'off';
	speed: number;
	mode: 'NOT WORKING' | 'IDLE' | 'STOPPED' | 'RUNNING';
}) => {
	if ((ignitionState === 'on' || ignitionState === 'off') && speed >= 8 && mode === 'RUNNING') {
		return 'On';
	} else {
		return 'Off';
	}
};

export default checkIfIgnitionOnOrOff;
