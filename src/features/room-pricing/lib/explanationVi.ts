import type { PriceBreakdown } from './types';

export const generateExplanationVi = (breakdown: PriceBreakdown): string => {
  if (!breakdown.components.length) return '';

  const summaryParts: string[] = [];
  const byDay: Record<string, string[]> = {};

  breakdown.components.forEach(comp => {
      if (!byDay[comp.day]) byDay[comp.day] = [];

      const text = comp.descriptionVi;
      // potentially aggregate
      byDay[comp.day].push(`${text}: ${comp.amountVnd.toLocaleString()}đ`);
  });

  Object.keys(byDay).sort().forEach(day => {
      summaryParts.push(`${day}: ${byDay[day].join(', ')}`);
  });

  const total = breakdown.totalVnd.toLocaleString();
  return `Tổng cộng: ${total}đ. Chi tiết: ${summaryParts.join('; ')}.`;
};

export const mergeHourlyComponents = (breakdown: PriceBreakdown): PriceBreakdown => {
    return breakdown;
};
