# Tasks: Enforce 3-Hour Minimum Charge

### Phase 1: Verification & Regression

- [x] T001 [US4] Run all existing unit tests to confirm current success rate
- [x] T002 [US4] Add a test case for exactly 3 hours where hourly is cheaper than combo

### Phase 2: Implementation

- [x] T003 [US4] Modify `calculatePrice.ts` to strictly enforce 3-hour combo for `totalHours <= 3`
- [x] T004 [US4] Ensure breakdown components are correctly reset to the single combo

- [x] Phase 3: Final Verification

- [x] T005 Run all tests to ensure no breaks
- [x] T006 Manual verification in browser
