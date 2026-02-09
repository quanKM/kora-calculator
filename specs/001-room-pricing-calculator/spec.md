# Feature Specification: Room booking price calculator

**Feature Branch**: `001-room-pricing-calculator`
**Created**: Monday Feb 9, 2026
**Status**: Draft
**Input**: User description: "Build a web application that calculates the total booking price for a room based on:

Selected Room

Start datetime

End datetime

Pricing rules loaded from a CSV file @src/assets/pricing.csv

The system must always compute the cheapest valid price combination.

Data Source (CSV)

The application loads pricing data from a CSV file with the following columns:

Mã phòng → Room ID

Hạng phòng → Room Category

Tên Phòng → Room Name

Nghỉ theo giờ → Combo price for 3 hours

Nghỉ Nửa Ngày → Combo price for:

10:00 → 19:00 (same day), OR

22:00 → 09:00 (next day)

Nghỉ 1 ngày → Combo price for:

14:00 → 12:00 (next day)

Each price column contains two prices:

T2–T5 → Monday to Thursday

T6–CN → Friday to Sunday

UI Requirements (Interface Language: Vietnamese)

Dropdown to select Room Name ("Tên Phòng")

DateTime picker for:

From datetime ("Ngày giờ nhận")

To datetime ("Ngày giờ trả")

Button: "Tính tiền" (Calculate Price)

Display:

Total price (VND) ("Tổng tiền")

Total price (VND) ("Tổng tiền")

Breakdown of applied combos ("Chi tiết giá" - Required)

Pricing Rules (Very Important)
1. Priority Rule

Always try to apply combo prices first

Only charge hourly extension if combos do not fully cover the booking period

2. Combo Rules

Combos can be combined (e.g. 1-day + hourly extension)

Multiple combos can be used in a single booking

The algorithm must find the cheapest combination

3. Hourly Extension

If booking exceeds combo coverage:

Monday–Thursday (T2–T5): 70,000 VND per hour

Friday–Sunday (T6–CN): 80,000 VND per hour

Partial hours must be rounded up to the next full hour

4. Day-Based Pricing

Pricing is determined by the day of the booking time

If a booking spans multiple days:

Split calculation per day

Apply weekday/weekend pricing correctly

Calculation Strategy (Suggested)

Parse CSV into structured room pricing data

Convert booking time range into hourly blocks

For each block:

Try to match valid combos (3h / half-day / full-day)

Use dynamic programming or greedy + backtracking to:

Combine combos

Minimize total price

Apply hourly extension only when necessary

Return:

Final total price

Explanation of applied pricing rules

Edge Cases to Handle

Booking less than 3 hours

Booking crossing weekday → weekend

Booking overlapping combo boundaries

Booking exactly matching combo times

Booking longer than 24 hours

Multiple-day bookings with mixed pricing"

## Clarifications

### Session 2026-02-09
- Q: What language should the UI text and input labels be in? → A: **Vietnamese only**, to match the pricing CSV data.
- Q: Is the price breakdown display required or optional? → A: **Required**. The system must show how the total was calculated (combos + hourly extensions).
- Q: What time step/granularity should the datetime pickers use? → A: **1 hour** (e.g., 08:00, 09:00, 10:00).
- Q: Are hourly extension rates flat or room-dependent? → A: **Fixed (Flat Rate)**. The standard rates (70k/80k) apply to ALL rooms.

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Calculate price for a single-day booking within one combo window (Priority: P1)

As a guest or receptionist, I want to calculate the total price for a booking that fully fits within a single combo window (for example, a 3-hour stay or a defined half-day or full-day period) so that I can quickly see the correct total price without manual calculation.

**Why this priority**: This is the most common and fundamental use case for the calculator and must work reliably before any more complex scenarios. If this scenario is not correct, the feature cannot be trusted for any booking.

**Independent Test**: A tester can select a room, choose start and end datetimes that exactly match or fall inside a single combo window on a weekday or weekend, click “Calculate Price”, and verify that the output matches the expected combo price from the pricing data for that room and day segment without any extra hourly charges.

**Acceptance Scenarios**:

1. **Given** a room with defined 3-hour, half-day, and 1-day combo prices for Monday–Thursday, **When** the user selects that room and chooses start and end datetimes that exactly match a 3-hour combo period on a Wednesday, **Then** the system shows a total price equal to the 3-hour weekday combo price and shows no hourly extension in the breakdown.
2. **Given** a room with defined half-day combo prices for both weekday and weekend, **When** the user selects that room and chooses a booking from 10:00 to 19:00 on a Saturday, **Then** the system shows a total price equal to the half-day weekend combo price and shows no hourly extension in the breakdown.
3. **Given** a room with defined 1-day combo prices for both weekday and weekend, **When** the user selects that room and chooses a booking from 14:00 on a Monday to 12:00 on the following Tuesday, **Then** the system shows a total price equal to the 1-day weekday combo price and shows that the booking is covered entirely by a single full-day combo.

