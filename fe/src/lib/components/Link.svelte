<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Route } from '$lib/routes';

	export let href: Route;
	export let className: string = '';
</script>

<a href={resolve(href)} class={className}>
	<slot />
</a>
