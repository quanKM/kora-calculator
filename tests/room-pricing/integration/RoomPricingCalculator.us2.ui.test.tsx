import React, { useEffect } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RoomPricingCalculator } from '../../../src/features/room-pricing/components/RoomPricingCalculator';
import * as parser from '../../../src/features/room-pricing/lib/pricingCsvParser';
import { ComboPricing, Room } from '../../../src/features/room-pricing/lib/types';
import { RoomPricingForm } from '../../../src/features/room-pricing/components/RoomPricingForm';

// Mock dependencies
vi.mock('../../../src/features/room-pricing/lib/pricingCsvParser');
vi.mock('../../../src/features/room-pricing/components/RoomPricingForm', () => ({
    RoomPricingForm: ({ onSubmit, rooms }: any) => (
        <div>
            <div data-testid="room-count">{rooms.length}</div>
            <button
                data-testid="trigger-calc"
                onClick={() => onSubmit('1', '2023-10-09T08:00', '2023-10-09T12:00')}
            >
                Calc
            </button>
        </div>
    )
}));

const mockPricing: ComboPricing[] = [
    {
        roomId: '1',
        type: 'threeHour',
        label: 'Combo 3h',
        weekdayPriceVnd: 200000,
        weekendPriceVnd: 220000,
        window: { kind: 'threeHour', startTimeLocal: '00:00', endTimeLocal: '23:59', crossesMidnight: false, durationHours: 3 }
    }
];

describe('US2 UI: Hourly Extensions', () => {
  it('displays validation of combo + hourly when duration exceeds combo', async () => {
    vi.spyOn(parser, 'parsePricingCsv').mockResolvedValue([
        { id: '1', name: 'Room 1', category: 'A', pricing: mockPricing }
    ]);

    render(<RoomPricingCalculator />);
    await waitFor(() => screen.findByText('Tính Tiền Phòng Kora'));

    // Trigger calculation (3h combo + 1h hourly) via mocked form
    const btn = screen.getByTestId('trigger-calc');
    await act(async () => {
        btn.click();
    });

    // Expect result to appear
    // 3h (200k) + 1h (70k) = 270k.
    expect(await screen.findByText('270,000đ')).toBeInTheDocument();

    // Expect explanation text
    // "Tổng cộng: 270,000đ. Chi tiết: 2023-10-09: Combo 3h: 200,000đ, Phụ trội 1 giờ (Ngày thường): 70,000đ."
    expect(screen.getByText(/Combo 3h/)).toBeInTheDocument();
    expect(screen.getByText(/Phụ trội 1 giờ/)).toBeInTheDocument();
  });
});
