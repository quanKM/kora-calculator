import { describe, it, expect } from 'vitest';
import { calculatePrice } from '../../../src/features/room-pricing/lib/calculatePrice';
import { Room, BookingRequest } from '../../../src/features/room-pricing/lib/types';

// Mock Room
const mockRoom: Room = {
  id: 'P201',
  category: 'B',
  name: 'Ocean Blue',
  pricing: [
    {
      roomId: 'P201',
      type: 'threeHour',
      label: '3h Combo',
      weekdayPriceVnd: 300000,
      weekendPriceVnd: 350000,
      window: { kind: 'threeHour', startTimeLocal: '00:00', endTimeLocal: '23:59', crossesMidnight: false, durationHours: 3 }
    },
    {
      roomId: 'P201',
      type: 'fullDay',
      label: 'Full Day',
      weekdayPriceVnd: 600000,
      weekendPriceVnd: 700000,
      window: { kind: 'fullDay', startTimeLocal: '14:00', endTimeLocal: '12:00', crossesMidnight: true, durationHours: 22 }
    }
  ]
};

describe('calculatePrice', () => {
    it('should enforce 3h minimum charge for bookings under 3 hours (US4)', () => {
        // 1 hour on Monday - US4 rule enforces 3h combo minimum
        // Hourly would be 70k, but 3h combo minimum is 300k
        const req: BookingRequest = {
            roomId: 'P201',
            startDateTime: '2023-10-09T10:00:00', // Monday
            endDateTime: '2023-10-09T11:00:00'
        };
        const result = calculatePrice(req, mockRoom);
        expect(result.ok).toBe(true);
        expect(result.breakdown?.totalVnd).toBe(300000); // 3h combo minimum
        expect(result.breakdown?.components[0].comboType).toBe('threeHour');
    });

    it('should apply 3h combo if cheaper than 3x hourly', () => {
        // 3 hours on Monday. 3x70k = 210k. 3h Combo = 300k.
        // Wait, 3h combo is MORE expensive in this mock data (300k > 210k).
        // System should choose hourly.

        const req: BookingRequest = {
            roomId: 'P201',
            startDateTime: '2023-10-09T10:00:00',
            endDateTime: '2023-10-09T13:00:00'
        };
        const result = calculatePrice(req, mockRoom);
        expect(result.ok).toBe(true);
        expect(result.breakdown?.totalVnd).toBe(210000); // Should choose 3x70k
    });

    it('should apply 3h combo if cheaper', () => {
        // Modify mock room to have cheap 3h combo
        const cheapRoom = { ...mockRoom, pricing: [...mockRoom.pricing] };
        cheapRoom.pricing[0] = { ...cheapRoom.pricing[0], weekdayPriceVnd: 150000 }; // 150k < 210k

        const req: BookingRequest = {
            roomId: 'P201',
            startDateTime: '2023-10-09T10:00:00',
            endDateTime: '2023-10-09T13:00:00'
        };
        const result = calculatePrice(req, cheapRoom);
        expect(result.ok).toBe(true);
        expect(result.breakdown?.totalVnd).toBe(150000);
        expect(result.breakdown?.components[0].kind).toBe('combo');
    });
});
