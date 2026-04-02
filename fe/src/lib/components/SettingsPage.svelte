<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { API_ENDPOINTS } from '$lib/constants/api';
	import { clearAuthToken, getAuthHeaders } from '$lib/constants/helpers';
	import { ENV, isUITesting, isUpcomingFeatureFlagEnabled } from '$lib/constants/env';
	import Link from '$lib/components/Link.svelte';
	import { ROUTES } from '$lib/routes';
	import { requireAuth } from '$lib/utils/routeGuard';
	import { setTheme, theme, type Theme } from '$lib/stores/theme';
	import { themeOptions } from '$lib/constants/themes';

	import { PREF_STORAGE_KEY } from '$lib/constants/local';
	import Heatmap from './Heatmap.svelte';
	import type { twoFactorStageType, UserType } from '$lib/types/user';
	import { localUser } from '$lib/constants/default';

	type ContributionEntry = { date: string; count: number };

	const DAY_MS = 24 * 60 * 60 * 1000;
	const DEFAULT_HEATMAP_WEEKS = 53;

	function toUtcDayStart(date: Date): Date {
		return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
	}

	function buildFallbackContributions(weeks: number = DEFAULT_HEATMAP_WEEKS): ContributionEntry[] {
		const totalDays = weeks * 7;
		const today = toUtcDayStart(new Date());
		const start = new Date(today.getTime() - (totalDays - 1) * DAY_MS);
		const entries: ContributionEntry[] = [];

		for (let i = 0; i < totalDays; i++) {
			const date = new Date(start.getTime() + i * DAY_MS);
			const variation = (Math.sin(i / 5) + 1) * 2 + (i % 6 === 0 ? 4 : 0);
			entries.push({
				date: date.toISOString(),
				count: Math.max(0, Math.round(variation))
			});
		}

		return entries;
	}

	function sanitizeContributions(raw: unknown[]): ContributionEntry[] {
		const cleaned: ContributionEntry[] = [];
		for (const item of raw) {
			if (typeof item !== 'object' || item === null) continue;
			const maybe = item as { date?: unknown; count?: unknown };
			if (typeof maybe.date !== 'string') continue;
			const count =
				typeof maybe.count === 'number' && Number.isFinite(maybe.count) ? maybe.count : 0;
			cleaned.push({ date: maybe.date, count });
		}
		return cleaned;
	}

	let user: UserType | null = null;
	let loading: boolean = true;
	let saveMessage: string = '';
	let saving: boolean = false;
	let testing: boolean = false;
	let selectedTheme: Theme = 'light';
	let preferences: {
		deployEmails: boolean;
		securityAlerts: boolean;
		weeklyDigest: boolean;
		previewComments: boolean;
	} = {
		deployEmails: true,
		securityAlerts: true,
		weeklyDigest: false,
		previewComments: true
	};
	let notificationEmail: string = '';
	let twoFactorEnabled: boolean = false;
	let twoFactorEmail: string = '';
	let twoFactorDestination: string = '';
	let twoFactorCode: string = '';
	let twoFactorStage: twoFactorStageType = 'idle';
	let twoFactorMessage: string = '';
	let twoFactorLoading: boolean = false;
	let twoFactorVerifying: boolean = false;
	let twoFactorDisabling: boolean = false;
	let twoFactorModalOpen: boolean = false;
	let operationsContributions: ContributionEntry[] = [];

	const unsubscribe = theme.subscribe((value) => (selectedTheme = value));
	onDestroy(() => unsubscribe());

	async function loadActivityHeatmap() {
		try {
			if (isUITesting) {
				operationsContributions = buildFallbackContributions();
				return;
			}

			const response = await fetch(API_ENDPOINTS.analytics.activityHeatmap, {
				headers: getAuthHeaders()
			});

			if (response.ok) {
				const payload = await response.json();
				const rawData: unknown[] = Array.isArray(payload?.data) ? payload.data : [];
				const sanitized = sanitizeContributions(rawData);
				operationsContributions = sanitized.length ? sanitized : [];
				return;
			}
		} catch (error) {
			console.error('Failed to load activity heatmap', error);
		}

		operationsContributions = [];
	}

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
			if (isUITesting) {
				user = localUser;
				notificationEmail = user.email;
			} else {
				const response = await fetch(API_ENDPOINTS.auth.me, {
					headers: getAuthHeaders()
				});

				if (response.ok) {
					const data = await response.json();
					user = data.user;

					// Fetch persisted settings
					const settingsRes = await fetch(API_ENDPOINTS.settings.base, {
						headers: getAuthHeaders()
					});
					if (settingsRes.ok) {
						const settingsData = await settingsRes.json();
						const apiPrefs = settingsData.settings?.preferences ?? {};
						preferences = { ...preferences, ...apiPrefs };
						if (settingsData.settings?.theme) {
							selectedTheme = settingsData.settings.theme;
							setTheme(selectedTheme);
						}
						notificationEmail = settingsData.settings?.notificationEmail || user?.email || '';
						twoFactorEnabled = !!settingsData.settings?.twoFactorEnabled;
						twoFactorEmail = settingsData.settings?.twoFactorEmail || '';
					}
				} else {
					clearAuthToken();
					window.location.href = ROUTES.auth;
				}
			}
			await loadActivityHeatmap();
		} catch (error) {
			console.error('Failed to load profile', error);
		} finally {
			loading = false;
		}
	});

	function togglePref(key: keyof typeof preferences) {
		preferences = { ...preferences, [key]: !preferences[key] };
		syncSettings('Preferences saved');
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
		syncSettings(`Theme set to ${next}`);
	}

	async function syncSettings(message: string) {
		persistPrefs(message);
		if (ENV === 'local') return;
		saving = true;
		const emailToSave = notificationEmail.trim();
		notificationEmail = emailToSave;
		try {
			const payload: Record<string, unknown> = {
				preferences,
				theme: selectedTheme
			};

			if (emailToSave) {
				payload.notificationEmail = emailToSave;
			}

			const res = await fetch(API_ENDPOINTS.settings.base, {
				method: 'PUT',
				headers: {
					...getAuthHeaders(),
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});
			void res;
		} catch (error) {
			console.error('Failed to sync settings', error);
		} finally {
			saving = false;
		}
	}

	async function saveNotificationEmail() {
		if (!notificationEmail.trim()) {
			saveMessage = 'Add an email to receive notifications';
			setTimeout(() => (saveMessage = ''), 2000);
			return;
		}
		await syncSettings('Notification email updated');
	}

	async function sendTestNotification() {
		const target = notificationEmail.trim();
		if (!target) {
			saveMessage = 'Add an email before sending a test';
			setTimeout(() => (saveMessage = ''), 2000);
			return;
		}

		if (ENV === 'local') {
			saveMessage = 'Test emails are disabled in local mode';
			setTimeout(() => (saveMessage = ''), 2000);
			return;
		}

		testing = true;
		try {
			const res = await fetch(API_ENDPOINTS.notifications.email, {
				method: 'POST',
				headers: {
					...getAuthHeaders(),
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					to: target,
					type: 'deploy',
					subject: 'Hostify test notification',
					text: `This is a test notification from Hostify at ${new Date().toISOString()}.`
				})
			});
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const data = (await res.json().catch(() => ({}))) as any;
			if (res.ok) {
				saveMessage = data?.skipped
					? `Notification skipped (${data?.reason || 'preference'})`
					: 'Test notification sent';
			} else {
				saveMessage = data?.message || 'Failed to send test notification';
			}
		} catch (error) {
			console.error('Failed to send test notification', error);
			saveMessage = 'Failed to send test notification';
		} finally {
			setTimeout(() => (saveMessage = ''), 2500);
			testing = false;
		}
	}

	function flashTwoFactor(message: string) {
		twoFactorMessage = message;
		setTimeout(() => (twoFactorMessage = ''), 2500);
	}

	function openTwoFactorModal() {
		twoFactorModalOpen = true;
		twoFactorStage = 'idle';
		twoFactorCode = '';
		twoFactorDestination = '';
		twoFactorMessage = '';
	}

	function closeTwoFactorModal() {
		twoFactorModalOpen = false;
		twoFactorStage = 'idle';
		twoFactorCode = '';
	}

	async function initiateTwoFactor() {
		if (ENV === 'local') {
			flashTwoFactor('Two-factor is disabled in local mode.');
			return;
		}

		const destination = notificationEmail.trim() || user?.email || '';
		if (!destination) {
			flashTwoFactor('Add an email first to receive the code.');
			return;
		}

		twoFactorLoading = true;
		try {
			const res = await fetch(API_ENDPOINTS.settings.twoFactorInitiate, {
				method: 'POST',
				headers: {
					...getAuthHeaders(),
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email: destination })
			});

			const data = await res.json().catch(() => ({}));
			if (res.ok) {
				twoFactorStage = 'code';
				twoFactorDestination = data?.destination || destination;
				flashTwoFactor('Code sent. Check your inbox.');
			} else {
				flashTwoFactor(data?.message || 'Failed to send verification code.');
			}
		} catch (error) {
			console.error('Failed to initiate 2FA', error);
			flashTwoFactor('Could not send code. Try again.');
		} finally {
			twoFactorLoading = false;
		}
	}

	async function verifyTwoFactorCode() {
		if (ENV === 'local') {
			flashTwoFactor('Two-factor is disabled in local mode.');
			return;
		}

		if (!twoFactorCode.trim()) {
			flashTwoFactor('Enter the verification code first.');
			return;
		}

		twoFactorVerifying = true;
		try {
			const res = await fetch(API_ENDPOINTS.settings.twoFactorVerify, {
				method: 'POST',
				headers: {
					...getAuthHeaders(),
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ code: twoFactorCode.trim() })
			});

			const data = await res.json().catch(() => ({}));
			if (res.ok) {
				twoFactorEnabled = true;
				twoFactorEmail = data?.twoFactorEmail || twoFactorDestination || notificationEmail;
				twoFactorStage = 'idle';
				twoFactorCode = '';
				twoFactorModalOpen = false;
				flashTwoFactor('Two-factor authentication enabled.');
			} else {
				flashTwoFactor(data?.message || 'Invalid code. Try again.');
			}
		} catch (error) {
			console.error('Failed to verify 2FA', error);
			flashTwoFactor('Could not verify code. Try again.');
		} finally {
			twoFactorVerifying = false;
		}
	}

	async function disableTwoFactor() {
		if (ENV === 'local') {
			flashTwoFactor('Two-factor is disabled in local mode.');
			return;
		}

		twoFactorDisabling = true;
		try {
			const res = await fetch(API_ENDPOINTS.settings.twoFactorDisable, {
				method: 'POST',
				headers: getAuthHeaders()
			});
			const data = await res.json().catch(() => ({}));
			if (res.ok) {
				twoFactorEnabled = false;
				twoFactorEmail = '';
				twoFactorStage = 'idle';
				twoFactorCode = '';
				twoFactorDestination = '';
				flashTwoFactor('Two-factor authentication disabled.');
			} else {
				flashTwoFactor(data?.message || 'Failed to disable two-factor.');
			}
		} catch (error) {
			console.error('Failed to disable 2FA', error);
			flashTwoFactor('Could not disable two-factor right now.');
		} finally {
			twoFactorDisabling = false;
		}
	}
