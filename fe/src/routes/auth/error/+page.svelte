<script lang="ts">
	import { onMount } from 'svelte';
	import Link from '$lib/components/Link.svelte';

	let errorMessage = 'An error occurred during authentication';

	onMount(() => {
		// Get error message from URL
		const urlParams = new URLSearchParams(window.location.search);
		const message = urlParams.get('message');

		if (message) {
			errorMessage = decodeURIComponent(message);
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-linear-to-br from-red-50 to-white p-6">
	<div class="w-full max-w-md text-center">
		<div class="cartoon-shadow-lg rounded-none border-3 border-slate-800 bg-white p-8 md:p-12">
			<!-- Error Icon -->
			<div class="mb-6">
				<i class="fa-solid fa-triangle-exclamation text-6xl text-red-500"></i>
			</div>

			<!-- Error Message -->
			<h2 class="mb-4 text-2xl font-bold text-slate-800">Authentication Failed</h2>
			<p class="mb-8 leading-relaxed text-slate-600">{errorMessage}</p>

			<!-- Action Buttons -->
			<div class="space-y-4">
				<Link
					href="/auth"
					className="cartoon-shadow hover:cartoon-shadow-lg active:cartoon-shadow-sm rounded-none border-3 border-slate-800 bg-slate-800 px-8 py-4 text-lg font-bold text-white transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-slate-700 active:translate-x-0.5 active:translate-y-0.5 inline-block w-full"
				>
					Try Again
				</Link>
				<Link
					href="/"
					className="cartoon-shadow hover:cartoon-shadow-lg active:cartoon-shadow-sm rounded-none border-3 border-slate-800 bg-white px-8 py-4 text-lg font-bold text-slate-800 transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-sky-50 active:translate-x-0.5 active:translate-y-0.5 inline-block w-full"
				>
					Back to Home
				</Link>
			</div>

			<!-- Help Text -->
			<div class="mt-8 border-t-2 border-slate-200 pt-6">
				<p class="text-sm text-slate-500">
					<strong>Common issues:</strong>
				</p>
				<ul class="mt-3 space-y-2 text-left text-sm text-slate-600">
					<li class="flex items-start gap-2">
						<i class="fa-solid fa-circle mt-1.5 text-xs text-slate-400"></i>
						<span>GitHub OAuth is not configured properly</span>
					</li>
					<li class="flex items-start gap-2">
						<i class="fa-solid fa-circle mt-1.5 text-xs text-slate-400"></i>
						<span>Database connection failed</span>
					</li>
					<li class="flex items-start gap-2">
						<i class="fa-solid fa-circle mt-1.5 text-xs text-slate-400"></i>
						<span>Network or timeout issues</span>
					</li>
				</ul>
			</div>
		</div>
	</div>
</div>
