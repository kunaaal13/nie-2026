import { describe, expect, test } from 'bun:test';
import { getCampaignState } from './campaign';

describe('2026 campaign dates in India', () => {
	test.each([
		['2026-10-04T18:29:59.000Z', 'upcoming', null],
		['2026-10-04T18:30:00.000Z', 'registration', null],
		['2026-10-08T18:29:59.000Z', 'registration', null],
		['2026-10-08T18:30:00.000Z', 'quiz', 1],
		['2026-10-15T18:29:59.000Z', 'quiz', 1],
		['2026-10-15T18:30:00.000Z', 'quiz', 2],
		['2026-10-22T18:29:59.000Z', 'quiz', 2],
		['2026-10-22T18:30:00.000Z', 'quiz', 3],
		['2026-10-23T18:29:59.000Z', 'quiz', 3],
		['2026-10-23T18:30:00.000Z', 'ended', null]
	] as const)('%s resolves to %s', (instant, phase, weekNumber) => {
		const state = getCampaignState(new Date(instant));
		expect(state.phase).toBe(phase);
		expect(state.phase === 'quiz' ? state.weekNumber : null).toBe(weekNumber);
	});
});
