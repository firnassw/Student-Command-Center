import { formatInTimeZone } from 'date-fns-tz';

const TIMEZONE = 'Asia/Jakarta';

/**
 * Formats a given ISO string or Date object to a readable string in Asia/Jakarta timezone.
 */
export function formatJakartaTime(date: string | Date, formatStr: string = 'dd MMM yyyy, HH:mm'): string {
  return formatInTimeZone(new Date(date), TIMEZONE, formatStr);
}

/**
 * Converts a local datetime string (e.g. from an <input type="datetime-local">)
 * which implies the user meant that time in Asia/Jakarta, and adds the correct timezone offset 
 * to parse it into a globally correct ISO string.
 * Jakarta is typically +07:00.
 */
export function parseToJakartaISO(localDateTimeStr: string): string {
  // If input is "2023-10-01T10:00", we append +07:00 so JS parses it as 10:00 AM Jakarta time
  return `${localDateTimeStr}:00+07:00`;
}
