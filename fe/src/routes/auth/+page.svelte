<script lang="ts">
	import { onMount } from 'svelte';
	import AuthPage from '$lib/components/AuthPage.svelte';
	import { redirectIfAuthenticated } from '$lib';

	// Redirect authenticated users to dashboard
	onMount(() => {
		redirectIfAuthenticated();
	});
</script>

<svelte:head>
	<title>Sign in | Hostify</title>
	<meta
		name="description"
		content="Authenticate with GitHub to access your Hostify dashboard and deploy static sites securely."
	/>
	<meta property="og:title" content="Sign in | Hostify" />
	<meta
		property="og:description"
		content="Log in to Hostify to manage deployments, view statuses, and ship updates from GitHub."
	/>
</svelte:head>

<AuthPage />
