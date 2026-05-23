import localFont from 'next/font/local';

export const proximaNova = localFont({
	src: [
		{
			path: './proxima-nova/black.otf',
			weight: '900',
			style: 'normal',
		},
		{
			path: './proxima-nova/blackit.otf',
			weight: '900',
			style: 'italic',
		},
		{
			path: './proxima-nova/extrabold.otf',
			weight: '800',
			style: 'normal',
		},
		{
			path: './proxima-nova/extraboldit.otf',
			weight: '800',
			style: 'italic',
		},
		{
			path: './proxima-nova/bold.otf',
			weight: '700',
			style: 'normal',
		},
		{
			path: './proxima-nova/boldit.otf',
			weight: '700',
			style: 'italic',
		},
		{
			path: './proxima-nova/semibold.otf',
			weight: '600',
			style: 'normal',
		},
		{
			path: './proxima-nova/semiboldit.otf',
			weight: '600',
			style: 'italic',
		},
		{
			path: './proxima-nova/medium.ttf',
			weight: '500',
			style: 'normal',
		},
		{
			path: './proxima-nova/light.otf',
			weight: '300',
			style: 'normal',
		},
		{
			path: './proxima-nova/regular.otf',
			weight: '400',
			style: 'normal',
		},
		{
			path: './proxima-nova/thin.otf',
			weight: '100',
			style: 'normal',
		},
		{
			path: './proxima-nova/thinit.otf',
			weight: '100',
			style: 'italic',
		},
	],
	variable: '--font-proxima',
});
