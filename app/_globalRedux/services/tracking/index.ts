import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const tracking = createApi({
	reducerPath: 'tracking',
	refetchOnFocus: false,

	baseQuery: fetchBaseQuery({
		baseUrl: process.env.NEXT_PUBLIC_TRACKING,
		// timeout: 30000,
	}),

	endpoints: (builder) => ({
		forgetPassword: builder.mutation<any, { emailId: string; username: string }>({
			query: (body) => ({
				url: 'forgetP',
				method: 'POST',
				body: {
					emailId: body.emailId,
					username: body.username,
				},
			}),
		}),
		changePassword: builder.mutation<any, { username: string; password: string; newPassword: string }>({
			query: (body) => ({
				url: 'passwordChange',
				method: 'POST',
				body: {
					username: body.username,
					password: body.password,
					newpassword: body.newPassword,
				},
			}),
		}),
	}),
});

export const { useForgetPasswordMutation, useChangePasswordMutation } = tracking;
