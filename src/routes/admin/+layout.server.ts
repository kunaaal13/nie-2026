import { requireAdmin } from '$lib/server/auth';
import { isHttpError, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url, setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });
	if (url.pathname === '/admin/login' || url.pathname === '/admin/setup') return { admin: null };
	try {
		const { user } = await requireAdmin();
		return { admin: { name: user.name, email: user.email } };
	} catch (cause) {
		if (isHttpError(cause, 401)) redirect(303, '/admin/login');
		throw cause;
	}
};
