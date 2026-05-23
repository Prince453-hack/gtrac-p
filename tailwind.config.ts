import type { Config } from 'tailwindcss';
const plugin = require('tailwindcss/plugin');

const config: Config = {
	darkMode: ['class'],
	content: ['./pages/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './app/**/*.{js,ts,jsx,tsx,mdx}'],
	theme: {
		extend: {
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
				'vehicle-greeen': "url('../public/assets/images/map/vehicles/vehicle-green.png')",
			},
			fontFamily: {
				proxima: ['var(--font-proxima)'],
			},
			colors: {
				'primary-green': '#478C83',
				'primary-orange': '#DA5E1A',
				'primary-red': '#BF2E39',
				'primary-orange-light': '#d8691a',
				'neutral-green': '#F2F5F3',
				'neutral-orange': '#fcf0e9',
				'light-glow-green': '#F0FEF3',
				'dark-glow-green': '#87EEAB',
				's-light': '#e6eae7',
				's-dark': '#dbdfdc',
				'thumb-green': '#b6bfb9',
				'custom-pink': '#FB7773',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},

				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			gridTemplateColumns: {
				13: 'repeat(13, minmax(0, 1fr))',
			},
		},
	},

	plugins: [
		require('tailwind-scrollbar')({ nocompatible: true }),
		plugin(function ({ addVariant }: { addVariant: any }) {
			addVariant('gen1', '& > *');
			addVariant('gen2', '& > * > *');
			addVariant('gen3', '& > * > * > *');
		}),
		require('tailwindcss-animate'),
	],
};
export default config;
