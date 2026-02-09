# Phase 0 Research – Room booking price calculator

This document captures decisions and clarifications needed to implement the room booking price calculator, based on the feature specification and technical context.

Each section follows the format:
- **Decision**
- **Rationale**
- **Alternatives considered**

---

## 1. Testing stack for React + pricing engine

**Decision**: Use Vitest as the test runner with React Testing Library for component tests and plain TypeScript unit tests for pure calculation logic.

**Rationale**:
- Vitest integrates naturally with Vite-based React projects and supports fast feedback and watch mode.
- React Testing Library emphasizes testing behavior from the user’s perspective, aligning with the Constitution’s focus on user stories and acceptance criteria.
- Using plain TypeScript unit tests for the core pricing functions keeps the algorithm well-isolated, deterministic, and easy to reason about.

**Alternatives considered**:
- Jest: Mature and feature-rich but adds additional configuration overhead on top of Vite/Vitest; Vitest is simpler in this context.
- Cypress/Playwright only: Useful for end-to-end flows but insufficient alone to cover all unit and contract tests required by the Constitution.

---

## 2. Time handling, timezone, and calendar rules

**Decision**: Treat all booking datetimes as local time in the hotel’s timezone (Vietnam, e.g., Asia/Ho_Chi_Minh), with no daylight saving time adjustments, and split bookings strictly by local calendar days.

**Rationale**:
- The hotel operates in a single physical location; guests and staff expect prices to follow local wall-clock time.
- Vietnam does not use daylight saving time, which simplifies calculations and avoids ambiguous or skipped times.
- Splitting by local calendar day aligns with the spec’s requirement to apply weekday/weekend pricing correctly.

**Alternatives considered**:
- Full timezone-agnostic handling with arbitrary timezones: unnecessary complexity for this feature and could introduce confusion.
- UTC-only handling with implicit conversion: would require careful conversion for users and is not aligned with typical hotel booking expectations.

---

## 3. Pricing rule for bookings shorter than 3 hours

**Decision**: For bookings shorter than 3 hours, always charge the full 3-hour combo price for the applicable day type (weekday or weekend) if a 3-hour combo exists; do not prorate by hour below the 3-hour minimum.

**Rationale**:
- The specification emphasizes that combo prices should be applied with priority, and hotels commonly enforce a minimum stay charge (e.g., 3 hours).
- This rule is simple for staff and guests to understand and avoids complex edge-case logic for sub-hour or sub-3-hour billing.
- It keeps the pricing model consistent: the smallest billable “block” is the defined combo, with hourly extension only beyond combo coverage.

**Alternatives considered**:
- Pure hourly pricing for <3h bookings: would contradict the “Always try to apply combo prices first” rule and complicate expectations for guests.
- Mixed rule (choose cheaper of 3-hour combo vs hourly): more complex to explain and may conflict with business policy around minimum charge.

---

## 4. Behavior when pricing data for a room is missing or incomplete

**Decision**: If the selected room does not have complete pricing data in the CSV (missing row or missing required combo prices), block automatic price calculation and show a clear message instructing the user to contact staff or choose another room.

**Rationale**:
- Returning a potentially incorrect or partial price is worse than blocking calculation, especially for financial features.
- Staff can correct the underlying CSV data or handle special cases manually.
- This behavior aligns with the Constitution’s emphasis on correctness, user trust, and clear error messages.

**Alternatives considered**:
- Attempting a best-effort partial calculation (e.g., using only prices that are present): risks undercharging or overcharging and is difficult to explain.
- Providing a manual override input for staff: useful in future iterations but out of scope for this initial feature and would require additional authorization controls.

---

## 5. Maximum booking duration

**Decision**: Do not enforce a hard maximum booking duration in the calculator itself; accept any booking range that the UI date pickers allow, subject to practical performance constraints.

**Rationale**:
- This keeps the calculator flexible for long stays and special cases without embedding a rigid policy limit in the logic.
- UI components (date pickers) and operational monitoring can provide practical safeguards against accidentally extreme ranges (e.g., obviously wrong years).
- It aligns with the clarified requirement that there is no explicit maximum duration, while still allowing us to monitor and optimize for performance.

**Alternatives considered**:
- Enforcing a fixed limit (e.g., 7 or 30 days): simplifies reasoning about performance but may block legitimate long-term bookings that the business wants to support.
- Per-role limits (e.g., guests limited, staff unlimited): adds complexity around roles and is out of scope for this initial implementation.

---

## 6. Algorithm strategy for finding the cheapest price

**Decision**: Implement the pricing engine as a pure function that, for each daily segment, enumerates valid combinations of combos (3-hour, half-day, full-day) and hourly extensions, then uses a bounded search to select the cheapest valid coverage per day and across the full booking.

**Rationale**:
- The number of combos per day is small and fixed, which makes a bounded search tractable on the client.
- Using a pure function on typed inputs improves testability and aligns with the Constitution’s code quality and testing-first principles.
- The approach ensures we truly honor the requirement to always choose the cheapest valid combination, rather than relying on a naive greedy algorithm that might miss cheaper options.

**Alternatives considered**:
- Simple greedy algorithm (always taking the largest combo first): easy to implement but can produce suboptimal prices in some edge cases.
- Full integer programming or optimization libraries: overkill for this domain and would add unnecessary complexity and dependencies.

---

## 7. Vietnamese explanation and UI Language

**Decision**: The calculator UI and all explanations will be in **Vietnamese only**, and the system **must** provide a detailed breakdown of how the price was calculated (combos + hourly extensions).

**Rationale**:
- Clarified in spec: The input data (CSV) is in Vietnamese, and the target audience (guests/receptionists) operates in that context.
- Providing a localized explanation increases transparency and reduces disputes.
- Mandatory breakdown builds trust in the complex calculation logic.

**Alternatives considered**:
- Bilingual/English UI: Rejected to avoid friction with Vietnamese-only source data.
- Optional breakdown: Rejected because transparency is critical for trust.

---

## 8. Input Granularity and Hourly Rates

**Decision**: Datetime inputs uses **1-hour** granularity (e.g., 08:00, 09:00), and hourly extension rates are **fixed** (70k/80k) for all rooms.

**Rationale**:
- 1-hour granularity simplifies the user interface and the calculation logic (no need to handle minute-level rounding or prorating).
- Fixed hourly rates simplify the data model (no need to add hourly rate columns to the CSV).

**Alternatives considered**:
- 15/30-minute steps: Rejected for MVP to keep selection simple.
- Room-specific hourly rates: Rejected as not currently required by business rules.
