export type ComboType = 'threeHour' | 'halfDay' | 'fullDay';

export type ComboWindowKind = 'threeHour' | 'halfDayDay' | 'halfDayNight' | 'fullDay';

export interface ComboWindow {
  kind: ComboWindowKind;
  startTimeLocal: string; // HH:mm
  endTimeLocal: string; // HH:mm
  crossesMidnight: boolean;
  durationHours: number;
}

export interface ComboPricing {
  roomId: string; // Foreign Key to Room
  type: ComboType;
  label: string;
  weekdayPriceVnd: number;
  weekendPriceVnd: number;
  window: ComboWindow;
}

export interface Room {
  id: string; // Mã phòng
  category: string; // Hạng phòng
  name: string; // Tên phòng
  pricing: ComboPricing[];
}

export type RequestSource = 'guest' | 'staff' | 'unknown';

export interface BookingRequest {
  roomId: string;
  startDateTime: string; // ISO string, local time
  endDateTime: string; // ISO string, local time
  source?: RequestSource;
}

export interface DailySegment {
  date: string; // YYYY-MM-DD
  startDateTime: string; // ISO string
  endDateTime: string; // ISO string
  isWeekend: boolean; // T6-CN
  applicableCombos: ComboPricing[]; // Optimization: pre-filtered combos
}

export type PriceComponentKind = 'combo' | 'hourlyExtension';

export interface PriceComponent {
  kind: PriceComponentKind;
  descriptionVi: string;
  day: string; // YYYY-MM-DD
  isWeekend: boolean;
  amountVnd: number;
  comboType: ComboType | null; // If kind === 'combo'
  hours: number | null; // If kind === 'hourlyExtension'
}

export interface PriceBreakdown {
  totalVnd: number;
  components: PriceComponent[];
  summaryVi: string;
  warnings?: string[];
}

export interface CalculatorResult {
  ok: boolean;
  breakdown: PriceBreakdown | null;
  errorMessageVi: string | null;
}
