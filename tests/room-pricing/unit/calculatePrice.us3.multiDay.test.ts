import { describe, it, expect } from 'vitest';
import { calculatePrice } from '../../../src/features/room-pricing/lib/calculatePrice';
import type { Room, BookingRequest, ComboPricing } from '../../../src/features/room-pricing/lib/types';
import { addDays } from 'date-fns';

// Mock Data
const fullDayCombo: ComboPricing = {
  roomId: 'R1',
  type: 'fullDay',
  label: 'Combo Ngày',
  weekdayPriceVnd: 600000,
  weekendPriceVnd: 700000,
  window: { kind: 'fullDay', startTimeLocal: '14:00', endTimeLocal: '12:00', crossesMidnight: true, durationHours: 22 }
};

const overnightCombo: ComboPricing = {
  roomId: 'R1',
  type: 'overnight',
  label: 'Combo Qua Đêm',
  weekdayPriceVnd: 300000,
  weekendPriceVnd: 350000,
  window: { kind: 'overnight', startTimeLocal: '22:00', endTimeLocal: '10:00', crossesMidnight: true, durationHours: 12 }
};

const testRoom: Room = {
  id: 'R1',
  category: 'A',
  name: 'Test Room',
  pricing: [fullDayCombo, overnightCombo]
};

