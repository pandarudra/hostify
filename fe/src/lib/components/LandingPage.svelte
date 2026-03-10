<script lang="ts">
	import { onMount } from 'svelte';
	import { features } from '$lib/mock/landing';
	import { ROUTES } from '$lib/routes';
	import { isAuthenticated } from '$lib';
	import Link from './Link.svelte';

	let authenticated = false;

	onMount(() => {
		authenticated = isAuthenticated();
	});
</script>

<div class="min-h-screen bg-white">
	<!-- Hero Section -->
	<section class="border-b-4 border-sky-500 bg-sky-50 py-20 pb-24">
		<div class="container mx-auto max-w-7xl px-6">
			<div class="mx-auto max-w-3xl text-center">
				<h1 class="mb-6 text-6xl leading-tight font-black tracking-tight text-slate-800">
					Deploy Your Sites Instantly
				</h1>
				<p class="mb-10 text-xl leading-relaxed text-slate-600">
					<span style="font-family: 'Bitcount Prop Double', sans-serif;">Hostify</span> makes it simple
					to deploy static sites directly from your GitHub repositories. No complex setup, no headaches.
				</p>
				<div class="flex flex-wrap justify-center gap-6">
					<Link
						href={authenticated ? '/dash' : ROUTES.auth}
						className="cartoon-shadow hover:cartoon-shadow-lg active:cartoon-shadow-sm rounded-none border-3 border-slate-800 bg-white px-8 py-4 text-lg font-bold text-slate-800 transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-sky-50 active:translate-x-0.5 active:translate-y-0.5"
					>
						{authenticated ? 'Go to Dashboard' : 'Get Started'}
					</Link>
					<a
						href="#features"
						class="cartoon-shadow hover:cartoon-shadow-lg active:cartoon-shadow-sm rounded-none border-3 border-slate-800 bg-white px-8 py-4 text-lg font-bold text-slate-800 transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-sky-50 active:translate-x-0.5 active:translate-y-0.5"
					>
						Learn More
					</a>
				</div>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section id="features" class="bg-white py-20">
		<div class="container mx-auto max-w-7xl px-6">
			<h2 class="mb-12 text-center text-5xl font-black text-slate-800">
				Why Choose <span style="font-family: 'Bitcount Prop Double', sans-serif;">Hostify</span>?
			</h2>
			<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
				{#each features as feature (feature.title)}
					<div
						class="cartoon-shadow hover:cartoon-shadow-lg rounded-none border-3 border-slate-800 bg-white p-8 transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-sky-50"
					>
						<div class="mb-4 text-5xl">
							<i class={feature.icon}></i>
						</div>
						<h3 class="mb-3 text-2xl font-extrabold text-slate-800">{feature.title}</h3>
						<p class="leading-relaxed text-slate-600">{feature.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="border-y-4 border-slate-800 bg-sky-500 py-20">
		<div class="container mx-auto max-w-7xl px-6">
			<div class="mx-auto max-w-2xl text-center">
				<h2 class="mb-4 text-5xl font-black text-white">Ready to Deploy?</h2>
				<p class="mb-8 text-xl text-white opacity-95">
					Join developers who trust <span style="font-family: 'Bitcount Prop Double', sans-serif;"
						>Hostify</span
					> for their deployments.
				</p>
				<Link
					href={ROUTES.auth}
					className="cartoon-shadow hover:cartoon-shadow-lg active:cartoon-shadow-sm rounded-none border-3 border-white bg-white px-8 py-4 text-lg font-bold text-sky-500 transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-sky-50 active:translate-x-0.5 active:translate-y-0.5"
				>
					Get Started
				</Link>
			</div>
		</div>
	</section>
</div>
