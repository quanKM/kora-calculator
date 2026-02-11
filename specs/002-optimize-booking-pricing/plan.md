# Implementation Plan: Optimize Booking Price Calculation

**Branch**: `002-optimize-booking-pricing` | **Date**: Wednesday Feb 11, 2026 | **Spec**: [spec.md](file:///Users/quankm/Projects/kora-room-calculator/specs/002-optimize-booking-pricing/spec.md)

## Summary
Update the booking pricing logic to eliminate the 2-hour charge between consecutive full-day combos (14:00 - 12:00) and simplify the UI by removing minute selection. The core calculation algorithm (DP/Dijkstra) will be modified to support "gapless" transitions for full-day bookings.

## Technical Context

**Language/Version**: TypeScript (React 19) + Vite
**Primary Dependencies**: React, date-fns, shadcn/ui
**Storage**: CSV-based pricing data (`pricing.csv`)
**Testing**: Vitest
**Target Platform**: Web
**Project Type**: Web application
**Performance Goals**: <200ms for pricing calculation
**Constraints**: 1-hour granularity mandatory

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Code Quality**: Ensure `calculatePrice.ts` remains clean despite the new gap-bridging logic.
- **II. Testing-First**: MUST add failing tests for the gapless requirement before implementation.
- **III. UI/UX Consistency**: Remove minutes from `RoomPricingForm` to match 1-hour granularity.

## Project Structure

### Documentation (this feature)

```text
specs/002-optimize-booking-pricing/
├── plan.md              # This file
├── research.md          # Gapless logic research
├── data-model.md        # Updated logic rules
├── quickstart.md        # Test instructions
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code

```text
src/
├── features/
│   └── room-pricing/
│       ├── components/
│       │   └── RoomPricingForm.tsx  # UI Update
│       └── lib/
│           └── calculatePrice.ts   # Logic Update
tests/
└── room-pricing/
    └── unit/
        └── calculatePrice.us3.multiDay.test.ts # New test case
```

**Structure Decision**: Single project structure, following existing feature-based organization.

## Proposed Changes

### Feature: Gapless Multi-Day Booking

#### [MODIFY] [calculatePrice.ts](file:///Users/quankm/Projects/kora-room-calculator/src/features/room-pricing/lib/calculatePrice.ts)

- Modify the DP loop to detect if the current state is 12:00 (end of a full-day window).

- Add a 0-cost transition to 14:00 the same day IF a consecutive full-day booking is possible or needed.



#### [MODIFY] [RoomPricingForm.tsx](file:///Users/quankm/Projects/kora-room-calculator/src/features/room-pricing/components/RoomPricingForm.tsx)

- Ensure `<Input type="datetime-local" />` is used with `step="3600"`.

- Add a `onBlur` or `onChange` handler to force `minutes` to `00` if the browser allows non-zero minute selection.

## Verification Plan

### Automated Tests

1. Unit Test (New): Add a test case to `tests/room-pricing/unit/calculatePrice.us3.multiDay.test.ts` for a booking from Tuesday 14:00 to Thursday 12:00.

    - **Command**: `npm test tests/room-pricing/unit/calculatePrice.us3.multiDay.test.ts`
    - **Expected**: Total price = 2 * FullDayPrice.

2. Regression Tests: Run all existing pricing tests.

    - **Command**: `npm test tests/room-pricing/unit/calculatePrice.*.test.ts`

### Manual Verification

1. Start the app: `npm run dev`.

2. Navigate to the pricing calculator.
3. Select any room.
4. Set check-in to **2026-02-17 14:00** and check-out to **2026-02-19 12:00**.
5. Check "Tính Toán" and verify the breakdown shows 2 combos and 0 extension hours.
6. Verify that typing in the time field or picking from the browser widget does not result in non-zero minutes.
