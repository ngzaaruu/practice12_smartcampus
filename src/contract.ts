// Practice 12 common contract: start time + duration -> isAvailable, reasonCode, message.
// This is an adapter only. The booking rules stay in availability.ts and are not changed:
// the duration is turned into an end time (end = start + duration) and passed to the
// existing checker. Pure functions, no React, no side effects (AC5).
import {
  TIME_LIMITS,
  checkAvailability,
  parseMin,
  type Result,
  type RoomAvailabilityData,
} from './availability';
import { deriveReasonCode, type ReasonCode } from './explain';

export interface ContractInput {
  readonly startRaw: string;
  readonly durationRaw: string;
}

export interface ContractOutput {
  readonly isAvailable: boolean;
  readonly reasonCode: ReasonCode;
  readonly message: string;
  // The full checker result, used by the UI to show every error line.
  readonly result: Result;
}

const L = TIME_LIMITS;

export const AVAILABLE_MESSAGE = 'Available: no existing booking overlaps this time.';

const invalid = (reasons: string[]): ContractOutput => ({
  isAvailable: false,
  reasonCode: 'INVALID_TIME',
  message: reasons.join(' '),
  result: { kind: 'error', reasons },
});

// ---- validation (input layer) ----

export function validateStart(raw: string): string[] {
  if (raw.trim() === '') return ['Start time is required.'];
  const start = parseMin(raw);
  if (start === null) return ['Start time must be a whole number (minutes after midnight).'];
  if (start < L.startMin || start > L.startMax)
    return [`Start time must be between ${L.startMin} and ${L.startMax}.`];
  return [];
}

// AC2 (lower bound) and AC6 for the duration field. The upper bound (120) is
// checked by the existing rule engine, so its message stays the same.
export function validateDuration(raw: string): string[] {
  if (raw.trim() === '') return ['Duration is required.'];
  const duration = parseMin(raw);
  if (duration === null) return ['Duration must be a whole number of minutes.'];
  if (duration <= 0) return ['Duration must be greater than 0 minutes.'];
  return [];
}

// ---- availability calculation ----

export function checkWithDuration(
  input: ContractInput,
  room: RoomAvailabilityData
): ContractOutput {
  const errors = [...validateStart(input.startRaw), ...validateDuration(input.durationRaw)];
  if (errors.length) return invalid(errors);

  const start = parseMin(input.startRaw) as number;
  const duration = parseMin(input.durationRaw) as number;
  const end = start + duration;

  // The window must finish by midnight. A duration over the limit is still
  // reported as "too long", the same way the rule engine reports it.
  if (end > L.endMax) {
    if (duration > L.maxDuration) {
      const reasons = [
        `Booking length is ${duration} minutes. Maximum allowed is ${L.maxDuration} minutes.`,
      ];
      return {
        isAvailable: false,
        reasonCode: 'TOO_LONG',
        message: reasons[0],
        result: { kind: 'error', reasons },
      };
    }
    return invalid([`The booking must end by midnight (start + duration at most ${L.endMax}).`]);
  }

  const result = checkAvailability({ startRaw: String(start), endRaw: String(end) }, room);
  const derived = deriveReasonCode(result);

  return {
    isAvailable: derived?.isAvailable ?? false,
    reasonCode: derived?.reasonCode ?? 'INVALID_TIME',
    message:
      result.kind === 'available'
        ? AVAILABLE_MESSAGE
        : result.kind === 'unavailable'
          ? result.reason
          : result.reasons.join(' '),
    result,
  };
}
