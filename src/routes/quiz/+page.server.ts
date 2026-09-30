import { getPublicQuizState } from '$lib/server/quiz';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ setHeaders, platform }) => {
	setHeaders({ 'cache-control': 'no-store' });
	if (!platform?.env.DB) return { campaign: { phase: 'not-scheduled' as const, quiz: null, nextQuiz: null } };
	return { campaign: await getPublicQuizState(platform.env.DB) };
};
