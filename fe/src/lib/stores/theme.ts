import { browser } from '$app/environment';
import { DEFAULT_THEME, STORAGE_KEY } from '$lib/constants/env';
import { writable } from 'svelte/store';

export type Theme = 'light' | 'dark' | 'sunset';

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

export function initTheme(): Theme {
	applyTheme(initialTheme);
	return initialTheme;
}

export function setTheme(value: Theme): void {
	if (!isTheme(value)) return;
	themeStore.set(value);
}
