import {
  addHours,
  differenceInMinutes,
  differenceInHours,
  parseISO,
  isBefore,
  isAfter,
  getDay,
  format,
  addDays,
  startOfDay,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds
} from 'date-fns';
import type {
  BookingRequest,
  CalculatorResult,
  Room,
  PriceComponent,
  ComboPricing
} from './types';

// Constants
const HOURLY_RATE_WEEKDAY = 70000;
const HOURLY_RATE_WEEKEND = 80000;

// Helper to check if a date is weekend (Fri, Sat, Sun)
const isWeekend = (date: Date): boolean => {
  const day = getDay(date);
  return day === 0 || day === 5 || day === 6;
};

export const calculatePrice = (
  request: BookingRequest,
  room: Room
): CalculatorResult => {
  const start = parseISO(request.startDateTime);
  const end = parseISO(request.endDateTime);

  // Bagic Validation
  if (!isBefore(start, end)) {
    return { ok: false, breakdown: null, errorMessageVi: 'Thời gian trả phòng phải sau thời gian nhận phòng.' };
  }

  // Total duration in hours (rounding up any partial hour)
  // E.g. 1h 1min -> 2 hours.
  const diffInMinutes = differenceInMinutes(end, start);
  const totalHours = Math.ceil(diffInMinutes / 60);

  if (totalHours <= 0) {
     return { ok: false, breakdown: null, errorMessageVi: 'Thời lượng đặt phòng không hợp lệ (nhỏ hơn 1 giờ).' };
  }

  // ---------------------------------------------------------
  // DP / Dijkstra Approach
  // Nodes: 0 to totalHours. Node i represents time = start + i hours.
  // We want min cost to reach Node totalHours.
  // ---------------------------------------------------------

  const totalSteps = totalHours;
  const cost = new Array(totalSteps + 1).fill(Infinity);
  const parent = new Array<number>(totalSteps + 1).fill(-1);
  const action = new Array<{
      kind: 'combo' | 'hourly';
      combo?: ComboPricing;
      cost: number;
      desc: string;
      hours: number;
  } | null>(totalSteps + 1).fill(null);

  cost[0] = 0;

  for (let i = 0; i < totalSteps; i++) {
    if (cost[i] === Infinity) continue;

    const currentTime = addHours(start, i);
    const currentIsWeekend = isWeekend(currentTime);

    // 1. Hourly Option (+1h)
    const hourlyRate = currentIsWeekend ? HOURLY_RATE_WEEKEND : HOURLY_RATE_WEEKDAY;
    const nextI_hourly = i + 1;

    // Cost accumulation
    if (cost[i] + hourlyRate < cost[nextI_hourly]) {
      cost[nextI_hourly] = cost[i] + hourlyRate;
      parent[nextI_hourly] = i;
      action[nextI_hourly] = {
        kind: 'hourly',
        cost: hourlyRate,
        desc: `Phụ trội 1 giờ (${currentIsWeekend ? 'Cuối tuần' : 'Ngày thường'})`,
        hours: 1
      };
    }

    // 1.5 Bridge Option (12:00 -> 14:00) @ 0 VND
    // This bridges the 2-hour gap between consecutive Full Day combos.
    // We ONLY allow this if the current node was reached via a Full Day combo
    // AND there is enough time remaining for at least another Full Day combo (2h gap + 22h combo).
    if (currentTime.getHours() === 12 && currentTime.getMinutes() === 0) {
      const actAtI = action[i];
      const remainingSteps = totalSteps - i;
      if (actAtI && actAtI.kind === 'combo' && actAtI.combo?.type === 'fullDay' && remainingSteps >= 24) {
        const nextI_bridge = i + 2;
        if (nextI_bridge <= totalSteps) {
          if (cost[i] < cost[nextI_bridge]) {
            cost[nextI_bridge] = cost[i];
            parent[nextI_bridge] = i;
            action[nextI_bridge] = {
              kind: 'hourly',
              cost: 0,
              desc: 'Chuyển tiếp combo (Miễn phí)',
              hours: 2
            };
          }
        }
      }
    }

    // 2. Combo Options
    const comboIsWeekend = currentIsWeekend;

    for (const combo of room.pricing) {
        let coverageEnd: Date | null = null;
        const pricingVnd = comboIsWeekend ? combo.weekendPriceVnd : combo.weekdayPriceVnd;

        // Skip if price is invalid
        if (!pricingVnd || pricingVnd <= 0) continue;

        if (combo.window.kind === 'threeHour') {
            // Floating 3h
            coverageEnd = addHours(currentTime, 3);
        } else {
            // Fixed Window logic
            const cDayStart = startOfDay(currentTime);
            const [wStartH, wStartM] = combo.window.startTimeLocal.split(':').map(Number);
            const [wEndH, wEndM] = combo.window.endTimeLocal.split(':').map(Number);

            const idxStart = setMilliseconds(setSeconds(setMinutes(setHours(cDayStart, wStartH), wStartM), 0), 0);

            let idxEnd = setMilliseconds(setSeconds(setMinutes(setHours(cDayStart, wEndH), wEndM), 0), 0);
            if (combo.window.crossesMidnight) idxEnd = addDays(idxEnd, 1);

            const prevStart = addDays(idxStart, -1);
            const prevEnd = addDays(idxEnd, -1);

            if (isAfter(currentTime, prevStart) && isBefore(currentTime, prevEnd)) {
                coverageEnd = prevEnd;
            }
            else if ((isAfter(currentTime, idxStart) || currentTime.getTime() === idxStart.getTime()) && isBefore(currentTime, idxEnd)) {
                coverageEnd = idxEnd;
            }
        }

        if (!coverageEnd) continue;

        const hoursCovered = differenceInHours(coverageEnd, currentTime);
        let stepsToAdvance = hoursCovered;

        const remainingSteps = totalSteps - i;
        if (stepsToAdvance > remainingSteps) {
            stepsToAdvance = remainingSteps;
        }

        if (stepsToAdvance <= 0) continue;

        const nextI_combo = i + stepsToAdvance;

        // DP update
        if (cost[i] + pricingVnd < cost[nextI_combo]) {
             cost[nextI_combo] = cost[i] + pricingVnd;
             parent[nextI_combo] = i;
             action[nextI_combo] = {
                 kind: 'combo',
                 combo,
                 cost: pricingVnd,
                 desc: combo.label,
                 hours: stepsToAdvance
             };
        }
    }
  }

  if (cost[totalSteps] === Infinity) {
      return { ok: false, breakdown: null, errorMessageVi: 'Không tìm được giá phù hợp.' };
  }

  // Backtrack to build solution
  const components: PriceComponent[] = [];
  let curr = totalSteps;

  while (curr > 0) {
      const prev = parent[curr];
      const act = action[curr];
      if (!act) break;

      const segmentStartTime = addHours(start, prev);
      const dayStr = format(segmentStartTime, 'yyyy-MM-dd');
      const isWk = isWeekend(segmentStartTime);

      const newComp: PriceComponent = {
          kind: act.kind === 'hourly' ? 'hourlyExtension' : 'combo',
          descriptionVi: act.desc,
          day: dayStr,
          isWeekend: isWk,
          amountVnd: act.cost,
          comboType: act.combo ? act.combo.type : null,
          hours: act.kind === 'hourly' ? act.hours : null
      };

      // US2: Gapless Logic - do not add 0-cost bridge components to display
      if (newComp.amountVnd === 0 && newComp.kind === 'hourlyExtension') {
          curr = prev;
          continue;
      }

      // Check if we can merge with the next component (which is components[0] since we are unshifting)
      // We merge if both are hourly, same day, same weekend status.
      if (newComp.kind === 'hourlyExtension' && components.length > 0) {
          const nextComp = components[0];
          if (nextComp.kind === 'hourlyExtension' &&
              nextComp.day === newComp.day &&
              nextComp.isWeekend === newComp.isWeekend) {

              // Merge into nextComp (which effectively extends it backwards)
              nextComp.amountVnd += newComp.amountVnd;
              nextComp.hours = (nextComp.hours || 0) + (newComp.hours || 0);
              nextComp.descriptionVi = `Phụ trội ${nextComp.hours} giờ (${nextComp.isWeekend ? 'Cuối tuần' : 'Ngày thường'})`;

              // Do NOT unshift newComp
          } else {
              components.unshift(newComp);
          }
      } else {
          components.unshift(newComp);
      }

      curr = prev;
  }

  let totalVnd = cost[totalSteps];

  // US4: Minimum 3-hour charge for short bookings (< 3 hours)
  // If the booking is less than 3 hours (1 or 2 hours after rounding),
  // and a 3-hour combo is available, we enforce the 3-hour combo price.
  if (totalHours < 3) {
      const threeHourCombo = room.pricing.find(p => p.window.kind === 'threeHour');
      if (threeHourCombo) {
          const isWk = isWeekend(start);
          const minPrice = isWk ? threeHourCombo.weekendPriceVnd : threeHourCombo.weekdayPriceVnd;

          // Only override if the calculated price is less than the minimum charge
          if (totalVnd < minPrice) {
              totalVnd = minPrice;
              // Replace components with the single combo
              // Note: We clear the previous components as they are superseded
              components.length = 0;
              components.push({
                  kind: 'combo',
                  comboType: threeHourCombo.type,
                  descriptionVi: threeHourCombo.label,
                  day: format(start, 'yyyy-MM-dd'),
                  isWeekend: isWk,
                  amountVnd: minPrice,
                  hours: 3
              });
          }
      }
  }

  return {
    ok: true,
    breakdown: {
        totalVnd,
        components,
        summaryVi: 'Đã tính toán thành công',
        warnings: []
    },
    errorMessageVi: null
  };
};
