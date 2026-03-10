<script lang="ts">
	import { onMount } from 'svelte';
	import { setAuthToken } from '$lib/constants/helpers';

	let status = 'processing';
	let message = 'Processing authentication...';

	onMount(() => {
		// Get token from URL
		const urlParams = new URLSearchParams(window.location.search);
		const token = urlParams.get('token');

		if (token) {
			// Store token using centralized helper
			setAuthToken(token);
			status = 'success';
			message = 'Authentication successful! Redirecting...';

			// Redirect to dashboard after a short delay
			setTimeout(() => {
				window.location.href = '/dash';
			}, 1500);
		} else {
			status = 'error';
			message = 'No authentication token received';
			// Redirect back to auth page after delay
			setTimeout(() => {
				window.location.href = '/auth';
			}, 3000);
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-linear-to-br from-sky-50 to-white p-6">
	<div class="w-full max-w-md text-center">
		<div class="cartoon-shadow-lg rounded-none border-3 border-slate-800 bg-white p-8 md:p-12">
			{#if status === 'processing'}
				<!-- Loading -->
				<div class="mb-6">
					<i class="fa-solid fa-spinner fa-spin text-6xl text-sky-500"></i>
				</div>
				<h2 class="mb-3 text-2xl font-bold text-slate-800">Processing...</h2>
				<p class="text-slate-600">{message}</p>
			{:else if status === 'success'}
				<!-- Success -->
				<div class="mb-6">
					<i class="fa-solid fa-circle-check text-6xl text-green-500"></i>
				</div>
				<h2 class="mb-3 text-2xl font-bold text-slate-800">Success!</h2>
				<p class="text-slate-600">{message}</p>
			{:else}
				<!-- Error -->
				<div class="mb-6">
					<i class="fa-solid fa-circle-xmark text-6xl text-red-500"></i>
				</div>
				<h2 class="mb-3 text-2xl font-bold text-slate-800">Error</h2>
				<p class="mb-6 text-slate-600">{message}</p>
				<button
					onclick={() => (window.location.href = '/auth')}
					class="cartoon-shadow hover:cartoon-shadow-lg active:cartoon-shadow-sm inline-block rounded-none border-3 border-slate-800 bg-white px-6 py-3 text-lg font-bold text-slate-800 transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-sky-50 active:translate-x-0.5 active:translate-y-0.5"
				>
					Try Again
				</button>
			{/if}
		</div>
	</div>
</div>
