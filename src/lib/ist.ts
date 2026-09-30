import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export function formatIstDateTime(value: string | Date | number): string {
	return `${dayjs(value).tz('Asia/Kolkata').format('D MMM YYYY, h:mm A')} IST`;
}
