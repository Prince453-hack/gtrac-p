import { abbreviations } from '@/lib/abbreviations';
export function getAbbreviation(address: string) {
	for (const place in abbreviations) {
		if (address?.includes(place)) {
			return abbreviations[place];
		}
	}
	return address?.toUpperCase()?.substring(0, 3);
}
