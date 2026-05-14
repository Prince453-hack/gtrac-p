import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface NightTeamUser {
  sys_user_id: number;
  sys_group_id: number;
  page: string;
}

interface NightTeamUsersResponse {
  success: boolean;
  data: NightTeamUser[][];
}

export const internalProcessApi = createApi({
  reducerPath: "internalProcessApi",
  refetchOnFocus: false,

  baseQuery: fetchBaseQuery({
    baseUrl: "https://gtrac.in:8089",
  }),

  endpoints: (builder) => ({
    getNightTeamUsers: builder.query<NightTeamUsersResponse, void>({
      query: () => ({
        url: "/elockdata/elockNightteamusers",
      }),
    }),
  }),
});

export const { useGetNightTeamUsersQuery } = internalProcessApi;
export type { NightTeamUsersResponse, NightTeamUser };
