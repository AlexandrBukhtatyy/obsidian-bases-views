import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';

/**
 * Format a date as YYYY-MM-DD string in local timezone.
 * Used for droppable IDs and date comparisons.
 *
 * @param date - Date to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date for display in calendar header.
 *
 * @param date - Date to format
 * @returns Formatted string (e.g., "January 2026")
 */
export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy');
}

/**
 * Format a date for display in week view header.
 *
 * @param date - Date to format
 * @returns Formatted string (e.g., "Jan 13-19, 2026")
 */
export function formatWeekRange(weekStart: Date, weekEnd: Date): string {
  const startMonth = format(weekStart, 'MMM');
  const endMonth = format(weekEnd, 'MMM');
  const year = format(weekEnd, 'yyyy');

  if (startMonth === endMonth) {
    return `${startMonth} ${format(weekStart, 'd')}-${format(weekEnd, 'd')}, ${year}`;
  } else {
    return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}, ${year}`;
  }
}

/**
 * Format a day number for display in calendar cell.
 *
 * @param date - Date to format
 * @returns Day number (e.g., "15")
 */
export function formatDayNumber(date: Date): string {
  return format(date, 'd');
}

/**
 * Format a weekday name.
 *
 * @param date - Date to format
 * @param short - Whether to use short format
 * @returns Weekday name (e.g., "Monday" or "Mon")
 */
export function formatWeekday(date: Date, short: boolean = true): string {
  return format(date, short ? 'EEE' : 'EEEE');
}

/**
 * Navigate to previous month.
 *
 * @param currentDate - Current date
 * @returns Date one month earlier
 */
export function previousMonth(currentDate: Date): Date {
  return subMonths(currentDate, 1);
}

/**
 * Navigate to next month.
 *
 * @param currentDate - Current date
 * @returns Date one month later
 */
export function nextMonth(currentDate: Date): Date {
  return addMonths(currentDate, 1);
}

/**
 * Navigate to previous week.
 *
 * @param currentDate - Current date
 * @returns Date one week earlier
 */
export function previousWeek(currentDate: Date): Date {
  return subWeeks(currentDate, 1);
}

/**
 * Navigate to next week.
 *
 * @param currentDate - Current date
 * @returns Date one week later
 */
export function nextWeek(currentDate: Date): Date {
  return addWeeks(currentDate, 1);
}

/**
 * Navigate to previous day.
 *
 * @param currentDate - Current date
 * @returns Date one day earlier
 */
export function previousDay(currentDate: Date): Date {
  return subDays(currentDate, 1);
}

/**
 * Navigate to next day.
 *
 * @param currentDate - Current date
 * @returns Date one day later
 */
export function nextDay(currentDate: Date): Date {
  return addDays(currentDate, 1);
}

/**
 * Format a date for display in day view header.
 *
 * @param date - Date to format
 * @returns Formatted string (e.g., "Monday, January 21, 2026")
 */
export function formatFullDate(date: Date): string {
  return format(date, 'EEEE, MMMM d, yyyy');
}
