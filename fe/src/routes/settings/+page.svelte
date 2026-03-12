<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { API_ENDPOINTS } from '$lib/constants/api';
	import { clearAuthToken, getAuthHeaders } from '$lib/constants/helpers';
	import { ENV } from '$lib/constants/env';
	import Link from '$lib/components/Link.svelte';
	import { ROUTES } from '$lib/routes';
	import { requireAuth } from '$lib/utils/routeGuard';
	import { setTheme, theme, themeOptions, type Theme } from '$lib/stores/theme';

	const PREF_STORAGE_KEY = 'hostify-preferences';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let user: any = null;
	let loading = true;
	let saveMessage = '';
	let selectedTheme: Theme = 'light';
	let preferences = {
		deployEmails: true,
		securityAlerts: true,
		weeklyDigest: false,
		previewComments: true
	};

	const unsubscribe = theme.subscribe((value) => (selectedTheme = value));
	onDestroy(() => unsubscribe());

	onMount(async () => {
		if (ENV !== 'local' && !requireAuth()) return;

		if (browser) {
			const savedPrefs = localStorage.getItem(PREF_STORAGE_KEY);
			if (savedPrefs) {
				try {
					preferences = { ...preferences, ...JSON.parse(savedPrefs) };
				} catch (error) {
					console.error('Failed to parse saved preferences', error);
				}
			}
		}

		try {
			if (ENV === 'local') {
				user = {
					username: 'Local Dev',
					email: 'dev@localhost',
					avatarUrl: ''
				};
			} else {
				const response = await fetch(API_ENDPOINTS.auth.me, {
					headers: getAuthHeaders()
				});

				if (response.ok) {
					const data = await response.json();
					user = data.user;
				} else {
					clearAuthToken();
					window.location.href = ROUTES.auth;
				}
			}
		} catch (error) {
			console.error('Failed to load profile', error);
		} finally {
			loading = false;
		}
	});

	function togglePref(key: keyof typeof preferences) {
		preferences = { ...preferences, [key]: !preferences[key] };
		persistPrefs('Preferences saved');
	}

	function persistPrefs(message: string) {
		if (browser) {
			localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(preferences));
		}
		saveMessage = message;
		setTimeout(() => (saveMessage = ''), 2000);
	}

	function chooseTheme(next: Theme) {
		selectedTheme = next;
		setTheme(next);
		persistPrefs(`Theme set to ${next}`);
	}
</script>

<svelte:head>
	<title>Settings | Hostify</title>
	<meta
		name="description"
		content="Manage your Hostify profile, notifications, and theme preferences."
	/>
</svelte:head>

