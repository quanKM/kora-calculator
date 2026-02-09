import { describe, it, expect } from 'vitest';
import { calculatePrice } from '../../../src/features/room-pricing/lib/calculatePrice';
import type { Room, BookingRequest, ComboPricing } from '../../../src/features/room-pricing/lib/types';

// Mock Data
const threeHourCombo: ComboPricing = {
  roomId: 'R1',
  type: 'threeHour',
  label: 'Combo 3h',
  weekdayPriceVnd: 200000,
  weekendPriceVnd: 220000,
  window: { kind: 'threeHour', startTimeLocal: '00:00', endTimeLocal: '23:59', crossesMidnight: false, durationHours: 3 }
};

const fullDayCombo: ComboPricing = {
  roomId: 'R1',
  type: 'fullDay',
  label: 'Combo Full Day',
  weekdayPriceVnd: 600000,
  weekendPriceVnd: 700000,
  window: { kind: 'fullDay', startTimeLocal: '14:00', endTimeLocal: '12:00', crossesMidnight: true, durationHours: 22 }
};

const testRoom: Room = {
  id: 'R1',
  category: 'A',
  name: 'Test Room',
  pricing: [threeHourCombo, fullDayCombo]
};

describe('US2: Combos + Hourly Extensions', () => {
    it('should choose 3h Combo + 1h Extension for 4 hour booking (cheaper than 4h hourly)', () => {
        // 4 hours weekday.
        // Hourly only: 4 * 70k = 280k.
        // 3h Combo (200k) + 1h (70k) = 270k.
        // Should choose Combo + 1h.
        const req: BookingRequest = {
            roomId: 'R1',
            startDateTime: '2023-10-09T08:00:00', // Mon
            endDateTime: '2023-10-09T12:00:00'
        };
        const res = calculatePrice(req, testRoom);
        expect(res.ok).toBe(true);
        expect(res.breakdown?.totalVnd).toBe(270000);

        // Assert structure: Combo first? Or whatever order.
        // DP fills `action` array. Reconstructs via backtracking.
        // If 0->3 is Combo, 3->4 is Hourly.
        // Components: [Combo, Hourly].
        expect(res.breakdown?.components).toHaveLength(2);
        const types = res.breakdown?.components.map(c => c.kind);
        expect(types).toContain('combo');
        expect(types).toContain('hourlyExtension');
    });

    it('should handle Full Day + Overstay (Late Checkout)', () => {
        // Full Day: 14:00 -> 12:00 (Next Day). 600k.
        // Booking: 14:00 -> 14:00 (Next Day). (+2h).
        // Extra 2h weekday = 140k.
        // Total 740k.
        const req: BookingRequest = {
            roomId: 'R1',
            startDateTime: '2023-10-09T14:00:00',
            endDateTime: '2023-10-10T14:00:00'
        };
        const res = calculatePrice(req, testRoom);
        expect(res.ok).toBe(true);
        expect(res.breakdown?.totalVnd).toBe(740000);

        const fullDayComp = res.breakdown?.components.find(c => c.comboType === 'fullDay');
        expect(fullDayComp).toBeDefined();
    });

    it('should handle Early Check-in + Full Day', () => {
        // Booking: 12:00 -> 12:00 (Next Day).
        // Full Day starts 14:00.
        // 12:00-14:00: 2h Early Check-in (Hourly).
        // 14:00-12:00: Full Day.
        // Total: 140k + 600k = 740k.
        const req: BookingRequest = {
            roomId: 'R1',
            startDateTime: '2023-10-09T12:00:00',
            endDateTime: '2023-10-10T12:00:00'
        };
       const res = calculatePrice(req, testRoom);
        expect(res.ok).toBe(true);
        expect(res.breakdown?.totalVnd).toBe(740000);

        // Inspect flow
        // Should have Hourly (2h) then Combo
        expect(res.breakdown?.components).toHaveLength(2);
        expect(res.breakdown?.components[0].kind).toBe('hourlyExtension'); // 12-14 (2h merged)
        expect(res.breakdown?.components[0].hours).toBe(2);

        expect(res.breakdown?.components[1].kind).toBe('combo'); // 14-End
    });

    it('should enforce 3h minimum charge for 2-hour booking (US4)', () => {
         // 2 hours - US4 rule enforces 3h combo minimum
         // Hourly would be: 140k (2 * 70k)
         // Combo 3h: 200k (minimum charge)
         // Should pay 200k (enforced minimum)
         const req: BookingRequest = {
            roomId: 'R1',
            startDateTime: '2023-10-09T08:00:00',
            endDateTime: '2023-10-09T10:00:00'
        };
        const res = calculatePrice(req, testRoom);
        expect(res.ok).toBe(true);
        expect(res.breakdown?.totalVnd).toBe(200000); // 3h combo minimum
        expect(res.breakdown?.components[0].comboType).toBe('threeHour');
    });
});
