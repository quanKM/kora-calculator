import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RoomPricingCalculator } from '../../../src/features/room-pricing/components/RoomPricingCalculator';
import * as parser from '../../../src/features/room-pricing/lib/pricingCsvParser';

// Mock the parser
vi.mock('../../../src/features/room-pricing/lib/pricingCsvParser');

describe('RoomPricingCalculator US1', () => {
  it('renders the calculator title and loads data', async () => {
    // Mock return value
    vi.spyOn(parser, 'parsePricingCsv').mockResolvedValue([
        { id: '1', name: 'Room 1', category: 'A', pricing: [] }
    ]);

    render(<RoomPricingCalculator />);

    // Initially validation of loading state?
    expect(screen.getByText(/Đang tải dữ liệu.../i)).toBeInTheDocument();

    // Wait for title (which appears after loading or is always there?
    // In my impl, Title is inside the main div, NOT conditional on loading?
    // Wait, in my impl: "if (loading) return ...".
    // So Title ONLY appears after loading.

    expect(await screen.findByText(/Tính Tiền Phòng Kora/i)).toBeInTheDocument();
    expect(screen.getByText(/Chọn phòng và thời gian/i)).toBeInTheDocument();
  });
});
