'use client';

import { Provider, useDispatch } from 'react-redux';
import { store } from './store';
import { ReactNode } from 'react';

const Providers = ({ children }: { children: ReactNode }) => {
	return <Provider store={store}>{children}</Provider>;
};

export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();

export default Providers;