<div class="min-h-screen bg-white">
	<header class="border-b-3 border-slate-800 bg-sky-50">
		<div class="container mx-auto max-w-6xl px-6 py-4">
			<div class="flex items-center justify-between">
				<Link
					href={ROUTES.dashboard}
					className="text-3xl font-black text-slate-800"
					style="font-family: 'Bitcount Prop Double', sans-serif;"
				>
					Hostify
				</Link>
				<div class="flex items-center gap-3">
					<Link
						href={ROUTES.dashboard}
						className="cartoon-shadow hover:cartoon-shadow-lg rounded-none border-3 border-slate-800 bg-white px-4 py-2 font-bold text-slate-800 transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
					>
						<i class="fa-solid fa-arrow-left mr-2"></i>
						Back to Dashboard
					</Link>
					<Link
						href={ROUTES.deploy}
						className="cartoon-shadow hover:cartoon-shadow-lg rounded-none border-3 border-slate-800 bg-sky-500 px-4 py-2 font-bold text-white transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
					>
						<i class="fa-solid fa-rocket mr-2"></i>
						Deploy
					</Link>
				</div>
			</div>
		</div>
	</header>

	<main class="container mx-auto max-w-6xl px-6 py-10">
		{#if loading}
			<div class="flex items-center justify-center py-24">
				<i class="fa-solid fa-spinner fa-spin text-6xl text-sky-500"></i>
			</div>
		{:else}
			<div class="flex flex-col gap-8">
				<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 class="text-4xl font-black text-slate-800">Settings</h1>
						<p class="text-lg text-slate-600">Manage your profile, notifications, and theme.</p>
					</div>
					{#if saveMessage}
						<div
							class="cartoon-shadow rounded-none border-3 border-slate-800 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
						>
							<i class="fa-solid fa-circle-check mr-2 text-sky-500"></i>
							{saveMessage}
						</div>
					{/if}
				</div>

				<div class="grid gap-6 lg:grid-cols-3">
					<div
						class="cartoon-shadow rounded-none border-3 border-slate-800 bg-white p-6 lg:col-span-2"
					>
						<div class="mb-4 flex items-center gap-4">
							{#if user?.avatarUrl}
								<img
									src={user.avatarUrl}
									alt={user.username}
									class="h-16 w-16 rounded-full border-3 border-slate-800"
								/>
							{:else}
								<div
									class="flex h-16 w-16 items-center justify-center rounded-full border-3 border-slate-800 bg-sky-500 text-2xl font-bold text-white"
								>
									{user?.username?.slice(0, 1)?.toUpperCase() || 'H'}
								</div>
							{/if}
							<div>
								<p class="text-sm font-semibold tracking-wide text-slate-500 uppercase">Account</p>
								<h2 class="text-2xl font-black text-slate-800">
									{user?.username || 'Hostify User'}
								</h2>
								<p class="text-slate-600">{user?.email || 'Email not available'}</p>
							</div>
						</div>
						<div class="grid gap-4 sm:grid-cols-3">
							<div
								class="rounded-none border-2 border-dashed border-slate-300 p-4 text-sm text-slate-600"
							>
								<i class="fa-solid fa-shield-halved mr-2 text-sky-500"></i>
								Single sign-on via GitHub
							</div>
							<div
								class="rounded-none border-2 border-dashed border-slate-300 p-4 text-sm text-slate-600"
							>
								<i class="fa-solid fa-lock mr-2 text-sky-500"></i>
								Session secured with JWT
							</div>
							<div
								class="rounded-none border-2 border-dashed border-slate-300 p-4 text-sm text-slate-600"
							>
								<i class="fa-solid fa-cloud-arrow-up mr-2 text-sky-500"></i>
								Deployments auto-backed up
							</div>
						</div>
					</div>

					<div class="cartoon-shadow rounded-none border-3 border-slate-800 bg-white p-6">
						<h3 class="mb-3 text-xl font-bold text-slate-800">Security quick actions</h3>
						<div class="space-y-3 text-sm text-slate-600">
							<label class="flex items-start gap-3">
								<input
									type="checkbox"
									class="rounded-none border-2 border-slate-800 text-sky-500 focus:ring-2 focus:ring-sky-500"
									checked={preferences.securityAlerts}
									on:change={() => togglePref('securityAlerts')}
								/>
								<div>
									<p class="font-semibold text-slate-800">Alert on unusual sign-ins</p>
									<p class="text-slate-600">Get an email if we detect a new device.</p>
								</div>
							</label>
							<label class="flex items-start gap-3">
								<input
									type="checkbox"
									class="rounded-none border-2 border-slate-800 text-sky-500 focus:ring-2 focus:ring-sky-500"
									checked={preferences.previewComments}
									on:change={() => togglePref('previewComments')}
								/>
								<div>
									<p class="font-semibold text-slate-800">Require preview approvals</p>
									<p class="text-slate-600">
										Block production deploys until preview is signed off.
									</p>
								</div>
							</label>
							<p class="rounded-none border-2 border-dashed border-slate-300 p-3 text-slate-500">
								Two-factor auth enforcement is coming soon.
							</p>
						</div>
					</div>
				</div>

				<section class="cartoon-shadow rounded-none border-3 border-slate-800 bg-white p-6">
					<div class="mb-4 flex items-center justify-between">
						<div>
							<p class="text-sm font-semibold tracking-wide text-slate-500 uppercase">Appearance</p>
							<h3 class="text-2xl font-black text-slate-800">Theme</h3>
							<p class="text-slate-600">Applies to the entire site and sticks to this browser.</p>
						</div>
						<div
							class="rounded-none border-2 border-dashed border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
						>
							Current: {selectedTheme}
						</div>
					</div>

					<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{#each themeOptions as option (option.id)}
							<button
								type="button"
								on:click={() => chooseTheme(option.id)}
								class={`cartoon-shadow hover:cartoon-shadow-lg w-full rounded-none border-3 bg-white p-4 text-left transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 ${
									option.id === selectedTheme ? 'border-slate-800' : 'border-slate-300'
								}`}
							>
								<div class="mb-2 flex items-center justify-between">
									<h4 class="text-lg font-bold text-slate-800">{option.label}</h4>
									{#if option.id === selectedTheme}
										<span
											class="rounded-none border-2 border-slate-800 bg-sky-500 px-2 py-1 text-xs font-bold text-white"
										>
											Active
										</span>
									{/if}
								</div>
								<p class="text-sm text-slate-600">{option.description}</p>
							</button>
						{/each}
					</div>
				</section>

				<section class="grid gap-6 lg:grid-cols-2">
					<div class="cartoon-shadow rounded-none border-3 border-slate-800 bg-white p-6">
						<h3 class="mb-3 text-xl font-bold text-slate-800">Notifications</h3>
						<div class="space-y-3 text-sm text-slate-600">
							<label
								class="cartoon-shadow hover:cartoon-shadow-lg flex items-start gap-3 rounded-none border-3 border-slate-800 bg-white p-4 transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
							>
								<input
									type="checkbox"
									class="mt-1 rounded-none border-2 border-slate-800 text-sky-500 focus:ring-2 focus:ring-sky-500"
									checked={preferences.deployEmails}
									on:change={() => togglePref('deployEmails')}
								/>
								<div>
									<p class="font-semibold text-slate-800">Deployment updates</p>
									<p class="text-slate-600">Emails when deploys succeed, fail, or queue.</p>
								</div>
							</label>
							<label
								class="cartoon-shadow hover:cartoon-shadow-lg flex items-start gap-3 rounded-none border-3 border-slate-800 bg-white p-4 transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
							>
								<input
									type="checkbox"
									class="mt-1 rounded-none border-2 border-slate-800 text-sky-500 focus:ring-2 focus:ring-sky-500"
									checked={preferences.weeklyDigest}
									on:change={() => togglePref('weeklyDigest')}
								/>
								<div>
									<p class="font-semibold text-slate-800">Weekly digest</p>
									<p class="text-slate-600">Summary of deploys, traffic, and errors.</p>
								</div>
							</label>
						</div>
					</div>

					<div class="cartoon-shadow rounded-none border-3 border-slate-800 bg-white p-6">
						<h3 class="mb-3 text-xl font-bold text-slate-800">Sessions</h3>
						<ul class="space-y-3 text-sm text-slate-600">
							<li
								class="flex items-center justify-between rounded-none border-2 border-dashed border-slate-300 p-3"
							>
								<div>
									<p class="font-semibold text-slate-800">Browser</p>
									<p class="text-slate-600">Signed in as {user?.email || 'user@hostify.dev'}</p>
								</div>
								<span
									class="rounded-none border-2 border-slate-800 bg-sky-500 px-2 py-1 text-xs font-bold text-white"
									>Active</span
								>
							</li>
							<li
								class="flex items-center justify-between rounded-none border-2 border-dashed border-slate-300 p-3"
							>
								<div>
									<p class="font-semibold text-slate-800">Access tokens</p>
									<p class="text-slate-600">Rotated automatically after logout.</p>
								</div>
								<button
									on:click={() => persistPrefs('Session security refreshed')}
									class="cartoon-shadow hover:cartoon-shadow-lg rounded-none border-3 border-slate-800 bg-white px-3 py-2 text-xs font-bold text-slate-800 transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
								>
									<i class="fa-solid fa-rotate mr-1"></i>
									Refresh now
								</button>
							</li>
						</ul>
					</div>
				</section>
			</div>
		{/if}
	</main>
</div>