---

### User Story 2 - Calculate price for a booking that requires combos plus hourly extension (Priority: P2)

As a guest or receptionist, I want the system to calculate the total price for a booking that is longer than the available combo windows, using a combination of combos and hourly extensions, so that I always get the cheapest possible total price.

**Why this priority**: Many real bookings will not match combo windows exactly. The ability to combine combos with hourly extensions while still minimizing price is critical for fairness and revenue consistency, and directly affects customer trust.

**Independent Test**: A tester can construct bookings that extend slightly beyond one or more combos on different days, calculate the total, and compare the result with manually computed optimal combinations of combos plus hourly extensions. The tester can verify that the system chooses the cheapest valid combination and correctly rounds partial hours up.

**Acceptance Scenarios**:

1. **Given** a room with defined 1-day and 3-hour combo prices on a weekday, **When** the user selects that room and chooses a booking from 14:00 on Tuesday to 16:30 on Wednesday (26.5 hours), **Then** the system applies one 1-day combo plus an hourly extension of 3 hours at the weekday hourly rate (rounding 2.5 hours up to 3) and shows a total equal to the 1-day combo price plus 3 hourly units.
2. **Given** a room with defined half-day combo and hourly rates for a weekend, **When** the user selects that room and chooses a booking from 10:00 to 22:30 on a Sunday, **Then** the system applies one half-day weekend combo and additional hourly charges at the weekend hourly rate for the remaining time (rounded up to the next full hour) and shows this breakdown clearly.
3. **Given** a room where it is cheaper to combine two 3-hour combos instead of using a single half-day combo for a specific booking window, **When** the user selects that room and chooses a booking that could be covered either by one half-day combo or by two 3-hour combos plus possible hourly extension, **Then** the system chooses the combination (combos and hours) that yields the lowest total price and displays which combination was chosen.

---

### User Story 3 - Calculate price for multi-day bookings crossing weekday and weekend (Priority: P3)

As a guest or receptionist, I want to calculate the total price for bookings that span multiple calendar days and cross between weekdays and weekends, so that each day is charged correctly according to weekday/weekend rules and the overall price is still minimized.

**Why this priority**: Multi-day bookings are less frequent than single-day stays but have higher financial impact. Correctly handling weekday/weekend transitions and multiple days is essential for revenue accuracy and avoiding disputes for long stays.

**Independent Test**: A tester can create bookings that span several days, including transitions from Thursday to Friday and Sunday to Monday, calculate the total, and verify that the system splits the booking per day, applies the correct weekday or weekend combos and hourly rates for each day, and still produces the cheapest overall combination.

**Acceptance Scenarios**:

1. **Given** a booking that runs from Thursday 14:00 to Saturday 12:00, **When** the user calculates the price, **Then** the system treats the Thursday-to-Friday portion using weekday pricing and the Friday-to-Saturday portion using weekend pricing, applies appropriate combos and hourly extensions for each day, and returns the lowest possible total that covers the entire stay.
2. **Given** a booking that runs from Saturday 22:00 to Monday 09:00, **When** the user calculates the price, **Then** the system applies the correct weekend overnight combo and weekday morning coverage (via combos and/or hourly extension) according to the CSV prices, and the total equals the cheapest combination across both days.
3. **Given** a multi-day booking that lasts more than 48 hours and crosses both weekday and weekend periods, **When** the user calculates the price, **Then** the system splits the booking by calendar day, applies full-day, half-day, and 3-hour combos plus hourly extensions as needed per day, and returns a final total that is the minimum achievable cost for covering all the booked time.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- Booking duration is less than 3 hours and does not fully align with any defined combo window (start time is arbitrary within the day).
- Booking exactly matches a defined combo window (e.g., exactly 10:00–19:00 or 22:00–09:00) and must not include any additional hourly charges.
- Booking overlaps two or more potential combos in different ways (for example, overnight plus an extra few hours vs. full-day combo plus hourly) where multiple valid combinations exist; the system must always choose the cheapest valid combination.
- Booking crosses from weekday to weekend or weekend to weekday (for example, Thursday night to Friday morning, Sunday night to Monday morning), and pricing must be split per calendar day with the correct weekday/weekend combos and hourly rates.
- Booking is very long (for example, more than 7 calendar days) and needs repeated combination of full-day and other combos plus hourly extension; the system must handle such cases without failing or producing inconsistent results, subject to practical performance constraints.
- Booking uses a room that does not appear in the pricing data for some reason (for example, missing CSV row); the system must block automatic price calculation and clearly inform the user that pricing cannot be calculated for that room and that they should choose another room or contact staff.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: The system MUST allow the user to select a specific room by its human-friendly room name from a list populated from the pricing data.
- **FR-002**: The system MUST allow the user to select a start datetime and an end datetime for the booking, ensuring that the end datetime is after the start datetime.
  - **Constraint**: Inputs MUST use **1-hour granularity** (e.g., 10:00, 11:00) to simplify selection and calculation.
