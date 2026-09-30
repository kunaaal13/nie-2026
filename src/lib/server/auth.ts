import { getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { betterAuth } from 'better-auth';
import { eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { adminUsers } from '$lib/server/db/schema';

type RequiredEnv = Env & { DB: D1Database; BETTER_AUTH_SECRET: string; ADMIN_SETUP_TOKEN?: string };

export function requireEnv(): RequiredEnv {
	const env = getRequestEvent().platform?.env as RequiredEnv | undefined;
	if (!env?.DB || !env.BETTER_AUTH_SECRET) error(503, 'Database or authentication is not configured.');
	return env;
}

export function createAuth(env: RequiredEnv, origin: string, allowSignUp = false) {
	return betterAuth({
		appName: 'NIE Read India Admin',
		database: env.DB,
		secret: env.BETTER_AUTH_SECRET,
		baseURL: origin,
		emailAndPassword: { enabled: true, disableSignUp: !allowSignUp },
		advanced: { useSecureCookies: origin.startsWith('https://') }
	});
}

export async function requireAdmin() {
	const event = getRequestEvent();
	const env = requireEnv();
	const auth = createAuth(env, event.url.origin);
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (!session) error(401, 'Sign in to continue.');
	const [admin] = await getDb(env.DB).select().from(adminUsers)
		.where(eq(adminUsers.email, session.user.email.toLowerCase())).limit(1);
	if (!admin) error(403, 'Admin access is required.');
	return { user: session.user, session: session.session, env };
}

export async function getAdminSession() {
	try {
		return await requireAdmin();
	} catch {
		return null;
	}
}
