import { getAnniversary, getElapsedParts, isValidLocalDate } from './anniversary';

test.each([
  ['2024-02-29', true],
  ['2025-03-15T18:00', true],
  ['0001-01-01', true],
  ['0000-01-01', false],
  ['2025-02-29', false],
  ['2025-04-31T12:00', false],
  ['2025-03-15T24:00', false],
  ['2025-03-15T18:60', false],
  ['2025-03-15T18:00Z', false],
  ['2025-3-15', false],
  ['2025-03-15\n', false],
])('validates local date %s as %s', (value, expected) => {
  expect(isValidLocalDate(value)).toBe(expected);
});

test('splits elapsed time into whole day, hour, minute, and second units', () => {
  expect(
    getElapsedParts('2025-03-15T18:00', new Date(2025, 2, 17, 21, 4, 5, 999))
  ).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5, isFuture: false, valid: true });
});

test('shows one second when a future start is less than a second away', () => {
  expect(
    getElapsedParts('2025-03-15T18:00', new Date(2025, 2, 15, 17, 59, 59, 998))
  ).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 1, isFuture: true, valid: true });
});

test('returns zero elapsed parts at the exact start', () => {
  expect(getElapsedParts('2025-03-15T18:00', new Date(2025, 2, 15, 18)))
    .toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, isFuture: false, valid: true });
});

test('uses local midnight for date-only start values', () => {
  expect(getElapsedParts('2025-03-15', new Date(2025, 2, 15, 0, 0, 1)))
    .toEqual({ days: 0, hours: 0, minutes: 0, seconds: 1, isFuture: false, valid: true });
});

test('returns a safe zero state for an invalid start or current date', () => {
  const invalid = { days: 0, hours: 0, minutes: 0, seconds: 0, isFuture: false, valid: false };

  expect(getElapsedParts('2025-02-29', new Date(2025, 2, 10))).toEqual(invalid);
  expect(getElapsedParts('2025-03-15', new Date(Number.NaN))).toEqual(invalid);
  expect(getAnniversary('2025-02-29', new Date(2025, 2, 10))).toBeNull();
});

test.each([1, 23])('recognizes the whole anniversary date at hour %i', (hour) => {
  expect(getAnniversary('2025-03-15T18:00', new Date(2026, 2, 15, hour))).toEqual({
    date: new Date(2026, 2, 15),
    years: 1,
    daysRemaining: 0,
    isToday: true,
    isStart: false,
  });
});

test('advances to the next year the day after an anniversary', () => {
  expect(getAnniversary('2025-03-15T18:00', new Date(2026, 2, 16))).toEqual({
    date: new Date(2027, 2, 15),
    years: 2,
    daysRemaining: 364,
    isToday: false,
    isStart: false,
  });
});

test('counts calendar days across the fall daylight saving transition', () => {
  expect(getAnniversary('2024-11-03T18:00', new Date(2025, 10, 1))).toEqual({
    date: new Date(2025, 10, 3),
    years: 1,
    daysRemaining: 2,
    isToday: false,
    isStart: false,
  });
});

test.each([
  [2025, 28, 1],
  [2028, 29, 4],
])('places a leap-day anniversary in %i on February %i', (year, day, years) => {
  expect(getAnniversary('2024-02-29T18:00', new Date(year, 1, day))).toEqual({
    date: new Date(year, 1, day),
    years,
    daysRemaining: 0,
    isToday: true,
    isStart: false,
  });
});

test('uses the planned start as the milestone for a future start', () => {
  expect(getAnniversary('2025-03-15T18:00', new Date(2025, 2, 15, 12))).toEqual({
    date: new Date(2025, 2, 15),
    years: 0,
    daysRemaining: 0,
    isToday: true,
    isStart: true,
  });
});
