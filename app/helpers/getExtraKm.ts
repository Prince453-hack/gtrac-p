const getExtraKm = (km: number, extra: string) => {
	return km + Number(km) * (Number(extra) / 100);
};
export default getExtraKm;
