import { describe, expect, it } from 'vitest';
import { ROOMS, type Room } from './data/rooms';
import { AVAILABLE_MESSAGE, checkWithDuration, validateDuration } from './contract';

// Practice 12 shared test cases T1–T8 (start + duration, room B-204, booking 600–660).
const room = (id: string): Room => {
  const r = ROOMS.find((x) => x.id === id);
  if (!r) throw new Error(`Room ${id} is missing from ROOMS`);
  return r;
};
const B204 = room('b-204');
const check = (start: string, duration: string, blocked = false) =>
  checkWithDuration({ startRaw: start, durationRaw: duration }, { bookings: B204.bookings, blocked });

describe('Practice 12 contract: T1–T8', () => {
  it('T1: valid free interval -> Available', () => {
    const out = check('720', '60');
    expect(out.isAvailable).toBe(true);
    expect(out.reasonCode).toBe('AVAILABLE');
    expect(out.message).toBe(AVAILABLE_MESSAGE);
  });

  it('T2: overlap with an existing booking -> Unavailable', () => {
    const out = check('630', '60');
    expect(out.isAvailable).toBe(false);
    expect(out.reasonCode).toBe('OVERLAP');
    expect(out.message).toBe('Overlaps an existing booking (10:00 AM – 11:00 AM).');
  });

  it('T3: blocked room -> Unavailable', () => {
    const out = check('720', '60', true);
    expect(out.isAvailable).toBe(false);
    expect(out.reasonCode).toBe('BLOCKED');
  });

  it('T4: duration = 0 -> validation error', () => {
    const out = check('720', '0');
    expect(out.isAvailable).toBe(false);
    expect(out.reasonCode).toBe('INVALID_TIME');
    expect(out.message).toBe('Duration must be greater than 0 minutes.');
  });

  it('T5: duration = 121 minutes -> validation error', () => {
    const out = check('720', '121');
    expect(out.isAvailable).toBe(false);
    expect(out.reasonCode).toBe('TOO_LONG');
    expect(out.message).toBe('Booking length is 121 minutes. Maximum allowed is 120 minutes.');
  });

  it('T6: past start time -> validation error', () => {
    const out = check('480', '60');
    expect(out.isAvailable).toBe(false);
    expect(out.reasonCode).toBe('PAST_TIME');
  });

  it('T7: adjacent non-overlapping interval -> Available', () => {
    const out = check('660', '60');
    expect(out.isAvailable).toBe(true);
    expect(out.reasonCode).toBe('AVAILABLE');
  });

  it('T8: booking data unchanged after checks', () => {
    const before = JSON.stringify(ROOMS);
    check('720', '60');
    check('630', '60');
    check('720', '60', true);
    check('720', '0');
    check('720', '121');
    check('480', '60');
    check('660', '60');
    expect(JSON.stringify(ROOMS)).toBe(before);
    expect(B204.bookings).toEqual([{ start: 600, end: 660 }]);
    expect(B204.blocked).toBe(false);
  });
});

describe('Practice 12 contract: input validation (AC6)', () => {
  it('reports empty fields', () => {
    expect(check('', '').result).toEqual({
      kind: 'error',
      reasons: ['Start time is required.', 'Duration is required.'],
    });
  });

  it('rejects non-integer and negative durations', () => {
    expect(validateDuration('1.5')).toEqual(['Duration must be a whole number of minutes.']);
    expect(validateDuration('abc')).toEqual(['Duration must be a whole number of minutes.']);
    expect(validateDuration('-10')).toEqual(['Duration must be greater than 0 minutes.']);
    expect(validateDuration('120')).toEqual([]);
  });

  it('accepts exactly 120 minutes (AC2 upper bound)', () => {
    expect(check('720', '120').reasonCode).toBe('AVAILABLE');
  });

  it('rejects a start outside 0–1439', () => {
    expect(check('2000', '60').message).toBe('Start time must be between 0 and 1439.');
  });

  it('rejects a window that ends after midnight', () => {
    const out = check('1400', '60');
    expect(out.reasonCode).toBe('INVALID_TIME');
    expect(out.message).toBe('The booking must end by midnight (start + duration at most 1440).');
    expect(check('1400', '121').reasonCode).toBe('TOO_LONG');
  });
});
