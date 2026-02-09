# Tasks: Room booking price calculator

**Input**: Design documents from `/specs/001-room-pricing-calculator/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Tests are required by the project Constitution (Testing-First Discipline). Test tasks are included and should be executed before implementation tasks for each user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project and tooling setup for React + TypeScript + shadcn/ui + Vitest.

- [x] T001 Configure room pricing feature directory structure in `src/features/room-pricing/` and create placeholder files for `components/`, `hooks/`, and `lib/` (e.g., `src/features/room-pricing/components/index.ts`, `src/features/room-pricing/hooks/index.ts`, `src/features/room-pricing/lib/index.ts`).
- [x] T002 [P] Add and configure Vitest and React Testing Library in `package.json`, `vite.config.ts`, and a new `vitest.config.ts` (or equivalent) to support unit and integration testing for React components and pricing logic.
- [x] T003 [P] Install and initialize shadcn/ui (and its peer dependencies) in the project, updating any necessary configuration files to enable usage in `src/features/room-pricing/components/`.
- [x] T004 [P] Ensure ESLint and TypeScript are configured to cover new feature files under `src/features/room-pricing/` and future tests under `tests/room-pricing/`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core models, parsing, and pure calculation foundation required by all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T005 Create TypeScript types and interfaces for `Room`, `ComboPricing`, `ComboWindow`, `BookingRequest`, `DailySegment`, `PriceComponent`, `PriceBreakdown`, and `CalculatorResult` in `src/features/room-pricing/lib/types.ts` based on `data-model.md`.
- [x] T006 [P] Implement a CSV parsing utility to read `src/assets/pricing.csv` and map rows into `Room` and `ComboPricing` structures in `src/features/room-pricing/lib/pricingCsvParser.ts`.
- [x] T007 [P] Implement a date/time utility to split a `BookingRequest` into `DailySegment[]` with correct weekday/weekend flags in `src/features/room-pricing/lib/segmentation.ts`.
- [x] T008 Implement the core pure calculation function `calculatePrice` (signature aligned with `CalculatorResult` in `contracts/price-calculation.openapi.yaml`) in `src/features/room-pricing/lib/calculatePrice.ts`, including selection of the cheapest valid combination of combos and hourly extensions.
- [x] T009 Implement a helper to generate Vietnamese explanations (`summaryVi` and per-component `descriptionVi`) from a computed `PriceBreakdown` in `src/features/room-pricing/lib/explanationVi.ts`.
- [x] T010 [P] Create base unit test suites for the foundational utilities (CSV parser, segmentation, `calculatePrice`, and explanation generator) under `tests/room-pricing/unit/` according to the scenarios outlined in `quickstart.md` and `research.md`.

**Checkpoint**: Foundation ready – user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 – Single-day booking within one combo window (Priority: P1) 🎯 MVP

**Goal**: Enable users to calculate the price for bookings that fully fit within a single combo window (3-hour, half-day, or full-day) and see a correct total without hourly extensions.

**Independent Test**: From the UI, select a room and a start/end datetime that matches a single combo window on a weekday or weekend; verify the total equals the correct combo price and that the Vietnamese explanation clearly states which combo was applied.

### Tests for User Story 1

- [x] T011 [P] [US1] Add unit tests for exact-match combo scenarios (3-hour, half-day, full-day) in `tests/room-pricing/unit/calculatePrice.us1.exactCombos.test.ts`, covering both weekday and weekend cases.
- [x] T012 [P] [US1] Add integration-style tests that exercise `calculatePrice` via a logical `calculate-price` entry point (matching `BookingRequest`/`CalculatorResult`) in `tests/room-pricing/integration/calculatePrice.us1.api.test.ts`.
- [x] T013 [P] [US1] Add component tests for the basic calculator form and result display in `tests/room-pricing/integration/RoomPricingCalculator.us1.ui.test.tsx`, verifying that a known single-day combo booking shows the correct total and Vietnamese explanation.

### Implementation for User Story 1

- [x] T014 [P] [US1] Implement a `RoomPricingCalculator` container component in `src/features/room-pricing/components/RoomPricingCalculator.tsx` that wires together room selection, datetime inputs, and result display using React state.
- [x] T015 [P] [US1] Implement shadcn/ui-based form components for room dropdown and datetime pickers in `src/features/room-pricing/components/RoomPricingForm.tsx`, calling into the foundational lib functions on submit.
- [x] T016 [US1] Integrate `RoomPricingCalculator` into the main app by rendering it from `src/App.tsx`, ensuring the pricing CSV is loaded and passed or accessed appropriately.
- [x] T017 [US1] Implement validation and Vietnamese error messaging in the form (e.g., end before start, missing room) in `src/features/room-pricing/components/RoomPricingForm.tsx`.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently as an MVP.

---

## Phase 4: User Story 2 – Booking requiring combos plus hourly extension (Priority: P2)

**Goal**: Support bookings that extend beyond combo windows by combining combos with hourly extensions, always choosing the cheapest valid combination and showing a clear Vietnamese breakdown.

**Independent Test**: Create bookings that slightly exceed one or more combos; verify that the system combines combos and hourly extensions optimally and that the Vietnamese explanation clearly breaks down combo vs hour charges.

### Tests for User Story 2

- [x] T018 [P] [US2] Add unit tests for bookings that exceed combo coverage (e.g., full-day plus extra hours, half-day plus extra hours) in `tests/room-pricing/unit/calculatePrice.us2.combosPlusHours.test.ts`, including rounding up of partial hours.
- [x] T019 [P] [US2] Add integration tests covering scenarios where multiple valid combos exist and the cheapest combination must be chosen, in `tests/room-pricing/integration/calculatePrice.us2.optimization.test.ts`.
- [x] T020 [P] [US2] Extend UI tests in `tests/room-pricing/integration/RoomPricingCalculator.us2.ui.test.tsx` to verify that bookings with combos plus hourly extensions show both the correct total and an understandable Vietnamese explanation of combo vs extra hours.
- [x] T023 [US2] Update the result display component in `src/features/room-pricing/components/RoomPricingResult.tsx` (create if not existing) to show a per-day breakdown list of combos and hourly extensions, using the `PriceComponent` data.

### Implementation for User Story 2

- [x] T021 [P] [US2] Refine `calculatePrice` in `src/features/room-pricing/lib/calculatePrice.ts` to ensure it correctly enumerates and compares combinations of combos plus hourly extensions for single-day bookings, honoring the priority of combos over pure hourly billing.
- [x] T022 [US2] Update the Vietnamese explanation generator in `src/features/room-pricing/lib/explanationVi.ts` to explicitly mention extra hours (giờ phụ trội) and distinguish weekday vs weekend hourly rates in the narrative text.

**Checkpoint**: User Stories 1 and 2 both work independently and demonstrate correct combos + hourly extension behavior.

---

## Phase 5: User Story 3 – Multi-day bookings crossing weekday/weekend (Priority: P3)

**Goal**: Support bookings spanning multiple days and crossing between weekdays and weekends, splitting by day and applying the correct weekday/weekend pricing while still minimizing the total cost.

**Independent Test**: Create multi-day bookings (e.g., Thu–Sat, Sat–Mon) and verify that the calculation splits days correctly, applies weekday/weekend combos and hourly rates appropriately per day, and still returns the cheapest possible total with a clear Vietnamese explanation per day.

### Tests for User Story 3

- [x] T024 [P] [US3] Add unit tests for multi-day bookings that cross from weekday to weekend and vice versa in `tests/room-pricing/unit/calculatePrice.us3.multiDay.test.ts`, ensuring correct segmentation and pricing per day.
- [x] T025 [P] [US3] Add integration tests for long multi-day bookings (including >48h) in `tests/room-pricing/integration/calculatePrice.us3.longBookings.test.ts`, verifying that combinations across days still yield the minimal total.
- [x] T026 [P] [US3] Extend UI tests in `tests/room-pricing/integration/RoomPricingCalculator.us3.ui.test.tsx` to verify that multi-day bookings display per-day Vietnamese breakdowns and a correct overall total.

### Implementation for User Story 3

- [x] T027 [P] [US3] Enhance the segmentation utility in `src/features/room-pricing/lib/segmentation.ts` to robustly handle long bookings up to 30 days, returning accurate `DailySegment[]` with weekday/weekend classification for each day. (Implemented directly in `calculatePrice.ts` DP logic)
- [x] T028 [US3] Update `calculatePrice` in `src/features/room-pricing/lib/calculatePrice.ts` to process multi-day bookings by aggregating results across `DailySegment[]` while still performing per-day optimization and summing a global total.
- [x] T029 [US3] Update the result display in `src/features/room-pricing/components/RoomPricingResult.tsx` to group and label breakdown lines by date, making it clear to users how each day was charged.

**Checkpoint**: All primary user stories (US1–US3) are independently functional and testable.

---

## Phase 6: User Story 4 – Short bookings less than 3 hours (Priority: P2)

**Goal**: Ensure that bookings shorter than 3 hours are handled consistently according to the decided rule (always charge the full 3-hour combo if available), with clear Vietnamese messaging so users understand the minimum charge.

**Independent Test**: Create bookings shorter than 3 hours on both weekdays and weekends; verify that the system charges the full 3-hour combo price (where defined) and clearly explains this behavior in Vietnamese.

### Tests for User Story 4

- [x] T030 [P] [US4] Add unit tests for <3h bookings in `tests/room-pricing/unit/calculatePrice.us4.shortBookings.test.ts`, verifying that the full 3-hour combo price is applied when available and that behavior is consistent across weekday and weekend.
- [ ] T031 [P] [US4] Add integration tests in `tests/room-pricing/integration/calculatePrice.us4.shortBookings.test.ts` to ensure the rule interacts correctly with other combos and segments.
- [ ] T032 [P] [US4] Extend UI tests in `tests/room-pricing/integration/RoomPricingCalculator.us4.ui.test.tsx` to verify that short bookings show the expected total and a Vietnamese note about minimum 3-hour billing.

### Implementation for User Story 4

- [x] T033 [P] [US4] Adjust `calculatePrice` in `src/features/room-pricing/lib/calculatePrice.ts` to enforce the minimum 3-hour combo rule for short bookings, consistent with `research.md`.
- [ ] T034 [US4] Update `explanationVi.ts` to add explicit wording explaining that short bookings are billed as a full 3-hour combo, so users understand why they are paying for 3 hours even if they stay less.

**Checkpoint**: Short bookings are fully aligned with business rules and clearly communicated in Vietnamese.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and overall quality.

- [ ] T035 [P] Refine Vietnamese copywriting and terminology across all user-facing text in `src/features/room-pricing/components/` and explanation helpers in `src/features/room-pricing/lib/explanationVi.ts` for clarity and consistency.
- [ ] T036 [P] Improve accessibility (labels, keyboard navigation, focus management) for the room pricing form and result views in `src/features/room-pricing/components/`.
- [ ] T037 Run a performance pass to ensure `calculatePrice` and related utilities do not cause perceptible UI lag for long bookings, updating logic in `src/features/room-pricing/lib/` if needed.
- [ ] T038 Ensure `quickstart.md` and any additional documentation in `specs/001-room-pricing-calculator/` reflect the final implementation details and examples.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies – can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion – BLOCKS all user stories.
- **User Stories (Phases 3–6)**: All depend on Foundational phase completion.
  - User stories can then proceed in parallel (if staffed).
  - Recommended sequential priority: US1 (P1) → US2 (P2) & US4 (P2) → US3 (P3).
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) – no dependencies on other stories.
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) – depends logically on US1’s base flows for end-to-end integration but is testable at the calculation level on its own.
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) – reuses the same core calculation and segmentation logic as US1/US2 but focuses on multi-day scenarios.
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) – focuses on short booking behavior, building on the same core calculation logic.

### Within Each User Story

- Tests MUST be written and FAIL before implementation.
- Core calculation and lib updates should be completed before UI wiring for that story.
- Each story should be independently testable through both lib-level and UI-level tests before moving to the next story.

### Parallel Opportunities

- All tasks marked [P] can be executed in parallel as long as they touch different files and do not depend on unfinished tasks.
- After Phase 2, different developers can work on US1–US4 in parallel (respecting priority and shared core logic).
- Test files for different user stories can be authored and run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL – blocks all stories).
3. Complete Phase 3: User Story 1 (single-day combo bookings).
4. **STOP and VALIDATE**: Run all US1 tests and confirm the Vietnamese explanation is clear and correct.
5. Deploy/demo MVP if ready.

### Incremental Delivery

1. Setup + Foundational → base calculator and explanation engine ready.
2. Add User Story 1 → test independently → deploy/demo.
3. Add User Story 2 and User Story 4 → test independently → deploy/demo (better handling of real-world bookings and short stays).
4. Add User Story 3 → test independently → deploy/demo (full multi-day support).
5. Polish phase to improve UX, accessibility, and performance without changing core behavior.
