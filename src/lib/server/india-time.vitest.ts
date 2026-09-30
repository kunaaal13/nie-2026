import { describe, expect, it } from 'vitest';
import { formatIstInput, parseIstInput, todayIst } from './india-time';

describe('IST date handling', () => {
	it('converts an admin-entered IST time to a UTC instant and back', () => {
		const instant = parseIstInput('2026-10-09T09:30');
		expect(instant.toISOString()).toBe('2026-10-09T04:00:00.000Z');
		expect(formatIstInput(instant)).toBe('2026-10-09T09:30');
	});
	it('uses the India date across UTC midnight', () => {
		expect(todayIst(new Date('2026-10-08T19:00:00Z'))).toBe('2026-10-09');
	});
	it('rejects invalid local dates and malformed input', () => {
		expect(() => parseIstInput('2026-02-30T12:00')).toThrow();
		expect(() => parseIstInput('2026-10-09T24:00')).toThrow();
		expect(() => parseIstInput('2026-10-09')).toThrow();
	});
});