describe('US3: Multi-day & Cross-Weekend Pricing', () => {
    it('should apply correct rates for a booking crossing from Weekday to Weekend', () => {
        // Thursday 20:00 to Friday 08:00 (12 hours)
        // Thursday (Weekday) -> Friday (Weekend)
        // Friday starts at 00:00.

        // Option A: Hourly
        // 20:00-24:00 (Thu): 4h * 70k = 280k
        // 00:00-08:00 (Fri): 8h * 80k = 640k
        // Total Hourly: 920k

        // Option B: Hourly + Overnight Combo
        // 20:00-22:00 (Thu): 2h * 70k = 140k
        // 22:00-08:00 (Thu night -> Fri morning): Overnight Combo.
        // Combo starts at 22:00 Thu. Is Thu weekend? No.
        // Price: 300k.
        // Total: 440k.

        // Algorithm should pick Option B.

        const req: BookingRequest = {
            roomId: 'R1',
            startDateTime: '2023-10-05T20:00:00', // Thu
            endDateTime: '2023-10-06T08:00:00'  // Fri
        };

        const res = calculatePrice(req, testRoom);
        expect(res.ok).toBe(true);
        expect(res.breakdown?.totalVnd).toBe(440000);

        // Verify breakdown components
        // 1. Hourly 2h (Thu)
        // 2. Overnight Combo (starts Thu)

        // Note: Our result list is ordered by time.
        const comps = res.breakdown?.components || [];
        expect(comps).toHaveLength(2);

        expect(comps[0].kind).toBe('hourlyExtension');
        expect(comps[0].amountVnd).toBe(140000); // 2 * 70k
        expect(comps[0].isWeekend).toBe(false); // Thu

        expect(comps[1].kind).toBe('combo');
        expect(comps[1].comboType).toBe('overnight');
        expect(comps[1].amountVnd).toBe(300000); // Weekday price
        expect(comps[1].isWeekend).toBe(false); // Started on Thu
    });

    it('should split multi-day stay into multiple Full Day combos', () => {
        // Friday 14:00 to Sunday 12:00 (Almost 48 hours)
        // Total: 700 + 0 + 700 = 1,400,000.

        const req: BookingRequest = {
            roomId: 'R1',
            startDateTime: '2023-10-06T14:00:00', // Fri
            endDateTime: '2023-10-08T12:00:00'  // Sun
        };

        const res = calculatePrice(req, testRoom);
        expect(res.ok).toBe(true);
        expect(res.breakdown?.totalVnd).toBe(1400000);

        // Verify structure
        // Combo (Fri) -> Hourly (Sat) -> Combo (Sat)
        // Note: Hourly might be merged or separate depending on implementation iteration,
        // but Logic 'action' list produces separate items.
        // explanationVi merges them, but here we check raw components.

        const comps = res.breakdown?.components || [];
        // Might be 3 items: Combo, Hourly, Combo.
        // Or Hourly might be 2 items (12-13, 13-14).

        // Check presence
        const combos = comps.filter(c => c.kind === 'combo');
        expect(combos).toHaveLength(2);
        expect(combos[0].amountVnd).toBe(700000);
        expect(combos[1].amountVnd).toBe(700000);
    });

    it('should handle transition from Weekday to Weekend for Hourly only', () => {
        // Thursday 23:00 to Friday 02:00 (3 hours).
        // No combos fit (Overnight starts 22:00, fits?
        // If I book 23:00-02:00.
        // Overnight window is 22:00 -> 10:00.
        // My booking 23:00 is INSIDE 22:00-10:00.
        // Logic: "Combined Options".
        // To use Overnight combo, I must match or be contained?
        // Current logic: `stepsToAdvance = min(hoursCovered, remainingSteps)`.
        // If I am at 23:00. `startOfDay` logic looks for window start.
        // Window 22:00.
        // 23:00 is after 22:00.
        // Does logic allow "Late start" of a fixed combo?
        // Code: `if ((isAfter(currentTime, idxStart) || ...) && isBefore(currentTime, idxEnd))` covers it.
        // So it MIGHT use Overnight combo (300k).
        // Hourly:
        // 23-00 (Thu): 70k.
        // 00-01 (Fri): 80k.
        // 01-02 (Fri): 80k.
        // Total: 230k.
        // 230k < 300k. Should choose Hourly.

        const req: BookingRequest = {
            roomId: 'R1',
            startDateTime: '2023-10-05T23:00:00', // Thu
            endDateTime: '2023-10-06T02:00:00'  // Fri
        };

        const res = calculatePrice(req, testRoom);
        expect(res.ok).toBe(true);
        expect(res.breakdown?.totalVnd).toBe(230000);

        const hourly = res.breakdown?.components.filter(c => c.kind === 'hourlyExtension');
        // Should have hours on Thu and Fri.
        // Thu: 23-00 (1h). Fri: 00-02 (2h).
        // Logic might output 3 entries or merged if executed in sequence.
        // Should have hours on Thu (Weekday) and Fri (Weekend).
        // Merged logic:
        // 1. Thu 23:00-00:00 (1h) - Weekday
        // 2. Fri 00:00-02:00 (2h) - Weekend (Fri is weekend?)
        // wait, isWeekend(Fri) returns true (5).
        // So 00-01 and 01-02 constitute 2 hours of Weekend pricing.
        // Total 2 components.
        expect(hourly).toHaveLength(2);
        expect(hourly![0].isWeekend).not.toBe(hourly![1].isWeekend);
    });

    it('should NOT charge for the 2-hour gap between consecutive Full Day combos (Gapless Logic)', () => {
        // Tuesday 14:00 to Thursday 12:00 (46 hours)
        // 1. Tue 14:00 - Wed 12:00: Full Day (Weekday). Price: 600k.
        // 2. Wed 12:00 - Wed 14:00: Gap (2h). SHOULD BE 0 VND.
        // 3. Wed 14:00 - Thu 12:00: Full Day (Weekday). Price: 600k.

        // Expected Total: 1,200,000 VND.
        // Old Logic Total: 600k + (2h * 70k) + 600k = 1,340,000 VND.

        const req: BookingRequest = {
            roomId: 'R1',
            startDateTime: '2023-10-10T14:00:00', // Tue
            endDateTime: '2023-10-12T12:00:00'  // Thu
        };

        const res = calculatePrice(req, testRoom);
        expect(res.ok).toBe(true);
        expect(res.breakdown?.totalVnd).toBe(1200000);

        const combos = res.breakdown?.components.filter(c => c.kind === 'combo');
        expect(combos).toHaveLength(2);

        const hourly = res.breakdown?.components.filter(c => c.kind === 'hourlyExtension');
        expect(hourly || []).toHaveLength(0);
    });
});
