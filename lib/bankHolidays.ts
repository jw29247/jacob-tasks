/**
 * UK Bank Holidays Calculator
 * Returns dates for England & Wales bank holidays for a given year
 */

export interface BankHoliday {
  date: Date;
  name: string;
}

/**
 * Get Easter Sunday date for a given year
 * Uses Anonymous Gregorian algorithm
 */
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month, day);
}

/**
 * Get the first Monday of a given month in a year
 */
function getFirstMonday(year: number, month: number): Date {
  const date = new Date(year, month, 1);
  const day = date.getDay();
  const offset = day === 1 ? 0 : (8 - day) % 7;
  return new Date(year, month, 1 + offset);
}

/**
 * Get the last Monday of a given month in a year
 */
function getLastMonday(year: number, month: number): Date {
  const lastDay = new Date(year, month + 1, 0);
  const day = lastDay.getDay();
  const offset = day === 1 ? 0 : (day - 1);
  return new Date(year, month, lastDay.getDate() - offset);
}

/**
 * Adjust a date to nearest Monday if it falls on weekend
 */
function adjustForWeekend(date: Date): Date {
  const day = date.getDay();
  if (day === 0) { // Sunday
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  }
  if (day === 6) { // Saturday
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 2);
  }
  return date;
}

/**
 * Get all UK bank holidays for a given year (England & Wales)
 */
export function getUKBankHolidays(year: number): BankHoliday[] {
  const holidays: BankHoliday[] = [];
  
  // New Year's Day (Jan 1, or nearest weekday)
  let newYear = new Date(year, 0, 1);
  if (newYear.getDay() === 0) { // Sunday
    newYear = new Date(year, 0, 2);
  } else if (newYear.getDay() === 6) { // Saturday
    newYear = new Date(year, 0, 3);
  }
  holidays.push({ date: newYear, name: "New Year's Day" });
  
  // Good Friday (2 days before Easter Sunday)
  const easter = getEasterSunday(year);
  const goodFriday = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 2);
  holidays.push({ date: goodFriday, name: "Good Friday" });
  
  // Easter Monday (1 day after Easter Sunday)
  const easterMonday = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 1);
  holidays.push({ date: easterMonday, name: "Easter Monday" });
  
  // Early May Bank Holiday (first Monday in May)
  const earlyMay = getFirstMonday(year, 4); // May is month 4
  holidays.push({ date: earlyMay, name: "Early May Bank Holiday" });
  
  // Spring Bank Holiday (last Monday in May)
  const springBank = getLastMonday(year, 4); // May is month 4
  holidays.push({ date: springBank, name: "Spring Bank Holiday" });
  
  // Summer Bank Holiday (last Monday in August)
  const summerBank = getLastMonday(year, 7); // August is month 7
  holidays.push({ date: summerBank, name: "Summer Bank Holiday" });
  
  // Christmas Day (Dec 25, or nearest weekday)
  let christmas = new Date(year, 11, 25);
  christmas = adjustForWeekend(christmas);
  holidays.push({ date: christmas, name: "Christmas Day" });
  
  // Boxing Day (Dec 26, or nearest weekday after Christmas adjustment)
  let boxingDay = new Date(year, 11, 26);
  const christmasDay = new Date(year, 11, 25);
  if (christmasDay.getDay() === 0) { // Christmas on Sunday
    boxingDay = new Date(year, 11, 28); // Tuesday
  } else if (christmasDay.getDay() === 6) { // Christmas on Saturday
    boxingDay = new Date(year, 11, 28); // Tuesday
  } else if (christmasDay.getDay() === 5) { // Christmas on Friday
    boxingDay = new Date(year, 11, 28); // Monday (skip weekend)
  } else {
    boxingDay = adjustForWeekend(boxingDay);
  }
  holidays.push({ date: boxingDay, name: "Boxing Day" });
  
  return holidays;
}

/**
 * Check if a date is a UK bank holiday
 */
export function isBankHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const holidays = getUKBankHolidays(year);
  
  const dateStr = formatDateOnly(date);
  return holidays.some(h => formatDateOnly(h.date) === dateStr);
}

/**
 * Get the name of the bank holiday if today is one
 */
export function getBankHolidayName(date: Date): string | null {
  const year = date.getFullYear();
  const holidays = getUKBankHolidays(year);
  
  const dateStr = formatDateOnly(date);
  const holiday = holidays.find(h => formatDateOnly(h.date) === dateStr);
  return holiday?.name || null;
}

/**
 * Format date as YYYY-MM-DD for comparison
 */
function formatDateOnly(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Get all bank holidays for current year and next year
 */
export function getAllUpcomingBankHolidays(): BankHoliday[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const nextYear = currentYear + 1;
  
  const currentYearHolidays = getUKBankHolidays(currentYear);
  const nextYearHolidays = getUKBankHolidays(nextYear);
  
  return [...currentYearHolidays, ...nextYearHolidays]
    .filter(h => h.date >= now)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