</script>

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
							<div class="rounded-none border-2 border-dashed border-slate-300 p-3">
								<div class="mb-2 flex items-center justify-between gap-2">
									<div>
										<p class="font-semibold text-slate-800">Two-factor authentication</p>
										<p class="text-slate-600">
											Protect sign-ins with a one-time code sent to your email.
										</p>
									</div>
									<span
										class={`rounded-none border-2 px-2 py-1 text-xs font-bold ${
											twoFactorEnabled
												? 'border-emerald-700 bg-emerald-500 text-white'
												: 'border-slate-800 bg-white text-slate-800'
										}`}
									>
										{twoFactorEnabled ? 'Enabled' : 'Disabled'}
									</span>
								</div>
								{#if twoFactorMessage}
									<p class="text-xs font-semibold text-slate-700">{twoFactorMessage}</p>
								{/if}
								{#if twoFactorEnabled}
									<p class="text-sm text-slate-600">
										Codes are delivered to {twoFactorEmail || notificationEmail || 'your email'}.
									</p>
									<div class="mt-2 flex flex-wrap gap-2">
										<button
											on:click={disableTwoFactor}
											disabled={twoFactorDisabling}
											class={`cartoon-shadow hover:cartoon-shadow-lg rounded-none border-3 px-4 py-2 text-xs font-bold transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 ${
												twoFactorDisabling
													? 'cursor-not-allowed border-slate-300 bg-slate-200 text-slate-500'
													: 'border-slate-800 bg-white text-slate-800'
											}`}
										>
											{twoFactorDisabling ? 'Disabling...' : 'Disable 2FA'}
										</button>
										<button
											on:click={openTwoFactorModal}
											class="cartoon-shadow hover:cartoon-shadow-lg rounded-none border-3 border-slate-800 bg-white px-4 py-2 text-xs font-bold text-slate-800 transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
										>
											Manage codes
										</button>
									</div>
								{:else}
									<p class="text-sm text-slate-600">
										Verification now happens inside a modal so you can stay on this page.
									</p>
									<div class="mt-3 flex flex-wrap gap-2">
										<button
											on:click={openTwoFactorModal}
											class="cartoon-shadow hover:cartoon-shadow-lg rounded-none border-3 border-slate-800 bg-sky-500 px-4 py-2 text-xs font-bold text-white transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
										>
											Enable
										</button>
										<span class="text-xs font-semibold text-slate-500">
											We will email a one-time code to {notificationEmail ||
												user?.email ||
												'your email'}.
										</span>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
				{#if isUpcomingFeatureFlagEnabled}
					<section class="cartoon-shadow rounded-none border-3 border-slate-800 bg-white p-6">
						<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
							<div>
								<p class="text-xs font-semibold tracking-wide text-slate-500 uppercase">
									Developer settings
								</p>
								<h3 class="text-2xl font-black text-slate-800">Bring your own cloud keys</h3>
								<p class="max-w-3xl text-slate-600">
									Configure Azure storage, Cloudflare API access, and custom domains you want to
									manage. Use this space to plug in your own infrastructure instead of the shared
									Hostify defaults.
								</p>
								<ul class="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
									<li class="flex items-start gap-2">
										<i class="fa-solid fa-cloud text-sky-500"></i>
										<span>Azure storage account, container, and SAS token inputs</span>
									</li>
									<li class="flex items-start gap-2">
										<i class="fa-solid fa-bolt text-amber-500"></i>
										<span>Cloudflare account, API token, and KV namespace</span>
									</li>
									<li class="flex items-start gap-2">
										<i class="fa-solid fa-globe text-emerald-600"></i>
										<span>Track the domains you want to point at deployments</span>
									</li>
								</ul>
							</div>
							<div class="flex flex-col items-start gap-3">
								<Link
									href={ROUTES.developerSettings}
									className="cartoon-shadow hover:cartoon-shadow-lg rounded-none border-3 border-slate-800 bg-sky-500 px-5 py-3 text-sm font-bold text-white transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
								>
									<i class="fa-solid fa-code-branch mr-2"></i>
									Open developer settings
								</Link>
								<p class="max-w-xs text-xs font-semibold text-slate-500">
									Values save to this browser for now; wire them into your automation or share with
									your team later.
								</p>
							</div>
						</div>
					</section>
				{/if}
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
						<div class="mb-4 space-y-2 text-sm text-slate-600">
							<p class="text-xs font-semibold tracking-wide text-slate-500 uppercase">
								Notification email
							</p>
							<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
								<input
									type="email"
									class={`w-full rounded-none border-3 border-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none ${
										selectedTheme === 'dark'
											? 'bg-slate-800 text-white placeholder-slate-300'
											: 'bg-white text-slate-800'
									}`}
									placeholder="you@example.com"
									bind:value={notificationEmail}
									on:blur={saveNotificationEmail}
									autocomplete="email"
								/>
								<button
									type="button"
									on:click={saveNotificationEmail}
									disabled={saving}
									class={`cartoon-shadow hover:cartoon-shadow-lg rounded-none border-3 px-4 py-2 text-xs font-bold transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 ${
										saving
											? 'cursor-not-allowed border-slate-300 bg-slate-200 text-slate-500'
											: 'border-slate-800 bg-white text-slate-800'
									}`}
								>
									{saving ? 'Saving...' : 'Save '}
								</button>
							</div>
							<p class="text-slate-500">
								We use this email for deploy updates, security alerts, and digests. You can change
								it anytime.
							</p>
							<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
								<button
									type="button"
									on:click={sendTestNotification}
									disabled={!notificationEmail || testing || saving}
									class={`cartoon-shadow hover:cartoon-shadow-lg rounded-none border-3 px-4 py-2 text-xs font-bold transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 ${
										testing || saving
											? 'cursor-not-allowed border-slate-300 bg-slate-200 text-slate-500'
											: 'border-slate-800 bg-sky-500 text-white'
									}`}
								>
									{testing ? 'Sending...' : 'Send test email'}
								</button>
								<span class="text-xs font-semibold text-slate-500">
									Uses your preferences and Resend setup
								</span>
							</div>
						</div>
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

				<Heatmap contributions={operationsContributions} theme={selectedTheme} />
			</div>
		{/if}
	</main>
</div>

{#if twoFactorModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8">
		<div
			class="cartoon-shadow relative w-full max-w-lg rounded-none border-3 border-slate-800 bg-white p-6"
		>
			<button
				type="button"
				on:click={closeTwoFactorModal}
				class="absolute top-3 right-3 text-slate-600 hover:text-slate-800"
				aria-label="Close two-factor modal"
			>
				<i class="fa-solid fa-xmark text-lg"></i>
			</button>
			<div class="mb-3 space-y-1">
				<p class="text-xs font-semibold tracking-wide text-slate-500 uppercase">Two-factor</p>
				<h3 class="text-2xl font-black text-slate-800">Verify with a one-time code</h3>
				<p class="text-sm text-slate-600">
					We will send a six-digit code to {twoFactorDestination ||
						notificationEmail ||
						user?.email ||
						'your email'}.
				</p>
			</div>
			{#if twoFactorMessage}
				<div
					class="mb-2 rounded-none border-2 border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
				>
					{twoFactorMessage}
				</div>
			{/if}
			<div class="flex flex-col gap-3">
				<div class="flex flex-wrap items-center gap-2">
					<button
						on:click={initiateTwoFactor}
						disabled={twoFactorLoading}
						class={`cartoon-shadow hover:cartoon-shadow-lg rounded-none border-3 px-4 py-2 text-xs font-bold transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 ${
							twoFactorLoading
								? 'cursor-not-allowed border-slate-300 bg-slate-200 text-slate-500'
								: 'border-slate-800 bg-sky-500 text-white'
						}`}
					>
						{twoFactorLoading ? 'Sending...' : 'Send code'}
					</button>
					<span class="text-xs font-semibold text-slate-500">
						Delivery: {twoFactorDestination ||
							notificationEmail ||
							user?.email ||
							'add an email first'}
					</span>
				</div>
				{#if twoFactorStage === 'code'}
					<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
						<input
							type="text"
							inputmode="numeric"
							maxlength="6"
							class="w-full rounded-none border-3 border-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
							placeholder="Enter the 6-digit code"
							bind:value={twoFactorCode}
							autocomplete="one-time-code"
						/>
						<button
							on:click={verifyTwoFactorCode}
							disabled={twoFactorVerifying}
							class={`cartoon-shadow hover:cartoon-shadow-lg rounded-none border-3 px-4 py-2 text-xs font-bold transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 ${
								twoFactorVerifying
									? 'cursor-not-allowed border-slate-300 bg-slate-200 text-slate-500'
									: 'border-slate-800 bg-white text-slate-800'
							}`}
						>
							{twoFactorVerifying ? 'Verifying...' : 'Verify'}
						</button>
					</div>
				{/if}
				<p class="text-xs text-slate-500">
					Keep this modal open while you complete the code. Codes expire quickly for security.
				</p>
			</div>
		</div>
	</div>
{/if}
