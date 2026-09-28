import { getCampaignState } from '$lib/server/campaign';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ setHeaders }) => {
	setHeaders({ 'cache-control': 'no-store' });
	return { campaign: getCampaignState() };
};
