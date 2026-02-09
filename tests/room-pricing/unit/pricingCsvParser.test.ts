import { describe, it, expect } from 'vitest';
import { parsePricingCsv } from '../../../src/features/room-pricing/lib/pricingCsvParser';

const mockCsv = `Mã phòng,Hạng Phòng,Tên Phòng,Nghỉ theo giờ (3 tiếng) (T2-T5),Nghỉ theo giờ (3 Tiếng) (T6 - CN),Nghỉ đêm (22h -9h/10h-19h) (T2-T5),Nghỉ đêm (22h -9h/10h-19h) (Trong tuần) (T6-CN),Nghỉ 1 ngày (14h -12h) (T2 - T5),Nghỉ 1 ngày (14h -12h) (T6 - CN)
P201,B,Ocean Blue,"279,000","309,000","479,000","529,000","599,000","699,000"`;

describe('parsePricingCsv', () => {
  it('should parse valid CSV content correctly', async () => {
    const rooms = await parsePricingCsv(mockCsv);
    expect(rooms).toHaveLength(1);
    const room = rooms[0];
    expect(room.id).toBe('P201');
    expect(room.name).toBe('Ocean Blue');
    expect(room.category).toBe('B');

    // Check pricing combos
    // 1. 3h
    const threeHour = room.pricing.find(p => p.type === 'threeHour');
    expect(threeHour).toBeDefined();
    expect(threeHour?.weekdayPriceVnd).toBe(279000);
    expect(threeHour?.weekendPriceVnd).toBe(309000);

    // 2. Half Day
    const halfDay = room.pricing.find(p => p.type === 'halfDay' && p.window.kind === 'halfDayDay');
    expect(halfDay).toBeDefined();
    expect(halfDay?.weekdayPriceVnd).toBe(479000);
    expect(halfDay?.weekendPriceVnd).toBe(529000);

    // 3. Full Day
    const fullDay = room.pricing.find(p => p.type === 'fullDay');
    expect(fullDay).toBeDefined();
    expect(fullDay?.weekdayPriceVnd).toBe(599000);
    expect(fullDay?.weekendPriceVnd).toBe(699000);
  });
});
