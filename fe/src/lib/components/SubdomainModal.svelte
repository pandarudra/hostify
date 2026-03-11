<script lang="ts">
	import { API_ENDPOINTS } from '$lib/constants/api';
	import { getAuthHeaders } from '$lib/constants/helpers';

	export let isOpen = false;
	export let onConfirm: (subdomain: string) => void;
	export let onCancel: () => void;

	let subdomain = '';
	let checking = false;
	let validationStatus: 'idle' | 'checking' | 'available' | 'taken' | 'invalid' = 'idle';
	let validationMessage = '';
	let checkTimeout: number | null = null;

	// Generate random subdomain ID
	function generateRandomSubdomain(): string {
		const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
		let result = '';
		for (let i = 0; i < 8; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	}

	// Validate subdomain format
	function isValidSubdomainFormat(value: string): boolean {
		const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
		return subdomainRegex.test(value) && value.length >= 3 && value.length <= 63;
	}

	// Check subdomain availability with backend
	async function checkSubdomainAvailability(value: string) {
		if (!value) {
			validationStatus = 'idle';
			validationMessage = '';
			return;
		}

		if (!isValidSubdomainFormat(value)) {
			validationStatus = 'invalid';
			validationMessage = 'Use lowercase letters, numbers, and hyphens only (3-63 chars)';
			return;
		}

		validationStatus = 'checking';
		checking = true;

		try {
			const response = await fetch(
				`${API_ENDPOINTS.deploy.checkSubdomain}?subdomain=${encodeURIComponent(value)}`,
				{
					headers: getAuthHeaders()
				}
			);

			if (response.ok) {
				const data = await response.json();
				if (data.available) {
					validationStatus = 'available';
					validationMessage = '✓ Subdomain is available!';
				} else {
					validationStatus = 'taken';
					validationMessage = '✗ Subdomain is already taken';
				}
			} else {
				validationStatus = 'invalid';
				validationMessage = 'Failed to check subdomain';
			}
		} catch (error) {
			console.error('Subdomain check error:', error);
			validationStatus = 'invalid';
			validationMessage = 'Network error';
		} finally {
			checking = false;
		}
	}

	// Debounced validation
	function handleSubdomainInput(event: Event) {
		const value = (event.target as HTMLInputElement).value.toLowerCase();
		subdomain = value;

		// Clear existing timeout
		if (checkTimeout !== null) {
			clearTimeout(checkTimeout);
		}

		// Set new timeout for validation
		checkTimeout = window.setTimeout(() => {
			checkSubdomainAvailability(value);
		}, 500);
	}

	function handleGenerateRandom() {
		subdomain = generateRandomSubdomain();
		checkSubdomainAvailability(subdomain);
	}

	function handleConfirm() {
		if (validationStatus === 'available' || !subdomain) {
			const finalSubdomain = subdomain || generateRandomSubdomain();
			onConfirm(finalSubdomain);
			resetModal();
		}
	}

	function handleCancel() {
		onCancel();
		resetModal();
	}

	function resetModal() {
		subdomain = '';
		validationStatus = 'idle';
		validationMessage = '';
		if (checkTimeout !== null) {
			clearTimeout(checkTimeout);
			checkTimeout = null;
		}
	}

	$: canDeploy = validationStatus === 'available' || subdomain === '';
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 p-6"
		onclick={handleCancel}
		onkeydown={(e) => e.key === 'Escape' && handleCancel()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="cartoon-shadow w-full max-w-md rounded-none border-3 border-slate-800 bg-white p-8"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Modal Header -->
			<div class="mb-6">
				<h2 class="mb-2 text-2xl font-bold text-slate-800">
					<i class="fa-solid fa-globe mr-2"></i>
					Choose Subdomain
				</h2>
				<p class="text-sm text-slate-600">
					Your site will be available at <strong>{subdomain || 'subdomain'}.rudrax.me</strong>
				</p>
			</div>

			<!-- Subdomain Input -->
			<div class="mb-6">
				<label for="subdomain-input" class="mb-2 block text-sm font-bold text-slate-800">
					Subdomain
				</label>
				<div class="relative">
					<input
						id="subdomain-input"
						type="text"
						placeholder="my-awesome-site"
						value={subdomain}
						oninput={handleSubdomainInput}
						class="cartoon-shadow w-full rounded-none border-3 border-slate-800 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:outline-none"
					/>
					{#if checking}
						<i
							class="fa-solid fa-spinner fa-spin pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-slate-400"
						></i>
					{:else if validationStatus === 'available'}
						<i
							class="fa-solid fa-circle-check pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-green-600"
						></i>
					{:else if validationStatus === 'taken' || validationStatus === 'invalid'}
						<i
							class="fa-solid fa-circle-xmark pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-red-600"
						></i>
					{/if}
				</div>

				<!-- Validation Message -->
				{#if validationMessage}
					<p
						class={`mt-2 text-sm ${
							validationStatus === 'available'
								? 'text-green-600'
								: validationStatus === 'taken' || validationStatus === 'invalid'
									? 'text-red-600'
									: 'text-slate-600'
						}`}
					>
						{validationMessage}
					</p>
				{/if}

				<!-- Generate Random Button -->
				<button
					type="button"
					onclick={handleGenerateRandom}
					class="mt-3 text-sm font-bold text-sky-600 hover:text-sky-700"
				>
					<i class="fa-solid fa-shuffle mr-1"></i>
					Generate Random ID
				</button>

				<!-- Info Text -->
				<p class="mt-4 text-xs text-slate-500">
					<i class="fa-solid fa-info-circle mr-1"></i>
					Leave empty to auto-generate a random subdomain
				</p>
			</div>

			<!-- Action Buttons -->
			<div class="flex gap-3">
				<button
					type="button"
					onclick={handleCancel}
					class="cartoon-shadow flex-1 rounded-none border-2 border-slate-800 bg-white px-4 py-3 font-bold text-slate-800 transition-all duration-150 hover:bg-slate-50"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={handleConfirm}
					disabled={!canDeploy || checking}
					class="cartoon-shadow hover:cartoon-shadow-lg flex-1 rounded-none border-3 border-slate-800 bg-sky-500 px-4 py-3 font-bold text-white transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-300"
				>
					{#if checking}
						<i class="fa-solid fa-spinner fa-spin mr-2"></i>
						Checking...
					{:else}
						<i class="fa-solid fa-rocket mr-2"></i>
						Deploy
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
