<script lang="ts">
	import { onMount } from 'svelte';
	import { requireAuth } from '$lib/utils/routeGuard';
	import { API_ENDPOINTS } from '$lib/constants/api';
	import { getAuthHeaders } from '$lib/constants/helpers';
	import Link from '$lib/components/Link.svelte';
	import SubdomainModal from '$lib/components/SubdomainModal.svelte';

	let repositories: any[] = [];
	let filteredRepos: any[] = [];
	let searchQuery = '';
	let loading = true;
	let deploying = false;
	let deploymentResult: { success: boolean; message: string; url?: string } | null = null;
	let selectedRepo: any = null;
	let repoDeployments: any[] = [];
	let loadingDeployments = false;
	let showSubdomainModal = false;
	let repoToDeploy: any = null;
	const MAX_SUGGESTIONS = 6;

	// Reactive search filtering - automatically updates when searchQuery or repositories change
	$: filteredRepos = (() => {
		const query = searchQuery.toLowerCase().trim();
		if (!query) {
			return repositories.slice(0, MAX_SUGGESTIONS);
		} else {
			const filtered = repositories.filter(
				(repo) =>
					repo.name.toLowerCase().includes(query) ||
					repo.fullName.toLowerCase().includes(query) ||
					repo.description?.toLowerCase().includes(query)
			);
			return filtered.slice(0, MAX_SUGGESTIONS);
		}
	})();

	// Redirect unauthenticated users to auth page
	onMount(async () => {
		if (!requireAuth()) return;

		// Fetch repositories
		try {
			const response = await fetch(API_ENDPOINTS.repo.list, {
				headers: getAuthHeaders()
			});

			if (response.ok) {
				const data = await response.json();
				repositories = data.repositories || [];
				// filteredRepos will be set automatically by reactive statement
			}
		} catch (error) {
			console.error('Failed to fetch repositories:', error);
		} finally {
			loading = false;
		}
	});

	async function openRepoModal(repo: any) {
		selectedRepo = repo;
		loadingDeployments = true;
		repoDeployments = [];

		try {
			const response = await fetch(API_ENDPOINTS.deploy.list, {
				headers: getAuthHeaders()
			});

			if (response.ok) {
				const data = await response.json();
				const allDeployments = data.deployments || [];
				// Filter deployments for this specific repo
				repoDeployments = allDeployments.filter(
					(d: any) =>
						d.repoUrl === repo.htmlUrl ||
						d.repoUrl === repo.cloneUrl ||
						d.repoUrl.includes(repo.fullName)
				);
			}
		} catch (error) {
			console.error('Failed to fetch repo deployments:', error);
		} finally {
			loadingDeployments = false;
		}
	}

	function closeModal() {
		selectedRepo = null;
		repoDeployments = [];
	}

	function handleDeploy(repo: any) {
		// Store the repo and show subdomain modal
		repoToDeploy = repo;
		showSubdomainModal = true;
	}

	function handleSubdomainCancel() {
		showSubdomainModal = false;
		repoToDeploy = null;
	}

	async function handleSubdomainConfirm(subdomain: string) {
		showSubdomainModal = false;

		if (!repoToDeploy) return;

		deploying = true;
		deploymentResult = null;

		try {
			console.log('Deploying repo:', repoToDeploy);
			console.log('Repo URL:', repoToDeploy.htmlUrl);
			console.log('Subdomain:', subdomain);

			const response = await fetch(API_ENDPOINTS.deploy.create, {
				method: 'POST',
				headers: {
					...getAuthHeaders(),
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					repoUrl: repoToDeploy.cloneUrl,
					subdomain: subdomain
				})
			});

			const data = await response.json();

			console.log(data);

			if (response.ok) {
				deploymentResult = {
					success: true,
					message: 'Deployment started successfully!',
					url: data.deployment?.url
				};

				// If modal is open, refresh the deployments list
				if (selectedRepo) {
					await openRepoModal(selectedRepo);
				}
			} else {
				deploymentResult = {
					success: false,
					message: data.error || data.message || 'Failed to deploy repository'
				};
			}
		} catch (error) {
			console.error('Deployment error:', error);
			deploymentResult = {
				success: false,
				message: 'Network error. Please try again.'
			};
		} finally {
			deploying = false;
			repoToDeploy = null;
		}
	}
</script>

