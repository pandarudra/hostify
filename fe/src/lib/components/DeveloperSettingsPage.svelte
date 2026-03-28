<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Link from '$lib/components/Link.svelte';
	import { ROUTES } from '$lib/routes';
	import { DEV_CONFIG_STORAGE_KEY } from '$lib/constants/local';
	import { ENV } from '$lib/constants/env';
	import { requireAuth } from '$lib/utils/routeGuard';
	import { API_ENDPOINTS } from '$lib/constants/api';
	import { getAuthHeaders, clearAuthToken } from '$lib/constants/helpers';
	import type { AzureConfig, CloudflareConfig, DeveloperConfig } from '$lib/types/developer';

	const defaults: DeveloperConfig = {
		azure: {
			accountName: '',
			containerName: '',
			sasToken: ''
		},
		cloudflare: {
			accountId: '',
			apiToken: '',
			namespaceId: ''
		},
		domains: []
	};

	let config: DeveloperConfig = structuredClone(defaults);
	let newDomain: { domain: string; target: string } = { domain: '', target: '' };
	let saveMessage = '';
	let saving = false;
	let loading = true;

	const persistMessageDelay = 2400;

	onMount(async () => {
		if (ENV !== 'local' && !requireAuth()) return;
		if (browser) {
			const raw = localStorage.getItem(DEV_CONFIG_STORAGE_KEY);
			if (raw) {
				try {
					const parsed = JSON.parse(raw) as Partial<DeveloperConfig>;
					config = {
						azure: { ...defaults.azure, ...(parsed.azure || {}) },
						cloudflare: { ...defaults.cloudflare, ...(parsed.cloudflare || {}) },
						domains: Array.isArray(parsed.domains) ? parsed.domains : []
					};
				} catch (error) {
					console.error('Failed to read developer settings from storage', error);
				}
			}
		}

		try {
			if (ENV !== 'local') {
				const res = await fetch(API_ENDPOINTS.settings.developer.base, {
					headers: getAuthHeaders()
				});
				if (res.ok) {
					const data = await res.json();
					const apiSettings = data?.settings as Partial<DeveloperConfig>;
					config = {
						azure: { ...defaults.azure, ...(apiSettings?.azure || {}) },
						cloudflare: { ...defaults.cloudflare, ...(apiSettings?.cloudflare || {}) },
						domains: Array.isArray(apiSettings?.domains) ? apiSettings.domains : []
					};
					persist('Developer settings loaded');
				} else if (res.status === 401) {
					clearAuthToken();
					window.location.href = ROUTES.auth;
				}
			}
		} catch (error) {
			console.error('Failed to load developer settings', error);
		} finally {
			loading = false;
		}
	});

	function setConfig(next: DeveloperConfig) {
		config = next;
	}

	function persist(message: string) {
		if (browser) {
			localStorage.setItem(DEV_CONFIG_STORAGE_KEY, JSON.stringify(config));
		}
		saveMessage = message;
		setTimeout(() => (saveMessage = ''), persistMessageDelay);
	}

	function handleAzureChange(field: keyof AzureConfig, value: string) {
		setConfig({ ...config, azure: { ...config.azure, [field]: value } });
	}

	function handleCloudflareChange(field: keyof CloudflareConfig, value: string) {
		setConfig({ ...config, cloudflare: { ...config.cloudflare, [field]: value } });
	}

	async function syncDeveloperSettings(message: string) {
		saving = true;
		persist(message);
		if (ENV === 'local') {
			saving = false;
			return;
		}
		try {
			const res = await fetch(API_ENDPOINTS.settings.developer.base, {
				method: 'PUT',
				headers: {
					...getAuthHeaders(),
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(config)
			});
			if (res.status === 401) {
				clearAuthToken();
				window.location.href = ROUTES.auth;
				return;
			}
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				saveMessage = data?.message || 'Failed to save developer settings';
				setTimeout(() => (saveMessage = ''), persistMessageDelay);
			}
		} catch (error) {
			console.error('Failed to sync developer settings', error);
			saveMessage = 'Could not reach server to save settings';
			setTimeout(() => (saveMessage = ''), persistMessageDelay);
		} finally {
			saving = false;
		}
	}

	async function addDomain() {
		const domain = newDomain.domain.trim();
		const target = newDomain.target.trim();
		if (!domain) {
			saveMessage = 'Add a domain before saving.';
			setTimeout(() => (saveMessage = ''), persistMessageDelay);
			return;
		}

		const id =
			typeof crypto !== 'undefined' && 'randomUUID' in crypto
				? crypto.randomUUID()
				: Math.random().toString(36).slice(2);

		setConfig({
			...config,
			domains: [...config.domains, { id, domain, ...(target && { target }) }]
		});
		newDomain = { domain: '', target: '' };
		await syncDeveloperSettings('Domain saved');
	}

	async function removeDomain(id: string) {
		setConfig({ ...config, domains: config.domains.filter((entry) => entry.id !== id) });
		await syncDeveloperSettings('Domain removed');
	}

	async function saveAzure() {
		await syncDeveloperSettings('Azure settings saved');
	}

	async function saveCloudflare() {
		await syncDeveloperSettings('Cloudflare settings saved');
	}

	async function saveAll() {
		await syncDeveloperSettings('Developer settings saved');
	}
