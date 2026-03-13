import type { Theme } from '$lib/stores/theme';

export const themeOptions: Array<{ id: Theme; label: string; description: string }> = [
	{
		id: 'light',
		label: 'Light',
		description: 'Bright surfaces with sky accents'
	},
	{
		id: 'dark',
		label: 'Dark',
		description: 'Low-glare surfaces with cyan highlights'
	},
	{
		id: 'sunset',
		label: 'Sunset',
		description: 'Moody purples with warm gold borders'
	}
];
