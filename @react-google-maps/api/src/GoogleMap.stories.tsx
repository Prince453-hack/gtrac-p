import type { StoryFn, Meta } from '@storybook/react';
import { GoogleMap } from '.';

const exp: Meta<typeof GoogleMap> = {
	title: 'Example/GoogleMap',
	component: GoogleMap,
	args: {
		zoom: 8,
		mapContainerStyle: {
			width: '480px',
			height: '320px',
		},
		center: {
			lat: -3.745,
			lng: -38.523,
		},
	},
};

export default exp;

const Template: StoryFn<typeof GoogleMap> = (args: any) => <GoogleMap {...args} />;

// @ts-ignore
export const Default = Template.bind({});
Default.args = {
	zoom: 8,
};

// @ts-ignore
export const Satellite = Template.bind({});
Satellite.args = {
	zoom: 15,
	mapTypeId: 'satellite',
};
