import { describe, it, expect } from 'vitest';
import { calculatePrice } from '../../../src/features/room-pricing/lib/calculatePrice';
import type { Room, BookingRequest, ComboPricing } from '../../../src/features/room-pricing/lib/types';
import { addHours, parseISO } from 'date-fns';

// Helper to create a room with specific pricing
const createRoom = (pricing: ComboPricing[]): Room => ({
  id: 'R1',
  category: 'A',
  name: 'Test Room',
  pricing
});

// Mock Pricing Data
const threeHourCombo: ComboPricing = {
  roomId: 'R1',
  type: 'threeHour',
  label: '3h Combo',
  weekdayPriceVnd: 200000, // < 3*70k=210k
  weekendPriceVnd: 220000, // < 3*80k=240k
  window: { kind: 'threeHour', startTimeLocal: '00:00', endTimeLocal: '23:59', crossesMidnight: false, durationHours: 3 }
};

const halfDayCombo: ComboPricing = {
  roomId: 'R1',
  type: 'halfDay',
  label: 'Half Day',
  weekdayPriceVnd: 400000,
  weekendPriceVnd: 500000,
  window: { kind: 'halfDayDay', startTimeLocal: '10:00', endTimeLocal: '19:00', crossesMidnight: false, durationHours: 9 }
};

const fullDayCombo: ComboPricing = {
  roomId: 'R1',
  type: 'fullDay',
  label: 'Full Day',
  weekdayPriceVnd: 600000,
  weekendPriceVnd: 700000,
  window: { kind: 'fullDay', startTimeLocal: '14:00', endTimeLocal: '12:00', crossesMidnight: true, durationHours: 22 }
};

const testRoom = createRoom([threeHourCombo, halfDayCombo, fullDayCombo]);

describe('US1: Exact Match Combos', () => {
    describe('3-Hour Combo', () => {
        it('should apply 3h combo price for exactly 3h booking on Weekday', () => {
            const req: BookingRequest = {
                roomId: 'R1',
                startDateTime: '2023-10-09T08:00:00', // Monday
                endDateTime: '2023-10-09T11:00:00'
            };
            const res = calculatePrice(req, testRoom);
            expect(res.ok).toBe(true);
            expect(res.breakdown?.totalVnd).toBe(200000); // 3h weekday
            expect(res.breakdown?.components).toHaveLength(1);
            expect(res.breakdown?.components[0].kind).toBe('combo');
            expect(res.breakdown?.components[0].comboType).toBe('threeHour');
        });

        it('should apply 3h combo price for exactly 3h booking on Weekend', () => {
            const req: BookingRequest = {
                roomId: 'R1',
                startDateTime: '2023-10-07T08:00:00', // Saturday
                endDateTime: '2023-10-07T11:00:00'
            };
            const res = calculatePrice(req, testRoom);
            expect(res.ok).toBe(true);
            expect(res.breakdown?.totalVnd).toBe(220000); // 3h weekend
        });
    });

    describe('Half Day Combo', () => {
        it('should apply Half Day price when booking matches window exactly (10-19)', () => {
             const req: BookingRequest = {
                roomId: 'R1',
                startDateTime: '2023-10-09T10:00:00',
                endDateTime: '2023-10-09T19:00:00'
            };
            const res = calculatePrice(req, testRoom);
            expect(res.ok).toBe(true);
            expect(res.breakdown?.totalVnd).toBe(400000);
            expect(res.breakdown?.components[0].comboType).toBe('halfDay');
        });

        it('should apply Half Day price when booking is within window (e.g. 10-18)', () => {
            // 8 hours. 8 * 70k = 560k. Half day 400k.
            // Should choose Half Day.
             const req: BookingRequest = {
                roomId: 'R1',
                startDateTime: '2023-10-09T10:00:00',
                endDateTime: '2023-10-09T18:00:00'
            };
            const res = calculatePrice(req, testRoom);
            expect(res.ok).toBe(true);
            expect(res.breakdown?.totalVnd).toBe(400000);
        });

        it('should NOT apply Half Day if booking starts before window (e.g. 09-18)', () => {
             // 9:00 - 18:00. Total 9 hours.
             // 09-10: Hourly (70k).
             // 10-18: Half Day (400k) usually covers 10-19. so 10-18 is covered.
             // Total: 470k.
             // Alternative: 9h * 70k = 630k.
             // Should be 470k.

             const req: BookingRequest = {
                roomId: 'R1',
                startDateTime: '2023-10-09T09:00:00',
                endDateTime: '2023-10-09T18:00:00'
            };
            const res = calculatePrice(req, testRoom);
            expect(res.ok).toBe(true);
            expect(res.breakdown?.totalVnd).toBe(470000);
        });
    });

    describe('Full Day Combo', () => {
        it('should apply Full Day price for exact 22h stay (14:00 - 12:00 next day)', () => {
             const req: BookingRequest = {
                roomId: 'R1',
                startDateTime: '2023-10-09T14:00:00',
                endDateTime: '2023-10-10T12:00:00'
            };
            const res = calculatePrice(req, testRoom);
            expect(res.ok).toBe(true);
            expect(res.breakdown?.totalVnd).toBe(600000);
            expect(res.breakdown?.components[0].comboType).toBe('fullDay');
        });

        it('should apply Full Day price if booking is late check-in (e.g. 16:00 - 12:00)', () => {
             // Duration 20h. 20 * 70k = 1.4m.
             // Full Day 600k.
             const req: BookingRequest = {
                roomId: 'R1',
                startDateTime: '2023-10-09T16:00:00',
                endDateTime: '2023-10-10T12:00:00' // Fixed typo date
            };
            const res = calculatePrice(req, testRoom);
            expect(res.ok).toBe(true);
            expect(res.breakdown?.totalVnd).toBe(600000);
        });
    });
});
