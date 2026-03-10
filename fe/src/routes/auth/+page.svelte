<script lang="ts">
	import { onMount } from 'svelte';
	import AuthPage from '$lib/components/AuthPage.svelte';
	import { redirectIfAuthenticated } from '$lib';

	// Redirect authenticated users to dashboard
	onMount(() => {
		redirectIfAuthenticated();
	});
</script>

<AuthPage />
