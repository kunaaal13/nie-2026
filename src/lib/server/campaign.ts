import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const INDIA_TIME_ZONE = 'Asia/Kolkata';
const CAMPAIGN_YEAR = 2026;
const CAMPAIGN_START = `${CAMPAIGN_YEAR}-10-05`;
const CAMPAIGN_END = `${CAMPAIGN_YEAR}-10-23`;
const QUIZ_DATES = [`${CAMPAIGN_YEAR}-10-09`, `${CAMPAIGN_YEAR}-10-16`, `${CAMPAIGN_YEAR}-10-23`] as const;

export type CampaignState =
	| { phase: 'upcoming'; today: string; nextQuizDate: string }
	| { phase: 'registration'; today: string; nextQuizDate: string }
	| { phase: 'quiz'; today: string; weekNumber: 1 | 2 | 3; nextQuizDate: string | null }
	| { phase: 'ended'; today: string; nextQuizDate: null };

export function getCampaignState(now?: Date): CampaignState {
	const indiaNow = (now ? dayjs(now) : dayjs()).tz(INDIA_TIME_ZONE);
	const today = indiaNow.format('YYYY-MM-DD');
	if (indiaNow.isBefore(dayjs.tz(CAMPAIGN_START, INDIA_TIME_ZONE), 'day')) {
		return { phase: 'upcoming', today, nextQuizDate: QUIZ_DATES[0] };
	}
	if (indiaNow.isAfter(dayjs.tz(CAMPAIGN_END, INDIA_TIME_ZONE), 'day')) {
		return { phase: 'ended', today, nextQuizDate: null };
	}

	const activeIndex = QUIZ_DATES.findLastIndex((date) =>
		!indiaNow.isBefore(dayjs.tz(date, INDIA_TIME_ZONE), 'day')
	);
	if (activeIndex === -1) return { phase: 'registration', today, nextQuizDate: QUIZ_DATES[0] };

	return {
		phase: 'quiz',
		today,
		weekNumber: (activeIndex + 1) as 1 | 2 | 3,
		nextQuizDate: QUIZ_DATES[activeIndex + 1] ?? null
	};
}