</script>

<div class="min-h-screen bg-white">
	<header class="border-b-3 border-slate-800 bg-sky-50">
		<div class="container mx-auto max-w-6xl px-6 py-4">
			<div class="flex items-center justify-between">
				<div class="space-y-1">
					<p class="text-xs font-semibold tracking-wide text-slate-500 uppercase">
						Developer settings
					</p>
					<h1 class="text-3xl font-black text-slate-800">Bring your own infra</h1>
				</div>
				<div class="flex items-center gap-3">
					<Link
						href={ROUTES.settings}
						className="cartoon-shadow hover:cartoon-shadow-lg rounded-none border-3 border-slate-800 bg-white px-4 py-2 font-bold text-slate-800 transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
					>
						<i class="fa-solid fa-gear mr-2"></i>
						Back to settings
					</Link>
					<Link
						href={ROUTES.dashboard}
						className="cartoon-shadow hover:cartoon-shadow-lg rounded-none border-3 border-slate-800 bg-slate-800 px-4 py-2 font-bold text-white transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
					>
						<i class="fa-solid fa-table-columns mr-2"></i>
						Dashboard
					</Link>
				</div>
			</div>
		</div>
	</header>

	<main class="container mx-auto max-w-6xl px-6 py-10">
		{#if loading}
			<div class="flex items-center justify-center py-24">
				<i class="fa-solid fa-spinner fa-spin text-4xl text-sky-500"></i>
			</div>
		{:else}
			<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
				<div class="space-y-1">
					<h2 class="text-2xl font-black text-slate-800">Cloud credentials</h2>
					<p class="text-slate-600">
						Keep your Azure, Cloudflare, and domain preferences close. We store them in this browser
						so you can reuse them without hardcoding secrets in repos.
					</p>
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

			<div class="mb-6 grid gap-6 lg:grid-cols-3">
				<div
					class="cartoon-shadow rounded-none border-3 border-slate-800 bg-white p-5 lg:col-span-2"
				>
					<div class="flex items-center justify-between">
						<div>
							<h3 class="text-xl font-bold text-slate-800">Azure storage</h3>
							<p class="text-sm text-slate-600">
								Account, container, and SAS token used for uploads.
							</p>
						</div>
						<button
							on:click={saveAzure}
							class={`cartoon-shadow hover:cartoon-shadow-lg rounded-none border-3 px-3 py-2 text-xs font-bold transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 ${
								saving
									? 'cursor-not-allowed border-slate-300 bg-slate-200 text-slate-500'
									: 'border-slate-800 bg-white text-slate-800'
							}`}
							aria-label="Save Azure settings"
						>
							Save
						</button>
					</div>
					<div class="mt-4 grid gap-4 sm:grid-cols-2">
						<label class="flex flex-col gap-2 text-sm text-slate-700">
							<span class="text-xs font-semibold text-slate-500 uppercase">Account name</span>
							<input
								type="text"
								class="rounded-none border-3 border-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
								placeholder="mystorageaccount"
								bind:value={config.azure.accountName}
								on:change={(e) =>
									handleAzureChange('accountName', (e.target as HTMLInputElement).value)}
							/>
						</label>
						<label class="flex flex-col gap-2 text-sm text-slate-700">
							<span class="text-xs font-semibold text-slate-500 uppercase">Container name</span>
							<input
								type="text"
								class="rounded-none border-3 border-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
								placeholder="$web"
								bind:value={config.azure.containerName}
								on:change={(e) =>
									handleAzureChange('containerName', (e.target as HTMLInputElement).value)}
							/>
						</label>
					</div>
					<label class="mt-4 flex flex-col gap-2 text-sm text-slate-700">
						<span class="text-xs font-semibold text-slate-500 uppercase">SAS token</span>
						<textarea
							class="h-24 rounded-none border-3 border-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
							placeholder="sv=2024-02-10&ss=bfqt&srt=sco&sp=rwdlacupiytf..."
							bind:value={config.azure.sasToken}
							on:change={(e) =>
								handleAzureChange('sasToken', (e.target as HTMLTextAreaElement).value)}
						></textarea>
						<p class="text-xs text-slate-500">
							We keep SAS tokens encrypted in your account and cached locally in this browser.
						</p>
					</label>
				</div>

				<div class="cartoon-shadow rounded-none border-3 border-slate-800 bg-white p-5">
					<h3 class="text-xl font-bold text-slate-800">Storage quick notes</h3>
					<ul class="mt-3 space-y-2 text-sm text-slate-700">
						<li class="flex items-start gap-2">
							<i class="fa-solid fa-key text-sky-500"></i>
							<span>Use a SAS token scoped to the container; avoid account keys.</span>
						</li>
						<li class="flex items-start gap-2">
							<i class="fa-solid fa-clock text-amber-500"></i>
							<span>Set a short expiry on SAS tokens and refresh here when needed.</span>
						</li>
						<li class="flex items-start gap-2">
							<i class="fa-solid fa-user-shield text-emerald-600"></i>
							<span>Never commit these values to git; this screen keeps them local.</span>
						</li>
					</ul>
				</div>
			</div>

			<div class="grid gap-6 lg:grid-cols-3">
				<div
					class="cartoon-shadow rounded-none border-3 border-slate-800 bg-white p-5 lg:col-span-2"
				>
					<div class="flex items-center justify-between">
						<div>
							<h3 class="text-xl font-bold text-slate-800">Cloudflare</h3>
							<p class="text-sm text-slate-600">
								API token, account, and KV namespace for asset metadata.
							</p>
						</div>
						<button
							on:click={saveCloudflare}
							class={`cartoon-shadow hover:cartoon-shadow-lg rounded-none border-3 px-3 py-2 text-xs font-bold transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 ${
								saving
									? 'cursor-not-allowed border-slate-300 bg-slate-200 text-slate-500'
									: 'border-slate-800 bg-white text-slate-800'
							}`}
							aria-label="Save Cloudflare settings"
						>
							Save
						</button>
					</div>
					<div class="mt-4 grid gap-4 sm:grid-cols-2">
						<label class="flex flex-col gap-2 text-sm text-slate-700">
							<span class="text-xs font-semibold text-slate-500 uppercase">Account ID</span>
							<input
								type="text"
								class="rounded-none border-3 border-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
								placeholder="cf123..."
								bind:value={config.cloudflare.accountId}
								on:change={(e) =>
									handleCloudflareChange('accountId', (e.target as HTMLInputElement).value)}
							/>
						</label>
						<label class="flex flex-col gap-2 text-sm text-slate-700">
							<span class="text-xs font-semibold text-slate-500 uppercase">KV namespace ID</span>
							<input
								type="text"
								class="rounded-none border-3 border-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
								placeholder="abcd1234efgh5678"
								bind:value={config.cloudflare.namespaceId}
								on:change={(e) =>
									handleCloudflareChange('namespaceId', (e.target as HTMLInputElement).value)}
							/>
						</label>
					</div>
					<label class="mt-4 flex flex-col gap-2 text-sm text-slate-700">
						<span class="text-xs font-semibold text-slate-500 uppercase">API token</span>
						<input
							type="password"
							class="rounded-none border-3 border-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
							placeholder="Token with Workers KV and DNS permissions"
							bind:value={config.cloudflare.apiToken}
							on:change={(e) =>
								handleCloudflareChange('apiToken', (e.target as HTMLInputElement).value)}
						/>
						<p class="text-xs text-slate-500">Use a scoped token; avoid the global API key.</p>
					</label>
				</div>

				<div class="cartoon-shadow rounded-none border-3 border-slate-800 bg-white p-5">
					<h3 class="text-xl font-bold text-slate-800">Domains</h3>
					<p class="text-sm text-slate-600">
						Track which domains you point at Hostify deployments.
					</p>
					<form class="mt-4 space-y-3" on:submit|preventDefault={addDomain}>
						<label class="flex flex-col gap-2 text-sm text-slate-700">
							<span class="text-xs font-semibold text-slate-500 uppercase">Domain</span>
							<input
								type="text"
								class="rounded-none border-3 border-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
								placeholder="app.example.com"
								bind:value={newDomain.domain}
							/>
						</label>
						<label class="flex flex-col gap-2 text-sm text-slate-700">
							<span class="text-xs font-semibold text-slate-500 uppercase">Target / notes</span>
							<input
								type="text"
								class="rounded-none border-3 border-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
								placeholder="CNAME to myapp.azurewebsites.net"
								bind:value={newDomain.target}
							/>
						</label>
						<div class="flex flex-wrap items-center gap-2">
							<button
								type="submit"
								class="cartoon-shadow hover:cartoon-shadow-lg rounded-none border-3 border-slate-800 bg-sky-500 px-4 py-2 text-xs font-bold text-white transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
							>
								Add domain
							</button>
							<button
								type="button"
								on:click={saveAll}
								class={`cartoon-shadow hover:cartoon-shadow-lg rounded-none border-3 px-4 py-2 text-xs font-bold transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 ${
									saving
										? 'cursor-not-allowed border-slate-300 bg-slate-200 text-slate-500'
										: 'border-slate-800 bg-white text-slate-800'
								}`}
							>
								Save all
							</button>
						</div>
					</form>
					{#if config.domains.length === 0}
						<p
							class="mt-3 rounded-none border-2 border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600"
						>
							No domains yet. Add one to keep it handy when wiring DNS.
						</p>
					{:else}
						<ul class="mt-4 space-y-2 text-sm text-slate-700">
							{#each config.domains as domain (domain.id)}
								<li
									class="cartoon-shadow flex items-center justify-between rounded-none border-3 border-slate-800 bg-white px-3 py-2"
								>
									<div>
										<p class="font-semibold text-slate-800">{domain.domain}</p>
										{#if domain.target}
											<p class="text-xs text-slate-600">{domain.target}</p>
										{/if}
									</div>
									<button
										type="button"
										on:click={() => removeDomain(domain.id)}
										class="cartoon-shadow hover:cartoon-shadow-lg rounded-none border-3 border-slate-800 bg-white px-3 py-1 text-xs font-bold text-slate-800 transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
									>
										Remove
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</div>
		{/if}
	</main>
</div>
