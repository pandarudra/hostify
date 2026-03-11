<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Route } from '$lib/routes';

	export let href: Route;
	export let className: string = '';
	export let target: string = '_self';
	export let style: string = '';
</script>

<a href={resolve(href)} class={className} {target} {style} {...$$restProps}>
	<slot />
</a>
