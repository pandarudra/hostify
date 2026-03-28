<script lang="ts">
	import { API_ENDPOINTS } from '$lib/constants/api';
	import { getAuthHeaders } from '$lib/constants/helpers';

	let user: any = null;

	const fetchUserInfo = async () => {
		const res = await fetch(API_ENDPOINTS.auth.me, {
			headers: getAuthHeaders()
		});
		user = await res.json();
		console.log(user.user);
	};
</script>

<div class="flex h-screen w-full flex-col items-center justify-center">
	<button
		class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
		on:click={fetchUserInfo}>Fetch User Info</button
	>
</div>
