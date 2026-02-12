# Implementation Plan: Enforce 3-Hour Minimum Charge (003)

Ensure that any booking with a duration of 3 hours or less is charged at the 3-hour combo rate (if available) for the selected room.

## User Review Required

> [!IMPORTANT]
> This change enforces a "Minimum Charge" rule. If a room has a 3-hour combo of 200,000 VND, a user booking for just 1 hour will be charged the full 200,000 VND, even if the hourly rate would have been 70,000 VND.

## Proposed Changes

### [Core Logic]

#### [MODIFY] [calculatePrice.ts](file:///Users/quankm/Projects/kora-room-calculator/src/features/room-pricing/lib/calculatePrice.ts)
- Update the override logic at the end of `calculatePrice` to explicitly apply for `totalHours <= 3`.
- Ensure the `totalVnd` and `components` are completely replaced by the 3-hour combo if one exists.
- Remove the `totalVnd < minPrice` condition to strictly enforce the "always use combo" requirement for short stays.

## Verification Plan

### Automated Tests
- Run the dedicated short stay test suite:
  ```bash
  npm test tests/room-pricing/unit/calculatePrice.us4.shortBookings.test.ts
  ```
- Add a test case for exactly 3 hours with an expensive combo to verify enforcement.

### Manual Verification
- Standard walkthrough in the browser:
  1. Pick a room (e.g., Ocean Blue).
  2. Set duration to 1 hour.
  3. Verify price is the 3-hour combo price from CSV.
