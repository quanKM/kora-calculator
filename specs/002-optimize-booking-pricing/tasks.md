# Tasks: Optimize Booking Price Calculation

**Input**: Design documents from `/specs/002-optimize-booking-pricing/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

## Organization: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization (Already complete for this feature)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure (Already complete for this feature)

---

## Phase 3: User Story 1 - Multi-day booking with consecutive 1-day combos (Priority: P1) 🎯 MVP

**Goal**: Eliminate the 2-hour charge between consecutive full-day combos (14:00 - 12:00 next day).

**Independent Test**: Booking from Tuesday 14:00 to Thursday 12:00 should result in exactly 2 full-day combo charges and 0 extension hours.

### Tests for User Story 1

- [x] T001 [P] [US1] Add gapless logic unit test case to tests/room-pricing/unit/calculatePrice.us3.multiDay.test.ts
- [x] T002 [US1] Implement gap-bridging logic at 12:00 for full-day combos in src/features/room-pricing/lib/calculatePrice.ts
- [x] T003 [US1] Verify T001 passes and no regressions in other calculatePrice tests

---

## Phase 4: User Story 2 - Simplified Date/Time Selection (Priority: P2)

**Goal**: Remove minute selection from the UI and enforce 1-hour granularity.

**Independent Test**: Open the UI and verify that the datetime picker does not allow selecting or displaying minutes. Force-typing minutes should result in 00.

### Implementation for User Story 2

- [x] T004 [P] [US2] Update RoomPricingForm to enforce 1-hour granularity (step="3600") and force 00 minutes in src/features/room-pricing/components/RoomPricingForm.tsx

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T005 [P] Run all room-pricing unit tests to ensure no regressions in tests/room-pricing/unit/
- [ ] T006 [P] Perform manual verification of the end-to-end flow as per quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **User Story 1 (P1)**: High priority, should be implemented first.
- **User Story 2 (P2)**: UI simplification, can be done after or in parallel with US1.
- **Polish**: Depends on completion of T001-T004.

### Parallel Opportunities

- T001 (US1 Test) and T004 (US2 UI) can start in parallel as they touch different files and layers.

## Implementation Strategy: MVP First (User Story 1 Only)

1. Complete T001 (Test)
2. Complete T002 (Logic)
3. Validate US1 independently
4. Proceed to US2 (UI)
