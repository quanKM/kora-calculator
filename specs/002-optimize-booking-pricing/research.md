# Research: Optimize Booking Price Calculation

## Gapless Consecutive Full-Day Combos

### Problem
The current pricing logic is built on 1-hour steps in a DP/Dijkstra algorithm. A "Full Day" combo is defined as 14:00 to 12:00 next day (22 hours). This leaves a 2-hour gap (12:00 to 14:00) during which the system currently charges hourly extension rates.

### Decision
Modify `calculatePrice.ts` to allow "bridging" consecutive Full-Day combos.
- When the algorithm reaches 12:00 (the end of a Full-Day combo), we will add a special transition step of 2 hours with 0 cost that lands the state at 14:00, IF the target end time allows it.
- Alternatively, we can adjust the `coverageEnd` logic for Full Day combos. If a Full Day combo is applied, and the next possible combo is also a Full Day starting 2 hours later, we extend the current one's coverage by 2 hours at no cost ONLY IF it leads to another Full Day combo.
- **Simpler approach**: In the DP step loop, if the current step `i` corresponds to 12:00 and we have a Full Day combo available for the day, check if skipping to 14:00 (i+2) is cheaper.

### Rationale
This minimizes changes to the core DP architecture while satisfying the user requirement.

## Simplified Date/Time Selection

### Problem
The current UI uses `<input type="datetime-local" step="3600">`. While it enforces 1-hour granularity in some browsers, it's not a consistent "WOW" experience and may still show minutes.

### Decision
Replace the native `datetime-local` input with a custom shadcn-based `DateTimePicker` that only exposes the date and a 24-hour selector.
- Use `Calendar` for date.
- Use `Select` for Hour (0-23).
- Remove minute selection entirely.

### Rationale
Aligns with the requirement to "remove minute selector" and provides a more premium, tailored experience.

## Verification Strategy
- **Unit Tests**: Add a test case for 14:00 Tue to 12:00 Thu. Expected: Exactly 2 * FullDayPrice.
- **UI Tests**: Manual verification that minutes are not visible.
