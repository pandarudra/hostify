<script lang="ts">
	import { API_ENDPOINTS } from '$lib/constants/api';

	function handleGitHubLogin() {
		window.location.href = API_ENDPOINTS.auth.github;
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-linear-to-br from-sky-50 to-white p-6">
	<div class="w-full max-w-md">
		<!-- Auth Card -->
		<div
			class="cartoon-shadow-lg rounded-none border-3 border-slate-800 bg-white p-8 text-center md:p-12"
		>
			<!-- Logo/Brand -->
			<div class="mb-8">
				<h1
					class="mb-4 text-5xl font-black text-slate-800 md:text-6xl"
					style="font-family: 'Bitcount Prop Double', sans-serif;"
				>
					Hostify
				</h1>
				<p class="text-lg text-slate-600">Deploy your sites with ease</p>
			</div>

			<!-- Welcome Message -->
			<div class="mb-8">
				<h2 class="mb-3 text-2xl font-bold text-slate-800">Welcome!</h2>
				<p class="leading-relaxed text-slate-600">
					Sign in with GitHub to start deploying your repositories instantly.
				</p>
			</div>

			<!-- GitHub Login Button -->
			<button
				onclick={handleGitHubLogin}
				class="cartoon-shadow hover:cartoon-shadow-lg active:cartoon-shadow-sm flex w-full items-center justify-center gap-3 rounded-none border-3 border-slate-800 bg-slate-800 px-8 py-4 text-lg font-bold text-white transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:bg-slate-700 active:translate-x-0.5 active:translate-y-0.5"
			>
				<i class="fa-brands fa-github text-2xl"></i>
				<span>Continue with GitHub</span>
			</button>

			<!-- Info Text -->
			<p class="mt-6 text-sm text-slate-500">
				By signing in, you agree to connect your GitHub account with Hostify
			</p>
		</div>

		<!-- Features List -->
		<div class="mt-8 space-y-4">
			<div class="flex items-start gap-3">
				<i class="fa-solid fa-check mt-1 text-xl text-sky-500"></i>
				<p class="text-slate-700">
					<span class="font-bold">Secure OAuth:</span> We only access your repositories and webhooks
				</p>
			</div>
			<div class="flex items-start gap-3">
				<i class="fa-solid fa-check mt-1 text-xl text-sky-500"></i>
				<p class="text-slate-700">
					<span class="font-bold">Auto Deploy:</span> Every push automatically triggers a deployment
				</p>
			</div>
			<div class="flex items-start gap-3">
				<i class="fa-solid fa-check mt-1 text-xl text-sky-500"></i>
				<p class="text-slate-700">
					<span class="font-bold">Free Subdomain:</span> Get a custom subdomain for each project
				</p>
			</div>
		</div>
	</div>
</div>
