const DAY_SECONDS = 24 * 60 * 60;
const DAY_MILLISECONDS = DAY_SECONDS * 1000;
const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/;

function daysInMonth(year, month) {
  const date = new Date(0);
  date.setUTCFullYear(year, month + 1, 0);
  return date.getUTCDate();
}

function parseLocalDate(value) {
  if (typeof value !== 'string' || (value.length !== 10 && value.length !== 16)) {
    return null;
  }

  const match = LOCAL_DATE.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText = '00', minuteText = '00'] = match;
  const year = Number(yearText);
  const month = Number(monthText) - 1;
  const day = Number(dayText);

  if (year < 1 || month < 0 || month > 11 || day < 1 || day > daysInMonth(year, month)
    || Number(hourText) > 23 || Number(minuteText) > 59) {
    return null;
  }

  const instant = new Date(`${yearText}-${monthText}-${dayText}T${hourText}:${minuteText}`);
  return { year, month, day, instant };
}

export function isValidLocalDate(value) {
  return parseLocalDate(value) !== null;
}

function isValidInstant(value) {
  return value instanceof Date && Number.isFinite(value.getTime());
}

export function getElapsedParts(startDate, now = new Date()) {
  const start = parseLocalDate(startDate);
  if (!start || !isValidInstant(now)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isFuture: false, valid: false };
  }

  const elapsed = now.getTime() - start.instant.getTime();
  const isFuture = elapsed < 0;
  const seconds = isFuture ? Math.ceil(-elapsed / 1000) : Math.floor(elapsed / 1000);

  return {
    days: Math.floor(seconds / DAY_SECONDS),
    hours: Math.floor(seconds / 3600) % 24,
    minutes: Math.floor(seconds / 60) % 60,
    seconds: seconds % 60,
    isFuture,
    valid: true,
  };
}

// Encode local calendar labels on a uniform UTC day scale to avoid DST offsets.
function calendarDay(year, month, day) {
  const date = new Date(0);
  date.setUTCFullYear(year, month, day);
  return date.getTime() / DAY_MILLISECONDS;
}

function milestone(year, month, day, today, startYear, isStart) {
  const date = new Date(0);
  date.setHours(0, 0, 0, 0);
  date.setFullYear(year, month, day);
  const daysRemaining = calendarDay(year, month, day) - today;

  return { date, years: year - startYear, daysRemaining, isToday: daysRemaining === 0, isStart };
}

export function getAnniversary(startDate, now = new Date()) {
  const start = parseLocalDate(startDate);
  if (!start || !isValidInstant(now)) return null;

  const { year: startYear, month, day: startDay, instant } = start;
  const nowYear = now.getFullYear();
  const today = calendarDay(nowYear, now.getMonth(), now.getDate());

  if (instant > now) {
    return milestone(startYear, month, startDay, today, startYear, true);
  }

  let year = Math.max(nowYear, startYear + 1);
  let day = Math.min(startDay, daysInMonth(year, month));
  if (calendarDay(year, month, day) < today) {
    year += 1;
    day = Math.min(startDay, daysInMonth(year, month));
  }

  return milestone(year, month, day, today, startYear, false);
}
