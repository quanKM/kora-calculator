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

const testRoom: Room = {
  id: 'R1',
  category: 'A',
  name: 'Test Room',
  pricing: [threeHourCombo]
};

describe('US4: Short Bookings (< 3 Hours)', () => {
    it('should charge 3-hour combo for 1 hour booking on Weekday', () => {
        // 1 hour. Hourly would be 70k.
        // 3h Combo is 200k.
        // Rule: Short bookings must use 3h combo if available (Minimum charge).
        const req: BookingRequest = {
            roomId: 'R1',
            startDateTime: '2023-10-09T10:00:00', // Mon
            endDateTime: '2023-10-09T11:00:00'
        };
        const res = calculatePrice(req, testRoom);
        expect(res.ok).toBe(true);
        expect(res.breakdown?.totalVnd).toBe(200000);
        expect(res.breakdown?.components).toHaveLength(1);
        expect(res.breakdown?.components[0].comboType).toBe('threeHour');
    });

    it('should charge 3-hour combo for 2 hour booking on Weekend', () => {
        // 2 hours. Hourly Weekend 80k*2 = 160k.
        // 3h Combo Weekend 220k.
        // Should charge 220k.
        const req: BookingRequest = {
            roomId: 'R1',
            startDateTime: '2023-10-07T10:00:00', // Sat
            endDateTime: '2023-10-07T12:00:00'
        };
        const res = calculatePrice(req, testRoom);
        expect(res.ok).toBe(true);
        expect(res.breakdown?.totalVnd).toBe(220000);
        expect(res.breakdown?.components[0].comboType).toBe('threeHour');
    });

    it('should fallback to hourly if 3h combo is NOT available (edge case)', () => {
        const hourlyRoom: Room = { ...testRoom, pricing: [] };
        const req: BookingRequest = {
            roomId: 'R1',
            startDateTime: '2023-10-09T10:00:00',
            endDateTime: '2023-10-09T11:00:00' // 1h
        };
        const res = calculatePrice(req, hourlyRoom);
        expect(res.ok).toBe(true);
        expect(res.breakdown?.totalVnd).toBe(70000); // 70k hourly
    });
});
