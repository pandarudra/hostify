<script lang="ts">
	import { onMount } from 'svelte';
	import { setAuthToken, getAuthHeaders } from '$lib/constants/helpers';
	import { API_ENDPOINTS } from '$lib/constants/api';

	type Status = 'processing' | 'success' | 'error' | 'otp';

	let status: Status = 'processing';
	let message = 'Processing authentication...';
	let code = '';
	let verifying = false;
	let pendingToken: string | null = null;
	let errorDetail = '';

	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const token = urlParams.get('token');
		const twoFactor = urlParams.get('twoFactor');
		console.log(urlParams)

		if (twoFactor === 'required' && token) {
			pendingToken = token;
			status = 'otp';
			message = 'Enter the verification code sent to your email.';
			return;
		}

		if (token) {
			setAuthToken(token);
			status = 'success';
			message = 'Authentication successful! Redirecting...';
			setTimeout(() => {
				window.location.href = '/dash';
			}, 1500);
		} else {
			status = 'error';
			message = 'No authentication token received';
			setTimeout(() => {
				window.location.href = '/auth';
			}, 3000);
		}
	});

	async function verifyCode() {
		if (!pendingToken) {
			status = 'error';
			message = 'Session expired. Please sign in again.';
			return;
		}

		const trimmed = code.trim();
		if (!trimmed) {
			errorDetail = 'Enter the 6-digit code from your email.';
			return;
		}

		verifying = true;
		errorDetail = '';
		try {
			const res = await fetch(API_ENDPOINTS.auth.twoFactorVerify, {
				method: 'POST',
				headers: {
					...getAuthHeaders(pendingToken),
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ code: trimmed })
			});

			const data = await res.json().catch(() => ({}));
			if (res.ok && data?.token) {
				setAuthToken(data.token);
				status = 'success';
				message = 'Two-factor verified! Redirecting...';
				setTimeout(() => {
					window.location.href = '/dash';
				}, 1200);
				return;
			}

			errorDetail = data?.message || 'Invalid or expired code. Try again.';
		} catch (error) {
			console.error('2FA verification failed', error);
			errorDetail = 'Could not verify code. Please try again.';
		} finally {
			verifying = false;
		}
	}
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
			{:else if status === 'otp'}
				<div class="mb-6">
					<i class="fa-solid fa-shield-halved text-6xl text-sky-500"></i>
				</div>
				<h2 class="mb-3 text-2xl font-bold text-slate-800">Two-factor required</h2>
				<p class="mb-4 text-slate-600">{message}</p>
				<div class="space-y-3">
					<input
						type="text"
						inputmode="numeric"
						maxlength="6"
						class="w-full rounded-none border-3 border-slate-800 px-3 py-2 text-center text-lg tracking-widest focus:ring-2 focus:ring-sky-500 focus:outline-none"
						placeholder="123456"
						bind:value={code}
						autocomplete="one-time-code"
					/>
					{#if errorDetail}
						<p class="text-sm font-semibold text-red-600">{errorDetail}</p>
					{/if}
					<button
						onclick={verifyCode}
						disabled={verifying}
						class={`cartoon-shadow hover:cartoon-shadow-lg active:cartoon-shadow-sm inline-block w-full rounded-none border-3 px-6 py-3 text-lg font-bold transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 ${
							verifying
								? 'cursor-not-allowed border-slate-300 bg-slate-200 text-slate-500'
								: 'border-slate-800 bg-sky-500 text-white'
						}`}
					>
						{verifying ? 'Verifying...' : 'Verify and continue'}
					</button>
					<p class="text-xs text-slate-500">Code expires in 10 minutes. Check spam if you don't see it.</p>
				</div>
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
