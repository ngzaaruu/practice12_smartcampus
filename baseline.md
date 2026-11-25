# Practice 12 – Baseline (Task #01: Freeze the baseline)

## Version
- Source: Bolt.new project, imported to GitHub on 2026-11-18 (identical to Bolt export of 2026-11-25)
- Repository: https://github.com/ngzaaruu/practice12_smartcampus
- Baseline commit: 544cf973d1ae2e96f7af49459f049af7c38af0c9
- Tag: baseline-practice12
- Stack: React 18 + Vite 5 + TypeScript, tests on Vitest 3.2.7

## How the checker works
- Time is entered as minutes after midnight (e.g. 600 = 10:00 AM).
- "Now" is fixed in code: TIME_LIMITS.now = 540 (09:00 AM), so results are reproducible.
- Limits (TIME_LIMITS): start 0–1439, end 1–1440, max duration 120 minutes.
- Rules: src/availability.ts (pure function checkAvailability).
- Filters by capacity and equipment: src/filters.ts.
- UI: src/App.tsx. Room data: src/data/rooms.ts.
- The checker only reads room data; it never creates or changes bookings.
- Optional explanation feature from Practice 11 (src/explain.ts) is present but not required for Practice 12.

## Booking data (fictional, src/data/rooms.ts)
Times are minutes after midnight on the same fixed day as NOW (540 = 09:00).

| Room ID | Name | Capacity | Equipment | Blocked | Bookings |
|---------|------|----------|-----------|---------|----------|
| b-204 | B-204 · Engineering Block | 12 | projector, whiteboard | no | 600–660 (10:00–11:00) |
| a-301 | A-301 · Lecture Hall | 40 | projector | no | 840–900 (14:00–15:00) |
| c-110 | C-110 · Seminar Room | 8 | whiteboard | no | none |
| b-105 | B-105 · Maker Lab | 20 | whiteboard | **yes** | none |
| d-002 | D-002 · Study Pod | 4 | none | no | none |

Total: 5 rooms, 2 bookings, 1 blocked room. Data is read-only (AC5).

## Expected behavior (rules are frozen, not changed for Practice 12)
| Input | Expected result | Rule |
|-------|-----------------|------|
| Start ≤ 540 (at or before now) | Error: "Start time must be later than the current time (9:00 AM)." | AC1 future start |
| Duration exactly 120 (700–820) | Available | AC2 |
| Duration 121 (700–821) | Error: "Booking length is 121 minutes. Maximum allowed is 120 minutes." | AC2 |
| Start ≥ end (duration 0 or less) | Error: "Start time must be earlier than end time." | AC2 |
| 630–690 in B-204 | Unavailable: overlaps the 10:00–11:00 AM booking | AC3 overlap |
| 660–720 in B-204 | Available (touching endpoint is not overlap) | AC3 adjacent |
| Any valid time in B-105 | Unavailable: "This room is currently marked as blocked and cannot be booked." | AC4 blocked |
| Empty, letters or decimals | Error with a clear message | AC6 |
| After any check | Rooms and bookings unchanged | AC5 |

Note: in the project's own AGENTS.md, AC3 = blocked and AC4 = overlap;
in the Practice 12 slides it is the opposite. The behavior is the same, only the numbering differs.

## Existing checks
- Command: `npm test` (runs `vitest run`) in the Bolt terminal
- Run date: 2026-11-25, 12:08:42
- Result: **5 test files passed, 53 tests passed, 0 failed** (duration 17.65 s)

| Test file | Tests | Result |
|-----------|-------|--------|
| src/dependencies.test.ts | 1 | passed |
| src/inputFormat.test.ts | 5 | passed |
| src/rooms.tests.ts | 14 | passed |
| src/App.test.ts | 11 | passed |
| src/explain.test.ts | 22 | passed |

Note: one test in explain.test.ts ("times out after 3 seconds and falls back") takes about 3 s by design.

## Screenshots
- screenshots/baseline-app.png – running app
- screenshots/baseline-tests.png – npm test result (53/53 passed)
- screenshots/baseline-repo.png – repository with src/ folder
