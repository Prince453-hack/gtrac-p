export interface GetPartyListResponse {
	message: string;
	success: boolean;
	list: PartyList[];
}

export interface PartyList {
	id: number;
	sys_user_id: number;
	sys_group_id: number;
	name: string;
	created_at: string;
	status: number;
}
