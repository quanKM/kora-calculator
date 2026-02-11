# Feature Specification: Optimize Booking Price Calculation

**Feature Branch**: `002-optimize-booking-pricing`
**Created**: Wednesday Feb 11, 2026
**Status**: Draft
**Input**: User description: "update on how to calculate the booking price. If user select 2 full day combo, no need to add extra 2 hour for the gap between these combo. For example, if user select 2PM on Tuesday and return room at 12PM on Thursday, it only take 2 combo. Also, i want to remove minute selector. I only want to select day and hour."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-day booking with consecutive 1-day combos (Priority: P1)

As a guest or receptionist, I want to book a room for multiple days using 1-day combos without being charged for the 2-hour gap between them (12:00 to 14:00), so that the pricing is fair for contiguous stays.

**Why this priority**: Correcting the multi-day pricing is the primary goal of this update. It ensures that guests staying multiple full days are not penalized by the technical gap in combo definitions.

**Independent Test**: Select a room, set start time to Tuesday 14:00 and end time to Thursday 12:00. The system should calculate exactly 2 full-day combos with zero hourly extensions.

**Acceptance Scenarios**:

1. **Given** a 1-day combo from 14:00 to 12:00 next day, **When** the user books from 14:00 Monday to 12:00 Wednesday, **Then** the total price is exactly `price_1day * 2`.
2. **Given** a booking from 14:00 Monday to 12:00 Thursday (3 days), **When** calculating, **Then** the total price is exactly `price_1day * 3`.

---

### User Story 2 - Simplified Date/Time Selection (Priority: P2)

As a user, I want to select only the day and hour for check-in and check-out, without dealing with minutes, to make the booking process faster and less error-prone.

**Why this priority**: Simplifying the UI improves user experience and aligns with the requirement for 1-hour granularity in price calculations.

**Independent Test**: Open the booking form and verify that the date/time picker only allows selecting hours (0-23) and does not show or allow selecting minutes.

**Acceptance Scenarios**:

1. **Given** the check-in time picker, **When** used, **Then** only the date and hour are selectable.
2. **Given** a booking calculation, **When** start and end times are selected, **Then** they always default to `HH:00:00`.

---

### Edge Cases

- **Booking starting before 14:00 or ending after 12:00 on a multi-day stay**: If a user books from 12:00 Monday to 12:00 Wednesday, how is the 12:00-14:00 on Monday treated? (Should be 1-day combo + 2 hours extension).
- **Gap between non-consecutive combos**: If user selects 1-day combo + 3-hour combo, does any gap apply? (The rule currently only specifies consecutive 1-day combos).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST remove the minute selector from all date/time pickers.
- **FR-002**: The system MUST enforce 1-hour granularity for all booking inputs (minutes are always 00).
- **FR-003**: The system MUST identify consecutive "1-day combos" (14:00 - 12:00 next day).
- **FR-004**: For consecutive 1-day combos, the system MUST NOT charge for the 2-hour interval between 12:00 (end of combo N) and 14:00 (start of combo N+1).
- **FR-005**: If a booking spans multiple days and uses 1-day combos, the price calculation MUST treat the combined period as contiguous if they are separated only by the standard 2-hour gap.
- **FR-006**: The hourly extension rate still applies for time outside the "extended" combo coverage (e.g., if checking in at 10:00 AM instead of 2:00 PM on the first day).

### Key Entities *(include if feature involves data)*

- **BookingPeriod**: Now represents a simplified range with Day and Hour only.
- **PricingLogic**: Updated to handle "Gapless Consecutive Combos" specifically for the 1-day type.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of 46-hour bookings (14:00 Day 1 to 12:00 Day 3) result in exactly 2 full-day combo charges.
- **SC-002**: UI testing confirms 0 occurrences of a minute selector in the production build.
- **SC-003**: Regression tests for existing pricing (single combos, hourly extensions) pass without impact from the new "gap" rule.