- **FR-003**: The system MUST load pricing information from a structured data source that corresponds to the CSV file (including room ID, room category, room name, and weekday/weekend prices for 3-hour, half-day, and 1-day combos).
- **FR-004**: The system MUST support different prices for Monday–Thursday versus Friday–Sunday for each combo type, as defined in the pricing data.
- **FR-005**: The system MUST determine, for each portion of the booking, whether the time falls on a weekday (Monday–Thursday) or weekend (Friday–Sunday) and apply the corresponding weekday or weekend prices.
- **FR-006**: The system MUST interpret the defined combo windows for each room, including:
  - 3-hour stay (“Nghỉ theo giờ”)
  - Half-day stay (10:00–19:00 same day, or 22:00–09:00 next day)
  - Full-day stay (14:00–12:00 next day)
- **FR-007**: The system MUST calculate booking price by prioritizing the use of combo prices to cover as much of the booking period as possible before applying hourly extensions.
- **FR-008**: The system MUST allow multiple combos to be used within a single booking (for example, combinations of full-day, half-day, and 3-hour combos) as long as the combination covers the booking period.
- **FR-009**: The system MUST support adding hourly extension pricing when combos do not fully cover the booking period, using:
  - 70,000 VND per hour for Monday–Thursday
  - 80,000 VND per hour for Friday–Sunday
- **FR-010**: The system MUST round any partial extension hour up to the next full hour when calculating hourly extension charges.
- **FR-011**: The system MUST split booking periods that span multiple calendar days into day-based segments and apply day-specific combos and hourly pricing for each day.
- **FR-012**: The system MUST consider all valid combinations of available combos and hourly extensions for the booking period and MUST always choose the combination that yields the lowest total price.
- **FR-013**: The system MUST display the final total price in VND to the user after calculation.
- **FR-014**: The system MUST display a human-readable breakdown of the applied combos and hourly extensions (for example, which combos were used on which days and how many hours of extension were charged) to help users understand the price.
- **FR-015**: The system MUST handle invalid input gracefully, including cases where the end datetime is before or equal to the start datetime, and MUST present a clear error message asking the user to correct the input.
- **FR-016**: The system MUST handle cases where pricing data for the selected room is missing or incomplete by blocking automatic price calculation and clearly informing the user that a price cannot be calculated, suggesting they choose another room or contact staff.
- **FR-017**: The system MUST support bookings that extend over multiple days (for example, more than 24 hours) and correctly apply repeated combos and hourly extensions across all days, without enforcing an explicit maximum booking duration beyond any limits imposed by the date pickers and practical performance constraints.

### Key Entities *(include if feature involves data)*

- **Room**: Represents a bookable room, including its room ID (“Mã phòng”), category (“Hạng phòng”), name (“Tên Phòng”), and its association to pricing entries in the pricing data.
- **ComboPricing**: Represents a combo pricing option for a room, including combo type (3-hour, half-day, full-day), applicable time window(s) within a day, weekday price (Monday–Thursday), weekend price (Friday–Sunday), and any descriptive labels needed for display.
- **BookingRequest**: Represents a user’s booking input, including selected room, start datetime, end datetime, and any contextual information needed for validation (e.g., source of the request such as guest vs receptionist if relevant).
- **DailySegment**: Represents a portion of a booking that falls within a single calendar day, including the date, segment start, segment end, classification as weekday or weekend, and the combos and hours applied within that day.
- **PriceBreakdown**: Represents the result of a calculation, including the total price, a list of applied combos and hourly extensions per day, intermediate subtotals, and any notes on assumptions used in the calculation.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: For a representative test set of single-day bookings that fit within a single combo window, 100% of calculated prices match manually computed expected totals using the defined pricing rules.
- **SC-002**: For a representative test set of complex bookings (including bookings with combos plus hourly extensions and multi-day bookings crossing weekday/weekend boundaries), at least 95% of calculated prices match the cheapest manually computed combination, and any discrepancies are analyzed and resolved before release.
- **SC-003**: In usability testing, at least 90% of users (guests or receptionists) can successfully use the calculator to obtain a price without external help on their first attempt for common scenarios.
- **SC-004**: In pilot usage, the number of pricing disputes or manual recalculation requests related to room bookings decreases by at least 50% compared to the period before this calculator is introduced.
- **SC-005**: For typical bookings, users see the calculated price and (if enabled) the breakdown within a short, reasonable time that feels immediate and does not interrupt their workflow (as measured in user feedback sessions).
