# Data Model: Optimize Booking Price Calculation

## Entities

### BookingRequest (Existing, updated usage)
- `roomId`: string
- `startDateTime`: string (ISO 8601) - **Constraint**: Minutes MUST always be 00.
- `endDateTime`: string (ISO 8601) - **Constraint**: Minutes MUST always be 00.

### PriceComponent (Existing)
- `kind`: 'combo' | 'hourlyExtension'
- `descriptionVi`: string
- `amountVnd`: number
- `hours`: number | null (Hours of extension)
- `comboType`: ComboType | null

## Logic Updates

### Full-Day Combo Bridge Rule
When calculating the cheapest price using the DP approach:
- A `Full Day` combo covers 22 hours (14:00 Day N to 12:00 Day N+1).
- If the current step `i` lands at **12:00**, a special "Bridge" option is considered.
- The Bridge option has **0 cost** and advances the state by **2 hours** to 14:00.
- This transition is ONLY valid if the next state (14:00) allows for a consecutive Full-Day combo application OR if it's the final end time (if end time is between 12:00 and 14:00, it's covered).
- **Refinement**: Simply allow the Full Day combo to cover 24 hours (14:00 to 14:00 next day) when combined with another Full Day combo.
