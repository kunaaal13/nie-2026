import { command, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { createAuth, requireEnv } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { adminUsers, authUser } from '$lib/server/db/schema';

const setupSchema = z.object({
	token: z.string().min(20),
	name: z.string().trim().min(2).max(120),
	email: z.email().transform((value) => value.trim().toLowerCase()),
	password: z.string().min(12).max(128)
});

export const setupAdmin = command(setupSchema, async (input) => {
	const event = getRequestEvent();
	const env = requireEnv();
	if (!env.ADMIN_SETUP_TOKEN || input.token !== env.ADMIN_SETUP_TOKEN) error(403, 'Invalid setup token.');
	const db = getDb(env.DB);
	const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(adminUsers);
	if (count !== 0) error(409, 'The first admin has already been created.');
	const [existing] = await db.select({ id: authUser.id }).from(authUser)
		.where(eq(authUser.email, input.email)).limit(1);
	if (existing) error(409, 'This email already has a login.');
	const auth = createAuth(env, event.url.origin, true);
	await auth.api.signUpEmail({ body: { name: input.name, email: input.email, password: input.password } });
	await db.insert(adminUsers).values({ email: input.email, createdAt: new Date() });
	return { success: true };
});
