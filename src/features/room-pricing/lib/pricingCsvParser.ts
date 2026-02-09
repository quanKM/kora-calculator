import { parse } from 'csv-parse/browser/esm';
import type { Room, ComboPricing, ComboType, ComboWindow } from './types';

export const parsePricingCsv = async (csvContent: string): Promise<Room[]> => {
  return new Promise((resolve, reject) => {
    parse(csvContent, {
      columns: true, // Auto-discover headers
      skip_empty_lines: true,
      trim: true,
    }, (err, records: any[]) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        const rooms: Room[] = records.map((record: any) => {
            const pricing: ComboPricing[] = [];

            // Helper to add combo
            const addCombo = (
                type: ComboType,
                label: string,
                priceWeekday: string,
                priceWeekend: string,
                window: ComboWindow
            ) => {
                const wPrice = parseInt((priceWeekday || '0').replace(/,/g, ''), 10);
                const wePrice = parseInt((priceWeekend || '0').replace(/,/g, ''), 10);

                if (!isNaN(wPrice) && !isNaN(wePrice) && (wPrice > 0 || wePrice > 0)) {
                     pricing.push({
                        roomId: record['Mã phòng'],
                        type,
                        label,
                        weekdayPriceVnd: wPrice,
                        weekendPriceVnd: wePrice,
                        window
                    });
                }
            };

            // 1. Nghỉ theo giờ (3 hours)
            addCombo('threeHour', 'Nghỉ theo giờ (3 tiếng)',
              record['Nghỉ theo giờ (3 tiếng) (T2-T5)'],
              record['Nghỉ theo giờ (3 Tiếng) (T6 - CN)'],
              {
                kind: 'threeHour',
                startTimeLocal: '00:00', // Flexible
                endTimeLocal: '23:59',
                crossesMidnight: false,
                durationHours: 3
              }
            );

            // 2. Nghỉ đêm/bán ngày (Half Day)
            // Header: Nghỉ đêm (22h -9h/10h-19h) (T2-T5)
            // Header: Nghỉ đêm (22h -9h/10h-19h) (Trong tuần) (T6-CN)
            addCombo('halfDay', 'Nghỉ bán ngày (10h-19h)',
              record['Nghỉ đêm (22h -9h/10h-19h) (T2-T5)'],
              record['Nghỉ đêm (22h -9h/10h-19h) (Trong tuần) (T6-CN)'],
              {
                kind: 'halfDayDay',
                startTimeLocal: '10:00',
                endTimeLocal: '19:00',
                crossesMidnight: false,
                durationHours: 9
              }
            );

            // Add Half Day Night (same price column)
            addCombo('halfDay', 'Nghỉ qua đêm (22h-9h)',
              record['Nghỉ đêm (22h -9h/10h-19h) (T2-T5)'],
              record['Nghỉ đêm (22h -9h/10h-19h) (Trong tuần) (T6-CN)'],
              {
                kind: 'halfDayNight',
                startTimeLocal: '22:00',
                endTimeLocal: '09:00',
                crossesMidnight: true,
                durationHours: 11
              }
            );

            // 3. Nghỉ 1 ngày (Full Day)
            addCombo('fullDay', 'Nghỉ 1 ngày (14h-12h)',
              record['Nghỉ 1 ngày (14h -12h) (T2 - T5)'],
              record['Nghỉ 1 ngày (14h -12h) (T6 - CN)'],
              {
                kind: 'fullDay',
                startTimeLocal: '14:00',
                endTimeLocal: '12:00',
                crossesMidnight: true,
                durationHours: 22
              }
            );

            return {
                id: record['Mã phòng'],
                category: record['Hạng Phòng'],
                name: record['Tên Phòng'],
                pricing
            };
        });

        resolve(rooms);
      } catch (e) {
        reject(e);
      }
    });
  });
};
