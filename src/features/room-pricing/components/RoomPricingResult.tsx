import React from 'react';
import type { PriceBreakdown, PriceComponent } from '../lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RoomPricingResultProps {
  breakdown: PriceBreakdown;
}

export const RoomPricingResult: React.FC<RoomPricingResultProps> = ({ breakdown }) => {
  // Group components by day
  const byDay: Record<string, PriceComponent[]> = {};

  const mergedComponents: PriceComponent[] = [];
  let currentHourly: PriceComponent | null = null;

  breakdown.components.forEach(comp => {
       if (comp.kind === 'hourlyExtension') {
          if (currentHourly && currentHourly.day === comp.day && currentHourly.isWeekend === comp.isWeekend) {
              currentHourly.amountVnd += comp.amountVnd;
              currentHourly.hours = (currentHourly.hours || 0) + (comp.hours || 1);
              currentHourly.descriptionVi = `Phụ trội ${currentHourly.hours} giờ (${comp.isWeekend ? 'Cuối tuần' : 'Ngày thường'})`;
          } else {
              if (currentHourly) mergedComponents.push(currentHourly);
              currentHourly = { ...comp, hours: comp.hours || 1 };
          }
      } else {
          if (currentHourly) {
              mergedComponents.push(currentHourly);
              currentHourly = null;
          }
          mergedComponents.push(comp);
      }
  });
  if (currentHourly) mergedComponents.push(currentHourly);

  mergedComponents.forEach(comp => {
      if (!byDay[comp.day]) byDay[comp.day] = [];
      byDay[comp.day].push(comp);
  });

  const days = Object.keys(byDay).sort();

  return (
    <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 shadow-sm">
      <CardHeader className="pb-2 border-b border-green-200 dark:border-green-800 flex flex-row items-baseline justify-between space-y-0">
         <CardTitle className="text-lg font-medium text-green-900 dark:text-green-100">Tổng Cộng</CardTitle>
         <span className="text-2xl font-bold text-green-700 dark:text-green-300">
           {breakdown.totalVnd.toLocaleString()}đ
         </span>
      </CardHeader>

      <CardContent className="pt-4 space-y-4 text-sm text-gray-700 dark:text-gray-300">
        {days.map(day => (
            <div key={day} className="space-y-2">
                <h4 className="font-semibold text-green-800 dark:text-green-200 border-b border-green-100 dark:border-green-900 pb-1">
                    Ngày {day}
                </h4>
                <ul className="space-y-2 pl-1">
                    {byDay[day].map((comp, idx) => (
                        <li key={idx} className="flex justify-between items-start">
                            <span className="flex items-center gap-2">
                                {comp.kind === 'combo' && (
                                    <Badge variant="secondary" className="bg-green-200 text-green-800 hover:bg-green-300 border-green-300">Combo</Badge>
                                )}
                                {comp.kind === 'hourlyExtension' && (
                                    <Badge variant="outline" className="text-green-800 border-green-300">Giờ</Badge>
                                )}
                                <span>{comp.descriptionVi}</span>
                            </span>
                            <span className="font-medium whitespace-nowrap">
                                {comp.amountVnd.toLocaleString()}đ
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        ))}
      </CardContent>
    </Card>
  );
};
