import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type Theme = 'light' | 'dark' | 'sunset';

const STORAGE_KEY = 'hostify-theme';
const DEFAULT_THEME: Theme = 'light';

function isTheme(value: unknown): value is Theme {
	return value === 'light' || value === 'dark' || value === 'sunset';
}

const savedTheme = browser ? (localStorage.getItem(STORAGE_KEY) as Theme | null) : null;
const initialTheme: Theme = isTheme(savedTheme) ? savedTheme : DEFAULT_THEME;

const themeStore = writable<Theme>(initialTheme);

function applyTheme(value: Theme): void {
	if (!browser) return;
	document.documentElement.dataset.theme = value;
	const scheme = value === 'dark' || value === 'sunset' ? 'dark' : 'light';
	document.documentElement.style.colorScheme = scheme;
}

if (browser) {
	applyTheme(initialTheme);
	themeStore.subscribe((value) => {
		localStorage.setItem(STORAGE_KEY, value);
		applyTheme(value);
	});
}

export const theme = themeStore;

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

export function initTheme(): Theme {
	applyTheme(initialTheme);
	return initialTheme;
}

export function setTheme(value: Theme): void {
	if (!isTheme(value)) return;
	themeStore.set(value);
}
