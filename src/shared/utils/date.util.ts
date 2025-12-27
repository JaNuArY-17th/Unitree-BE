/**
 * Format date to string
 * @param date - Date object
 * @param format - Format string (default: 'YYYY-MM-DD')
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date,
  format: string = 'YYYY-MM-DD',
): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * Add days to a date
 * @param date - Date object
 * @param days - Number of days to add
 * @returns New date object
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Add hours to a date
 * @param date - Date object
 * @param hours - Number of hours to add
 * @returns New date object
 */
export const addHours = (date: Date, hours: number): Date => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

/**
 * Add minutes to a date
 * @param date - Date object
 * @param minutes - Number of minutes to add
 * @returns New date object
 */
export const addMinutes = (date: Date, minutes: number): Date => {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
};

/**
 * Get difference in days between two dates
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days difference
 */
export const getDaysDifference = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Get difference in hours between two dates
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of hours difference
 */
export const getHoursDifference = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60));
};

/**
 * Get difference in minutes between two dates
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of minutes difference
 */
export const getMinutesDifference = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / (1000 * 60));
};

/**
 * Check if date is today
 * @param date - Date to check
 * @returns true if date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if date is in the past
 * @param date - Date to check
 * @returns true if date is in the past
 */
export const isPast = (date: Date): boolean => {
  return date < new Date();
};

/**
 * Check if date is in the future
 * @param date - Date to check
 * @returns true if date is in the future
 */
export const isFuture = (date: Date): boolean => {
  return date > new Date();
};

/**
 * Get start of day
 * @param date - Date object
 * @returns Date at start of day (00:00:00)
 */
export const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Get end of day
 * @param date - Date object
 * @returns Date at end of day (23:59:59)
 */
export const endOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};
