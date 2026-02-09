import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RoomPricingCalculator } from '../../../src/features/room-pricing/components/RoomPricingCalculator';
import * as parser from '../../../src/features/room-pricing/lib/pricingCsvParser';
import { ComboPricing } from '../../../src/features/room-pricing/lib/types';
import { RoomPricingForm } from '../../../src/features/room-pricing/components/RoomPricingForm';

// Mock dependencies
vi.mock('../../../src/features/room-pricing/lib/pricingCsvParser');
vi.mock('../../../src/features/room-pricing/components/RoomPricingForm', () => ({
    RoomPricingForm: ({ onSubmit, rooms }: any) => (
        <div>
            <div data-testid="room-count">{rooms.length}</div>
            <button
                data-testid="trigger-calc"
                onClick={() => onSubmit('1', '2023-10-06T14:00', '2023-10-08T12:00')}
            >
                Calc MultiDay
            </button>
        </div>
    )
}));

const mockPricing: ComboPricing[] = [
    {
        roomId: '1',
        type: 'fullDay',
        label: 'Combo Ngày',
        weekdayPriceVnd: 600000,
        weekendPriceVnd: 700000,
        window: { kind: 'fullDay', startTimeLocal: '14:00', endTimeLocal: '12:00', crossesMidnight: true, durationHours: 22 }
    }
];

describe('US3 UI: Multi-Day', () => {
  it('displays per-day breakdown for a 3-day booking', async () => {
    vi.spyOn(parser, 'parsePricingCsv').mockResolvedValue([
        { id: '1', name: 'Room 1', category: 'A', pricing: mockPricing }
    ]);

    render(<RoomPricingCalculator />);
    await waitFor(() => screen.findByText('Tính Tiền Phòng Kora'));

    // Trigger calculation: Fri 14:00 -> Sun 12:00
    // Fri-Sat (Weekend 700k).
    // Sat 12-14 (Gap, Weekend Hourly 160k).
    // Sat-Sun (Weekend 700k).
    // Total 1,560,000.

    const btn = screen.getByTestId('trigger-calc');
    await act(async () => {
        btn.click();
    });

    // Check Total
    expect(await screen.findByText('1,560,000đ')).toBeInTheDocument();

    // Check Days presence
    // Logic uses `format(..., 'yyyy-MM-dd')` for keys.
    expect(screen.getByText('Ngày 2023-10-06')).toBeInTheDocument();
    expect(screen.getByText('Ngày 2023-10-07')).toBeInTheDocument();
    // Maybe Oct 08 if segments fall there?
    // Fri 14:00 + 22h = Sat 12:00. (Day 2023-10-06?)
    // Note: `calculatePrice` assigns day based on `segmentStartTime`.
    // Segment 1 (Fri 14:00) -> Day 2023-10-06.
    // Segment 2 (Sat 12:00) -> Hourly Gap -> Day 2023-10-07.
    // Segment 3 (Sat 14:00) -> Combo -> Day 2023-10-07.
    // So distinct days displayed are 06 and 07.

    const combos = screen.getAllByText('Combo Ngày');
    expect(combos.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Phụ trội/)).toBeInTheDocument();
  });
});
