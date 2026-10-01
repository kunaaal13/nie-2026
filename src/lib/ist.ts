import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

const IST = 'Asia/Kolkata';

export function formatIstDateTime(value: string | Date | number): string {
	return `${dayjs(value).tz(IST).format('D MMM YYYY, h:mm A')} IST`;
}

export function formatIstShort(value: string | Date | number): string {
	return dayjs(value).tz(IST).format('D MMM, h:mm A');
}

export function formatIstDate(value: string | Date | number): string {
	return dayjs(value).tz(IST).format('D MMM YYYY');
}

export function fromNow(value: string | Date | number): string {
	return dayjs(value).fromNow();
}

export function formatNumber(value: number): string {
	return value.toLocaleString('en-IN');
}