<div class="min-h-screen bg-white">
	<!-- Header -->
	<header class="border-b-3 border-slate-800 bg-sky-50">
		<div class="container mx-auto max-w-7xl px-6 py-4">
			<div class="flex items-center justify-between">
				<Link href="/dash" className="text-3xl font-black text-slate-800">
					<span style="font-family: 'Bitcount Prop Double', sans-serif;">Hostify</span>
				</Link>
				<Link
					href="/dash"
					className="cartoon-shadow hover:cartoon-shadow-lg rounded-none border-2 border-slate-800 bg-white px-4 py-2 font-bold text-slate-800 transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
				>
					<i class="fa-solid fa-arrow-left mr-2"></i>
					Back to Dashboard
				</Link>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="container mx-auto max-w-5xl px-6 py-12">
		<div class="mb-8">
			<h1 class="mb-2 text-5xl font-black text-slate-800">
				<i class="fa-solid fa-rocket mr-3"></i>
				Deploy New Site
			</h1>
			<p class="text-xl text-slate-600">Search and deploy your GitHub repositories</p>
		</div>

		<!-- Deployment Result -->
		{#if deploymentResult}
			<div
				class={`cartoon-shadow mb-8 rounded-none border-3 border-slate-800 p-6 ${
					deploymentResult.success ? 'bg-green-50' : 'bg-red-50'
				}`}
			>
				<div class="flex items-start gap-4">
					<i
						class={`text-4xl ${
							deploymentResult.success
								? 'fa-solid fa-circle-check text-green-600'
								: 'fa-solid fa-circle-xmark text-red-600'
						}`}
					></i>
					<div class="flex-1">
						<h3 class="mb-2 text-xl font-bold text-slate-800">
							{deploymentResult.success ? 'Deployment Started!' : 'Deployment Failed'}
						</h3>
						<p class="mb-4 text-slate-700">{deploymentResult.message}</p>
						{#if deploymentResult.success && deploymentResult.url}
							<a
								href={deploymentResult.url}
								target="_blank"
								rel="noopener noreferrer"
								class="cartoon-shadow hover:cartoon-shadow-lg inline-block rounded-none border-2 border-slate-800 bg-sky-500 px-4 py-2 font-bold text-white transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
							>
								<i class="fa-solid fa-external-link mr-2"></i>
								Visit Site
							</a>
							<Link
								href="/dash"
								className="ml-3 inline-block rounded-none border-2 border-slate-800 bg-white px-4 py-2 font-bold text-slate-800 transition-all duration-150 hover:bg-slate-50"
							>
								View All Deployments
							</Link>
						{/if}
					</div>
					<button
						onclick={() => (deploymentResult = null)}
						class="text-2xl text-slate-600 hover:text-slate-800"
						aria-label="Close notification"
					>
						<i class="fa-solid fa-xmark"></i>
					</button>
				</div>
			</div>
		{/if}

		<!-- Search Box -->
		<div class="mb-8">
			<div class="cartoon-shadow relative rounded-none border-3 border-slate-800 bg-white">
				<i
					class="fa-solid fa-search pointer-events-none absolute top-1/2 left-6 -translate-y-1/2 text-2xl text-slate-400"
				></i>
				<input
					type="text"
					placeholder="Search repositories..."
					bind:value={searchQuery}
					class="w-full border-none bg-transparent py-5 pr-6 pl-16 text-lg text-slate-800 placeholder-slate-400 focus:outline-none"
				/>
			</div>
			<p class="mt-2 text-sm text-slate-600">
				<i class="fa-solid fa-info-circle mr-1"></i>
				Showing {filteredRepos.length} of {repositories.length}
				{repositories.length === 1 ? 'repository' : 'repositories'}
			</p>
		</div>

		<!-- Repositories List -->
		{#if loading}
			<div class="flex items-center justify-center py-20">
				<i class="fa-solid fa-spinner fa-spin text-6xl text-sky-500"></i>
			</div>
		{:else if filteredRepos.length === 0}
			<div class="cartoon-shadow rounded-none border-3 border-slate-800 bg-sky-50 p-12 text-center">
				<i class="fa-solid fa-search mb-4 text-6xl text-slate-400"></i>
				<h3 class="mb-3 text-2xl font-bold text-slate-800">No Repositories Found</h3>
				<p class="text-lg text-slate-600">
					{searchQuery
						? 'Try a different search term'
						: 'No repositories available in your GitHub account'}
				</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each filteredRepos as repo (repo.id)}
					<button
						onclick={() => openRepoModal(repo)}
						class="cartoon-shadow hover:cartoon-shadow-lg w-full rounded-none border-3 border-slate-800 bg-white p-6 text-left transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
					>
						<div class="flex items-center gap-6">
							<div class="flex-1">
								<h3 class="mb-2 text-xl font-bold text-slate-800">
									<i class="fa-brands fa-github mr-2"></i>
									{repo.name}
								</h3>
								<p class="mb-2 text-sm text-slate-500">{repo.fullName}</p>
								{#if repo.description}
									<p class="mb-3 text-slate-600">{repo.description}</p>
								{/if}
								<div class="flex flex-wrap gap-3 text-sm text-slate-600">
									{#if repo.language}
										<span class="flex items-center gap-1">
											<i class="fa-solid fa-code"></i>
											{repo.language}
										</span>
									{/if}
									{#if repo.stars > 0}
										<span class="flex items-center gap-1">
											<i class="fa-solid fa-star"></i>
											{repo.stars}
										</span>
									{/if}
									<span class="flex items-center gap-1">
										<i class="fa-solid fa-lock{repo.isPrivate ? '' : '-open'}"></i>
										{repo.isPrivate ? 'Private' : 'Public'}
									</span>
								</div>
							</div>
							<div
								class="cartoon-shadow flex h-14 w-14 shrink-0 items-center justify-center rounded-none border-3 border-slate-800 bg-sky-500 text-2xl text-white"
							>
								<i class="fa-solid fa-arrow-right"></i>
							</div>
						</div>
					</button>
				{/each}
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

				<!-- Deploy New Button -->
				<button
					onclick={() => handleDeploy(selectedRepo)}
					disabled={deploying}
					class="cartoon-shadow hover:cartoon-shadow-lg mb-6 w-full rounded-none border-3 border-slate-800 bg-sky-500 px-6 py-4 font-bold text-white transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-300"
				>
					{#if deploying}
						<i class="fa-solid fa-spinner fa-spin mr-2"></i>
						Deploying...
					{:else}
						<i class="fa-solid fa-rocket mr-2"></i>
						Deploy New Instance
					{/if}
				</button>

				<!-- Deployments List -->
				<div class="mb-4">
					<h3 class="mb-4 text-xl font-bold text-slate-800">
						<i class="fa-solid fa-list mr-2"></i>
						Existing Deployments
						<span class="text-sm text-slate-500"> (.rudrax.me is your hosted domain) </span>
					</h3>

					{#if loadingDeployments}
						<div class="flex items-center justify-center py-12">
							<i class="fa-solid fa-spinner fa-spin text-4xl text-sky-500"></i>
						</div>
					{:else if repoDeployments.length === 0}
						<div
							class="cartoon-shadow rounded-none border-2 border-slate-800 bg-sky-50 p-8 text-center"
						>
							<i class="fa-solid fa-circle-info mb-3 text-5xl text-slate-400"></i>
							<p class="text-lg text-slate-600">No deployments yet. Deploy your first instance!</p>
						</div>
					{:else}
						<div class="space-y-3">
							{#each repoDeployments as deployment (deployment._id || deployment.subdomain)}
								<div class="cartoon-shadow rounded-none border-2 border-slate-800 bg-white p-4">
									<div class="flex items-center justify-between">
										<div class="flex-1">
											<div class="mb-2 flex items-center gap-3">
												<h4 class="text-lg font-bold text-slate-800">
													{deployment.subdomain}.rudrax.me
												</h4>
												<span
													class={`rounded-none border-2 border-slate-800 px-2 py-1 text-xs font-bold ${
														deployment.status === 'deployed'
															? 'bg-green-100 text-green-800'
															: deployment.status === 'deploying'
																? 'bg-yellow-100 text-yellow-800'
																: 'bg-red-100 text-red-800'
													}`}
												>
													{deployment.status === 'deployed'
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
										{#if deployment.status === 'deployed'}
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
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Subdomain Selection Modal -->
	<SubdomainModal
		isOpen={showSubdomainModal}
		onConfirm={handleSubdomainConfirm}
		onCancel={handleSubdomainCancel}
	/>
</div>
