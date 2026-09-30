import { sql } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { adminUsers } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform?.env.DB) return { available: false };
	const [{ count }] = await getDb(platform.env.DB).select({ count: sql<number>`count(*)` }).from(adminUsers);
	return { available: count === 0 && Boolean(platform.env.ADMIN_SETUP_TOKEN) };
};
