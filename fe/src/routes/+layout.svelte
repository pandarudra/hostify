<script lang="ts">
	import { derived } from 'svelte/store';
	import { page } from '$app/stores';
	import { env } from '$env/dynamic/public';
	import './layout.css';
	import '@fortawesome/fontawesome-free/css/all.min.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	const SITE_URL = (env.PUBLIC_SITE_URL || 'https://hostify.dev').replace(/\/$/, '');
	const defaultDescription =
		'Deploy static sites from GitHub in minutes with Hostify. Automatic builds, previews, and simple auth.';

	const canonicalStore = derived(page, ($page) => {
		const pathname = $page.url.pathname || '/';
		const normalized = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
		return `${SITE_URL}${normalized}`;
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="canonical" href={$canonicalStore} />
	<meta name="robots" content="index, follow" />
	<meta name="description" content={defaultDescription} />
	<meta name="theme-color" content="#0ea5e9" />
	<meta property="og:site_name" content="Hostify" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={$canonicalStore} />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>
{@render children()}
