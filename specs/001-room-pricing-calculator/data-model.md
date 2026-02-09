# Data Model – Room booking price calculator

This document describes the core data structures used by the room booking price calculator, derived from the feature specification and Phase 0 research.

The data model is frontend-oriented (TypeScript/React) but is expressed here in an implementation-agnostic way.

---

## 1. Room

Represents a bookable room loaded from the pricing CSV.

- **id** (`string`): Internal room identifier (from “Mã phòng”).
- **category** (`string`): Room category/grade (from “Hạng phòng”).
- **name** (`string`): Human-friendly room name (from “Tên Phòng”).
- **pricing** (`ComboPricing[]`): List of combo pricing options associated with this room.

Validation rules:
- `id`, `name`, and `category` must be non-empty.
- Each `Room` must have at least one associated `ComboPricing` entry to be considered “fully priced”.

---

## 2. ComboPricing

Represents a combo pricing option for a specific room and combo type.

- **roomId** (`string`): ID of the room this combo applies to.
- **type** (`"threeHour" | "halfDay" | "fullDay"`): Logical combo type.
- **label** (`string`): Human-readable label, e.g., `"Nghỉ theo giờ (3 tiếng)"`, `"Nghỉ nửa ngày"`, `"Nghỉ 1 ngày"`.
- **weekdayPriceVnd** (`number`): Price in VND for Monday–Thursday (T2–T5).
- **weekendPriceVnd** (`number`): Price in VND for Friday–Sunday (T6–CN).
- **window** (`ComboWindow`): Time-of-day window that defines when and how this combo applies.

### 2.1 ComboWindow

Describes the daily time window for a combo.

- **kind** (`"threeHour" | "halfDayDay" | "halfDayNight" | "fullDay"`): More granular window classification.
- **startTimeLocal** (`HH:mm` string): Local start time (e.g., `"10:00"`, `"14:00"`, `"22:00"`).
- **endTimeLocal** (`HH:mm` string): Local end time (e.g., `"19:00"`, `"12:00"`, `"09:00"`).
- **crossesMidnight** (`boolean`): Whether the window ends on the following calendar day (e.g., 22:00–09:00, 14:00–12:00 next day).
- **durationHours** (`number`): Expected duration in hours (e.g., `3`, `9`, `22`).

Validation rules:
- `durationHours` must be positive.
- For `crossesMidnight = false`, `endTimeLocal` must be strictly after `startTimeLocal` within the same day.

---

## 3. BookingRequest

Represents the user’s input to the calculator.

- **roomId** (`string`): ID of the selected room.
- **startDateTime** (`DateTime`): Local start datetime (hotel timezone).
- **endDateTime** (`DateTime`): Local end datetime (hotel timezone).
- **source** (`"guest" | "staff" | "unknown"`): Optional indicator of who is using the tool.

Validation rules:
- `endDateTime` must be strictly after `startDateTime`.
- **Granularity**: `startDateTime` and `endDateTime` must be on exact hour boundaries (e.g., 10:00, 11:00) per spec clarification.
- `roomId` must correspond to a room that has complete pricing data.

---

## 4. DailySegment

Represents the portion of a booking that falls within a single local calendar day.

- **date** (`LocalDate`): The calendar date of the segment.
- **startDateTime** (`DateTime`): Segment start (inclusive).
- **endDateTime** (`DateTime`): Segment end (exclusive).
- **isWeekend** (`boolean`): `true` if the date is Friday–Sunday (T6–CN), `false` for Monday–Thursday (T2–T5).
- **room** (`Room`): The room associated with this booking.
- **applicableCombos** (`ComboPricing[]`): Combos that can apply on this day (for this room).

Validation rules:
- `startDateTime` and `endDateTime` must fall on the same `date`.
- `endDateTime` must be after `startDateTime`.
- `applicableCombos` is typically all combos for the room, but may be filtered or constrained by business rules.

---

## 5. PriceComponent

Represents a single component of the calculated price (combo or hourly extension).

- **kind** (`"combo" | "hourlyExtension"`).
- **descriptionVi** (`string`): Human-readable explanation in Vietnamese for this component (e.g., `"1 combo 1 ngày (T2–T5)"`, `"3 giờ phụ trội cuối ngày Chủ Nhật"`).
- **day** (`LocalDate`): The calendar day this component applies to.
- **comboType** (`"threeHour" | "halfDay" | "fullDay" | null`): Combo type if `kind = "combo"`, otherwise `null`.
- **hours** (`number | null`): Number of hours billed if `kind = "hourlyExtension"`, otherwise `null`.
- **isWeekend** (`boolean`): Whether weekend pricing was used.
- **amountVnd** (`number`): Price contributed by this component in VND.

Validation rules:
- For `kind = "combo"`, `comboType` must be non-null and `hours` may be null.
- For `kind = "hourlyExtension"`, `hours` must be positive integer (due to rounding up/granularity) and `comboType` may be null.
- `amountVnd` must be non-negative.

---

## 6. PriceBreakdown

Represents the full result of a price calculation for a booking.

- **room** (`Room`): Room for which the calculation was made.
- **request** (`BookingRequest`): Original booking request.
- **components** (`PriceComponent[]`): Ordered list of price components, grouped logically by day.
- **totalVnd** (`number`): Sum of all `amountVnd` values.
- **summaryVi** (`string`): Overall narrative summary in Vietnamese explaining how the total was derived (e.g., describing how many combos and extra hours were used on each day).
- **warnings** (`string[]`): Optional list of warnings or notes (e.g., “Giá không thể tính vì thiếu dữ liệu cho phòng này”).

Validation rules:
- `totalVnd` must equal the sum of `components.amountVnd`.
- `summaryVi` should be non-empty for successful calculations.
- If calculation fails due to missing data or invalid input, `components` may be empty and `warnings` must contain a clear explanation for the user.

---

## 7. CalculatorResult

Represents the outcome of attempting a calculation (success or failure).

- **ok** (`boolean`): Whether the calculation succeeded.
- **breakdown** (`PriceBreakdown | null`): Present when `ok = true`.
- **errorMessageVi** (`string | null`): Vietnamese error message for the user when `ok = false` (e.g., invalid date range, missing pricing data, booking longer than 30 days).

Validation rules:
- If `ok = true`, `breakdown` must be non-null and `errorMessageVi` must be null.
- If `ok = false`, `breakdown` must be null and `errorMessageVi` must be non-empty.

---

These models are intended to guide both implementation and testing: unit tests should operate over `BookingRequest` → `CalculatorResult`, and UI components should consume `PriceBreakdown` and its Vietnamese explanation fields to render clear, localized feedback to users.
