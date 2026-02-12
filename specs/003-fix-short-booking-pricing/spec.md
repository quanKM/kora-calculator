# Feature Specification: Enforce 3-Hour Minimum Charge

**Feature Branch**: `003-fix-short-booking-pricing`
**Created**: 2026-02-12
**Status**: Draft
**Input**: User description: "Check why the calculator is only using hourrate. If user select lest than 3 hours, always use combo 3 hours"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enforce 3-Hour Combo for Short Bookings (Priority: P1)

As a booking administrator, I want the system to always charge a minimum of 3 hours (using the 3-hour combo price) even if the customer books for 1 or 2 hours, so that we ensure a minimum revenue per booking.

**Why this priority**: Correct billing for short stays is a core business rule and was explicitly requested by the user.

**Independent Test**: A booking for 1 hour or 2 hours should result in a price exactly equal to the 3-hour combo price defined for that room.

**Acceptance Scenarios**:

1. **Given** a room has a 3-hour combo priced at 200,000 VND and a 1-hour hourly rate of 70,000 VND, **When** a user books for 1 hour, **Then** the total price should be 200,000 VND.
2. **Given** a room has a 3-hour combo priced at 200,000 VND and a 1-hour hourly rate of 70,000 VND, **When** a user books for 2 hours, **Then** the total price should be 200,000 VND.
3. **Given** a room has a 3-hour combo priced at 200,000 VND, **When** a user books for 3 hours, **Then** the total price should be 200,000 VND.

---

### Edge Cases

- **What happens when no 3-hour combo is defined for a room?** The system should fallback to the standard hourly rate.
- **How does the system handle weekend pricing?** The 3-hour minimum charge should use the weekend 3-hour combo price if the booking starts on a weekend.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST identify bookings with total duration < 3 hours.
- **FR-002**: System MUST check for the presence of a "threeHour" combo type in the room's pricing data.
- **FR-003**: System MUST override the calculated hourly cost with the "threeHour" combo price if the booking duration is less than 3 hours and a combo is available.
- **FR-004**: System MUST display the "threeHour" combo in the pricing breakdown for these short bookings to explain the charge.

### Key Entities

- **BookingRequest**: Represents the user's selected time range.
- **Room/ComboPricing**: Contains the configured price for the 3rd hour combo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of bookings under 3 hours for rooms with 3h combos are charged correctly at the combo rate.
- **SC-002**: The pricing breakdown explicitly mentions the "Nghỉ theo giờ (3 tiếng)" combo for these stays.
