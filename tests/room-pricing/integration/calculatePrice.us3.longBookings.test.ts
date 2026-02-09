import { describe, it, expect } from 'vitest';
import { calculatePrice } from '../../../src/features/room-pricing/lib/calculatePrice';
import type { Room, BookingRequest, ComboPricing } from '../../../src/features/room-pricing/lib/types';

// Mock Data
const fullDayCombo: ComboPricing = {
  roomId: 'R1',
  type: 'fullDay',
  label: 'Combo Ngày',
  weekdayPriceVnd: 600000,
  weekendPriceVnd: 700000,
  window: { kind: 'fullDay', startTimeLocal: '14:00', endTimeLocal: '12:00', crossesMidnight: true, durationHours: 22 }
};

// 3 Day Booking: Fri 14:00 -> Mon 12:00.
// Fri 14:00 (Weekend start?) -> Sat 12:00 (Weekend) = 700k.
// Sat 12:00 -> Sat 14:00 (2h Gap). Weekend Hourly = 2 * 80k = 160k.
// Sat 14:00 -> Sun 12:00. Weekend. 700k.
// Sun 12:00 -> Sun 14:00 (2h Gap). Weekend Hourly = 160k.
// Sun 14:00 -> Mon 12:00. (Sun is Weekend). 700k.
// Wait, is Sunday 14:00 Weekend?
// isWeekend(Sun) = true.
// So 700k.
// Total: 700 + 160 + 700 + 160 + 700 = 2,420,000.

const testRoom: Room = {
  id: 'R1',
  category: 'A',
  name: 'Test Room',
  pricing: [fullDayCombo] // Only Full Day available implies heavy use of it or hourly
};

describe('US3 Integration: Long Bookings', () => {
    it('should calculate optimal price for 3-day weekend stay', () => {
        const req: BookingRequest = {
            roomId: 'R1',
            startDateTime: '2023-10-06T14:00:00', // Fri
            endDateTime: '2023-10-09T12:00:00'  // Mon
        };

        // Fri -> Sat (Weekend)
        // Sat -> Sun (Weekend)
        // Sun -> Mon (Weekend start?)
        // Mon is weekday (1). Sun is weekend (0).
        // Combo starts Sun 14:00.
        // `isWeekend` check in `calculatePrice` uses `currentTime`.
        // Start time of combo determines price?
        // Logic: `const comboIsWeekend = currentIsWeekend;`
        // `currentIsWeekend` is based on `currentTime` (steps).
        // If I am at Sun 14:00. `isWeekend` is true.
        // Price = weekendPriceVnd (700k).

        const res = calculatePrice(req, testRoom);
        expect(res.ok).toBe(true);
        expect(res.breakdown?.totalVnd).toBe(2420000);

        // Verify components count
        // 3 Combos + 2 Gaps (merged or not?)
        // Gap 1: Sat 12-14.
        // Gap 2: Sun 12-14.
        // Structure: C, H, C, H, C.
        expect(res.breakdown?.components).toHaveLength(5);
    });

    it('should handle >48h booking purely with hourly if combos are missing', () => {
         // Force hourly fallback
         const hourlyRoom: Room = { ...testRoom, pricing: [] };
         // 50 hours weekday.
         // 50 * 70k = 3,500,000.
         const req: BookingRequest = {
            roomId: 'R1',
            startDateTime: '2023-10-02T00:00:00', // Mon
            endDateTime: '2023-10-04T02:00:00'  // Wed 02:00 (50h)
        };
        const res = calculatePrice(req, hourlyRoom);
        expect(res.ok).toBe(true);
        expect(res.breakdown?.totalVnd).toBe(3500000);

        // Should be merged into PER DAY items?
        // Merging logic: same day, same weekend status.
        // Mon 00-24: 24h.
        // Tue 00-24: 24h.
        // Wed 00-02: 2h.
        // Total 3 components.
        expect(res.breakdown?.components).toHaveLength(3);
        expect(res.breakdown?.components[0].hours).toBe(24);
        expect(res.breakdown?.components[1].hours).toBe(24);
        expect(res.breakdown?.components[2].hours).toBe(2);
    });
});
