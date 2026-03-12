<script lang="ts">
	import { API_ENDPOINTS } from '$lib/constants/api';
	import { clearAuthToken, getAuthHeaders } from '$lib/constants/helpers';
	import { ENV } from '$lib/constants/env';
	import { requireAuth } from '$lib/utils/routeGuard';
	import { onMount } from 'svelte';
	import Link from './Link.svelte';
	import { ROUTES } from '$lib/routes';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let user: any = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let deployments: any[] = [];
	let loading = true;
	let deploymentsLoading = true;
	let selectedRepo: { name: string; fullName: string; url: string } | null = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let selectedRepoDeployments: any[] = [];

	// Group deployments by repository
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	$: groupedDeployments = deployments.reduce((acc: any, deployment: any) => {
		const repoUrl = deployment.repoUrl;
		if (!acc[repoUrl]) {
			acc[repoUrl] = {
				repoUrl,
				repoName: repoUrl.split('/').pop()?.replace('.git', '') || 'Unknown',
				fullName: repoUrl.split('/').slice(-2).join('/').replace('.git', ''),
				deployments: [],
				totalCount: 0,
				liveCount: 0,
				failedCount: 0,
				deployingCount: 0
			};
		}
		acc[repoUrl].deployments.push(deployment);
		acc[repoUrl].totalCount++;

		if (deployment.status === 'active') acc[repoUrl].liveCount++;
		else if (deployment.status === 'failed') acc[repoUrl].failedCount++;
		else if (deployment.status === 'deploying') acc[repoUrl].deployingCount++;

		return acc;
	}, {});

	$: repositories = Object.values(groupedDeployments) as Array<{
		repoUrl: string;
		repoName: string;
		fullName: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		deployments: any[];
		totalCount: number;
		liveCount: number;
		failedCount: number;
		deployingCount: number;
	}>;

	// Redirect unauthenticated users to auth page
	onMount(async () => {
		if (ENV !== 'local' && !requireAuth()) {
			return; // Already redirecting
		}

		// Fetch current user data
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
					// Token might be invalid, redirect to auth
					clearAuthToken();
					window.location.href = '/auth';
				}
			}
		} catch (error) {
			console.error('Failed to fetch user:', error);
		} finally {
			loading = false;
		}

		// Fetch deployments
		fetchDeployments();
	});

	async function fetchDeployments() {
		deploymentsLoading = true;
		try {
			const response = await fetch(API_ENDPOINTS.deploy.list, {
				headers: getAuthHeaders()
			});

			if (response.ok) {
				const data = await response.json();
				deployments = data.deployments || [];
			}
		} catch (error) {
			console.error('Failed to fetch deployments:', error);
		} finally {
			deploymentsLoading = false;
		}
	}

	async function handleLogout() {
		try {
			// Call logout endpoint
			await fetch(API_ENDPOINTS.auth.logout, {
				method: 'POST',
				headers: getAuthHeaders()
			});
		} catch (error) {
			console.error('Logout error:', error);
		} finally {
			// Clear token and redirect regardless of API call result
			clearAuthToken();
			window.location.href = '/';
		}
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function openRepoModal(repo: any) {
		selectedRepo = {
			name: repo.repoName,
			fullName: repo.fullName,
			url: repo.repoUrl
		};
		selectedRepoDeployments = repo.deployments;
	}

	function closeModal() {
		selectedRepo = null;
		selectedRepoDeployments = [];
	}
</script>

<div class="min-h-screen bg-white">
	<!-- Header -->
	<header class="border-b-3 border-slate-800 bg-sky-50">
		<div class="container mx-auto max-w-7xl px-6 py-4">
			<div class="flex items-center justify-between">
				<Link
					href="/dash"
					className="text-3xl font-black text-slate-800"
					style="font-family: 'Bitcount Prop Double', sans-serif;"
					data-sveltekit-reload="off"
				>
					Hostify
				</Link>

				{#if user}
					<div class="flex items-center gap-4">
						<Link
							href={ROUTES.settings}
							className="cartoon-shadow hover:cartoon-shadow-lg flex items-center gap-3 rounded-none border-3 border-slate-800 bg-white px-3 py-2 transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
							title="Open settings"
						>
							{#if user.avatarUrl}
								<img
									src={user.avatarUrl}
									alt={user.username}
									class="h-10 w-10 rounded-full border-2 border-slate-800"
								/>
							{:else}
								<div
									class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-800 bg-sky-500 text-lg font-bold text-white"
								>
									<i class="fa-solid fa-gear"></i>
								</div>
							{/if}
							<div class="text-left">
								<p class="font-bold text-slate-800">{user.username}</p>
								<p class="text-sm text-slate-600">Settings & profile</p>
							</div>
						</Link>
						<button
							onclick={handleLogout}
							class="cartoon-shadow hover:cartoon-shadow-lg active:cartoon-shadow-sm rounded-none border-3 border-slate-800 bg-white px-4 py-2 font-bold text-slate-800 transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-red-50 active:translate-x-0.5 active:translate-y-0.5"
						>
							<i class="fa-solid fa-right-from-bracket"></i>
							Logout
						</button>
					</div>
				{/if}
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="container mx-auto max-w-7xl px-6 py-12">
		{#if loading}
			<div class="flex items-center justify-center py-20">
				<i class="fa-solid fa-spinner fa-spin text-6xl text-sky-500"></i>
			</div>
		{:else if user}
			<div class="mb-8">
				<h1 class="mb-2 text-5xl font-black text-slate-800">Dashboard</h1>
				<p class="text-xl text-slate-600">Welcome back, {user.username}! 👋</p>
			</div>

			<!-- Deploy New Site Button -->
			<div class="mb-12">
				<Link
					href={ROUTES.deploy}
					className="cartoon-shadow hover:cartoon-shadow-lg inline-block rounded-none border-3 border-slate-800 bg-sky-500 px-8 py-4 text-center transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1"
				>
					<i class="fa-solid fa-rocket mr-2 text-2xl text-white"></i>
					<span class="text-xl font-bold text-white">Deploy New Site</span>
				</Link>
			</div>

			<!-- Deployments List -->
			<div class="mb-8">
				<h2 class="mb-6 text-3xl font-bold text-slate-800">
					<i class="fa-solid fa-list mr-2"></i>
					Previous Deployments
				</h2>

				{#if deploymentsLoading}
					<div class="flex items-center justify-center py-12">
						<i class="fa-solid fa-spinner fa-spin text-4xl text-sky-500"></i>
					</div>
				{:else if deployments.length === 0}
					<div
						class="cartoon-shadow rounded-none border-3 border-slate-800 bg-sky-50 p-12 text-center"
					>
						<i class="fa-solid fa-rocket mb-4 text-6xl text-slate-400"></i>
						<h3 class="mb-3 text-2xl font-bold text-slate-800">No Deployments Yet</h3>
						<p class="mb-6 text-lg text-slate-600">
							Get started by deploying your first repository!
						</p>
						<Link
							href={ROUTES.deploy}
							className="cartoon-shadow hover:cartoon-shadow-lg inline-block rounded-none border-3 border-slate-800 bg-sky-500 px-6 py-3 font-bold text-white transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1"
						>
							<i class="fa-solid fa-rocket mr-2"></i>
							Deploy Now
						</Link>
					</div>
				{:else}
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{#each repositories as repo (repo.repoUrl)}
							<button
								onclick={() => openRepoModal(repo)}
								class="cartoon-shadow hover:cartoon-shadow-lg rounded-none border-3 border-slate-800 bg-white p-6 text-left transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
							>
								<div class="mb-4">
									<h3 class="mb-2 text-xl font-bold text-slate-800">
										<i class="fa-brands fa-github mr-2"></i>
										{repo.repoName}
									</h3>
									<p class="mb-3 text-sm text-slate-600">
										{repo.fullName}
									</p>
									<div class="flex flex-wrap gap-2">
										{#if repo.liveCount > 0}
											<span
												class="rounded-none border-2 border-slate-800 bg-green-100 px-2 py-1 text-xs font-bold text-green-800"
											>
												✓ {repo.liveCount} Live
											</span>
										{/if}
										{#if repo.failedCount > 0}
											<span
												class="rounded-none border-2 border-slate-800 bg-red-100 px-2 py-1 text-xs font-bold text-red-800"
											>
												✗ {repo.failedCount} Failed
											</span>
										{/if}
										{#if repo.deployingCount > 0}
											<span
												class="rounded-none border-2 border-slate-800 bg-yellow-100 px-2 py-1 text-xs font-bold text-yellow-800"
											>
												⏳ {repo.deployingCount} Deploying
											</span>
										{/if}
									</div>
								</div>

								<div class="flex items-center justify-between text-sm text-slate-600">
									<span>
										<i class="fa-solid fa-server mr-1"></i>
										{repo.totalCount}
										{repo.totalCount === 1 ? 'deployment' : 'deployments'}
									</span>
									<i class="fa-solid fa-arrow-right text-lg"></i>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</main>

	<!-- Repository Deployments Modal -->
	{#if selectedRepo}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-6"
			onclick={closeModal}
			onkeydown={(e) => e.key === 'Escape' && closeModal()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				class="cartoon-shadow max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-none border-3 border-slate-800 bg-white p-8"
				onclick={(e) => e.stopPropagation()}
			>
				<!-- Modal Header -->
				<div class="mb-6 flex items-start justify-between">
					<div class="flex-1">
						<h2 class="mb-2 text-3xl font-bold text-slate-800">
							<i class="fa-brands fa-github mr-2"></i>
							{selectedRepo.name}
						</h2>
						<p class="text-slate-600">{selectedRepo.fullName}</p>
					</div>
					<button
						onclick={closeModal}
						class="text-3xl text-slate-600 hover:text-slate-800"
						aria-label="Close modal"
					>
						<i class="fa-solid fa-xmark"></i>
					</button>
				</div>

				<!-- Deployments List -->
				<div class="mb-4">
					<h3 class="mb-4 text-xl font-bold text-slate-800">
						<i class="fa-solid fa-list mr-2"></i>
						All Deployments ({selectedRepoDeployments.length})
					</h3>

					<div class="space-y-3">
						{#each selectedRepoDeployments as deployment (deployment.id || deployment.subdomain)}
							<div class="cartoon-shadow rounded-none border-2 border-slate-800 bg-white p-4">
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<div class="mb-2 flex items-center gap-3">
											<h4 class="text-lg font-bold text-slate-800">
												{deployment.subdomain}.rudrax.me
											</h4>
											<span
												class={`rounded-none border-2 border-slate-800 px-2 py-1 text-xs font-bold ${
													deployment.status === 'active'
														? 'bg-green-100 text-green-800'
														: deployment.status === 'deploying'
															? 'bg-yellow-100 text-yellow-800'
															: 'bg-red-100 text-red-800'
												}`}
											>
												{deployment.status === 'active'
													? '✓ Live'
													: deployment.status === 'deploying'
														? '⏳ Deploying'
														: '✗ Failed'}
											</span>
										</div>
										<p class="text-xs text-slate-500">
											<i class="fa-solid fa-clock mr-1"></i>
											Deployed {new Date(deployment.createdAt).toLocaleDateString()}
										</p>
									</div>
									{#if deployment.status === 'active'}
										<a
											href={deployment.deploymentUrl}
											target="_blank"
											rel="noopener noreferrer external"
											class="cartoon-shadow hover:cartoon-shadow-lg rounded-none border-2 border-slate-800 bg-sky-500 px-4 py-2 font-bold text-white transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
										>
											<i class="fa-solid fa-external-link mr-2"></i>
											Visit
										</a>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
