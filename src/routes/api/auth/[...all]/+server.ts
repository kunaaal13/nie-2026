import { createAuth } from '$lib/server/auth';
import { error, type RequestHandler } from '@sveltejs/kit';

const handler: RequestHandler = ({ platform, request, url }) => {
	const env = platform?.env;
	if (!env?.DB || !env.BETTER_AUTH_SECRET) error(503, 'Authentication is not configured.');
	return createAuth(env, url.origin).handler(request);
};

export const GET = handler;
export const POST = handler;
