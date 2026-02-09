import React, { useEffect, useState } from 'react';
import { RoomPricingForm } from './RoomPricingForm';
import { parsePricingCsv } from '../lib/pricingCsvParser';
import { calculatePrice } from '../lib/calculatePrice';
import type { Room, CalculatorResult } from '../lib/types';
import { RoomPricingResult } from './RoomPricingResult'; // Ensure correct path

// Import raw CSV content (needs vite logic or fetch)
// Using standard fetch for simplicity in dev if file is in public.
// But file is in src/assets.
// Vite supports import csvUrl from '@/assets/pricing.csv?url' -> fetch(csvUrl)
// OR import raw from '@/assets/pricing.csv?raw'
import pricingCsvRaw from '@/assets/pricing.csv?raw';
// import { generateExplanationVi } from '../lib/explanationVi'; // Removed unused

export const RoomPricingCalculator: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<CalculatorResult | null>(null);

  useEffect(() => {
    // Load pricing data
    const loadData = async () => {
      try {
        const parsedRooms = await parsePricingCsv(pricingCsvRaw);
        setRooms(parsedRooms);
      } catch (error) {
        console.error('Failed to load pricing data', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleCalculate = (roomId: string, start: string, end: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const res = calculatePrice({
      roomId,
      startDateTime: start,
      endDateTime: end
    }, room);

    setResult(res);
  };

  if (loading) return <div className="text-center p-8">Đang tải dữ liệu...</div>;

  return (
    <div className="container mx-auto p-4 space-y-8">
       <div className="text-center space-y-2">
         <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
           Tính Tiền Phòng Kora
         </h1>
         <p className="text-gray-500">Chọn phòng và thời gian để xem chi tiết giá.</p>
       </div>

       <RoomPricingForm
         rooms={rooms}
         onSubmit={handleCalculate}
       />

       {result && (
         <div className="w-full max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {result.ok && result.breakdown ? (
              <RoomPricingResult breakdown={result.breakdown} />
            ) : (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
                <h3 className="font-bold">Lỗi Tính Toán</h3>
                <p>{result.errorMessageVi || 'Đã xảy ra lỗi không xác định.'}</p>
              </div>
            )}
         </div>
       )}
    </div>
  );
};
