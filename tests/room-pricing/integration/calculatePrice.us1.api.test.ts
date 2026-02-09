import { describe, it, expect } from 'vitest';
import { calculatePrice } from '../../../src/features/room-pricing/lib/calculatePrice';
import type { BookingRequest, Room } from '../../../src/features/room-pricing/lib/types';

// Real-world scenario test
describe('US1 Integration: API Contract', () => {
    it('should return correct format matching CalculatorResult', () => {
        // Minimum valid request
         const req: BookingRequest = {
            roomId: 'P201',
            startDateTime: '2023-10-09T10:00:00',
            endDateTime: '2023-10-09T11:00:00'
        };
        const room: Room = { id: 'P201', name: 'R', category: 'A', pricing: [] }; // No pricing = strict hourly default? Or 0?
        // Note: Logic currently relies on room.pricing. If empty, loop logic handles it (hourly only).

        const res = calculatePrice(req, room);

        // Contract check
        expect(res).toHaveProperty('ok');
        expect(res).toHaveProperty('breakdown');
        expect(res).toHaveProperty('errorMessageVi');
    });
});
