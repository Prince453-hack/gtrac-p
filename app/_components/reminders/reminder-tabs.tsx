'use client';
import React from 'react';
import { ConfigProvider, Tabs } from 'antd';
import type { TabsProps } from 'antd';
import { DocumentReminders, ServiceReminders } from './';

const onChange = (key: string) => {};

const items: TabsProps['items'] = [
	{
		key: 'service',
		label: 'Service',
		children: <ServiceReminders />,
	},
	{
		key: 'document',
		label: 'Document',
		children: <DocumentReminders />,
	},
];

export const ReminderTabs = () => {
	return (
		<ConfigProvider
			theme={{
				components: {
					Tabs: {
						titleFontSizeSM: 16,
					},
				},
			}}
		>
			<Tabs
				defaultActiveKey='1'
				items={items}
				onChange={onChange}
				size='small'
				tabBarStyle={{
					fontWeight: 400,
					fontSize: 16,
					marginLeft: 24,
					marginBottom: 0,
				}}
			/>
		</ConfigProvider>
	);
};
