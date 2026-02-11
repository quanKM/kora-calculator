# Quickstart: Optimize Booking Price Calculation

## Setup

1.  Ensure you are on the branch `002-optimize-booking-pricing`.
2.  Install dependencies:
    ```bash
    npm install
    ```

## Development

-   **Pricing Logic**: Modified in `src/features/room-pricing/lib/calculatePrice.ts`.
-   **UI Components**: Modified in `src/features/room-pricing/components/RoomPricingForm.tsx`.

## Testing

### Automated Tests
Run unit tests to verify the gapless logic:
```bash
npm test tests/room-pricing/unit/calculatePrice.us3.multiDay.test.ts
```

### Manual Verification
1.  Run the development server:
    ```bash
    npm run dev
    ```
2.  Open the application in your browser.
3.  Select a room.
4.  Verify that the "Nhận Phòng" and "Trả Phòng" inputs do not have minute selectors and only allow selecting hours.
5.  Input a booking from **14:00 (Tuesday)** to **12:00 (Thursday)**.
6.  Click **Tính Toán**.
7.  Verify that the total price reflects exactly 2 Full-Day combos and the breakdown does not show 2 hours of extension.
