import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { AUTH_TOKEN_COOKIE_NAME } from '$lib/constants/env';

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get(AUTH_TOKEN_COOKIE_NAME);

	if (token) {
		throw redirect(303, '/dash');
	}

	return {};
};
