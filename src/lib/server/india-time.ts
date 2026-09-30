import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

export const INDIA_TIME_ZONE = 'Asia/Kolkata';
const INPUT_FORMAT = 'YYYY-MM-DDTHH:mm';

export function parseIstInput(value: string): Date {
	if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
		throw new Error('Enter a valid date and time in IST.');
	}
	const parsed = dayjs.tz(value, INPUT_FORMAT, INDIA_TIME_ZONE);
	if (!parsed.isValid() || parsed.format(INPUT_FORMAT) !== value) {
		throw new Error('Enter a valid date and time in IST.');
	}
	return parsed.toDate();
}

export function formatIstInput(value: Date | number): string {
	return dayjs(value).tz(INDIA_TIME_ZONE).format(INPUT_FORMAT);
}

export function formatIst(value: Date | number, format = 'D MMM YYYY, h:mm A'): string {
	return `${dayjs(value).tz(INDIA_TIME_ZONE).format(format)} IST`;
}

export function todayIst(now = new Date()): string {
	return dayjs(now).tz(INDIA_TIME_ZONE).format('YYYY-MM-DD');
}
