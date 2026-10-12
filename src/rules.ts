import type { Booking, BookingInput, RuleViolation } from './types';
import { roomById } from './data';

/** 办公时段（含端点）：09:00–18:00。 */
export const OPENING_MIN = 9 * 60;
export const CLOSING_MIN = 18 * 60;
/** 单次预约最长时长。 */
export const MAX_DURATION_MIN = 240;
/** 最多可提前预约的天数。 */
export const MAX_ADVANCE_DAYS = 30;
/** 时间下拉的步长。 */
export const STEP_MIN = 30;

/** `HH:mm` → 从零点起的分钟数；格式不合法返回 null。 */
export function parseTimeToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** 分钟数 → `HH:mm`。 */
export function formatMinutes(min: number): string {
  const hours = Math.floor(min / 60);
  const minutes = min % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** 时长的可读写法：90 → `1 小时 30 分钟`。 */
export function formatDurationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} 分钟`;
  if (rest === 0) return `${hours} 小时`;
  return `${hours} 小时 ${rest} 分钟`;
}

/** 所选时段的时长（分钟）；时间非法或不为正时返回 null。 */
export function durationMinutes(start: string, end: string): number | null {
  const startMin = parseTimeToMinutes(start);
  const endMin = parseTimeToMinutes(end);
  if (startMin === null || endMin === null) return null;
  const minutes = endMin - startMin;
  return minutes > 0 ? minutes : null;
}

/** 单次预约是否落在时长上限内。 */
export function isWithinMaxDuration(startMin: number, endMin: number): boolean {
  return endMin - startMin <= MAX_DURATION_MIN;
}

/** 时间下拉的全部取值：09:00, 09:30, … 18:00。 */
export function timeOptions(): string[] {
  const out: string[] = [];
  for (let min = OPENING_MIN; min <= CLOSING_MIN; min += STEP_MIN) out.push(formatMinutes(min));
  return out;
}

/** 本地时区下的 `YYYY-MM-DD`。 */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayKey(now: Date = new Date()): string {
  return toDateKey(now);
}

/** `YYYY-MM-DD` → 当地时间当天 00:00；格式不合法返回 null。 */
export function parseDateKey(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

/** 两个左闭右开的区间是否重叠（首尾相接不算冲突）。 */
export function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function isCancelled(booking: Booking): boolean {
  return booking.cancelledAt !== undefined;
}

/** 某会议室某天仍然生效（未取消）的预约，按开始时间排序。 */
export function activeBookingsFor(
  bookings: readonly Booking[],
  roomId: string,
  date: string,
): Booking[] {
  return bookings
    .filter(b => b.roomId === roomId && b.date === date && !isCancelled(b))
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
}

/** 与候选时段冲突的既有预约（同会议室、同一天）。 */
export function findRoomConflict(
  candidate: Pick<Booking, 'roomId' | 'date' | 'start' | 'end'>,
  bookings: readonly Booking[],
): Booking | undefined {
  const start = parseTimeToMinutes(candidate.start);
  const end = parseTimeToMinutes(candidate.end);
  if (start === null || end === null) return undefined;
  return activeBookingsFor(bookings, candidate.roomId, candidate.date).find(booking => {
    const otherStart = parseTimeToMinutes(booking.start);
    const otherEnd = parseTimeToMinutes(booking.end);
    if (otherStart === null || otherEnd === null) return false;
    return rangesOverlap(start, end, otherStart, otherEnd);
  });
}

/** 同一预约人在同一时段是否已有别的会议室预约。 */
export function findBookerConflict(
  candidate: Pick<Booking, 'booker' | 'date' | 'start' | 'end'>,
  bookings: readonly Booking[],
): Booking | undefined {
  const start = parseTimeToMinutes(candidate.start);
  const end = parseTimeToMinutes(candidate.end);
  if (start === null || end === null) return undefined;
  return bookings
    .filter(b => !isCancelled(b) && b.booker === candidate.booker && b.date === candidate.date)
    .find(booking => {
      const otherStart = parseTimeToMinutes(booking.start);
      const otherEnd = parseTimeToMinutes(booking.end);
      if (otherStart === null || otherEnd === null) return false;
      return rangesOverlap(start, end, otherStart, otherEnd);
    });
}

export interface ValidateOptions {
  bookings: readonly Booking[];
  now?: Date;
}

/**
 * 唯一的预约校验入口。返回全部违规项（不是抛第一个），
 * 这样表单可以一次性把所有问题标出来，测试也能精确断言每一条规则。
 */
export function validateBooking(
  input: BookingInput,
  { bookings, now = new Date() }: ValidateOptions,
): RuleViolation[] {
  const violations: RuleViolation[] = [];

  const room = roomById(input.roomId);
  if (room === undefined) {
    violations.push({ field: 'roomId', message: '请选择会议室' });
  }

  const title = input.title.trim();
  if (title.length === 0) {
    violations.push({ field: 'title', message: '请填写会议主题' });
  } else if (title.length > 40) {
    violations.push({ field: 'title', message: '会议主题不能超过 40 个字' });
  }

  const booker = input.booker.trim();
  if (booker.length === 0) {
    violations.push({ field: 'booker', message: '请填写预约人' });
  }

  const attendees = Number(input.attendees);
  if (!Number.isInteger(attendees) || attendees < 1) {
    violations.push({ field: 'attendees', message: '参会人数必须是大于 0 的整数' });
  } else if (room !== undefined && attendees > room.capacity) {
    violations.push({
      field: 'attendees',
      message: `参会人数超出 ${room.name} 的容量（最多 ${room.capacity} 人）`,
    });
  }

  const date = parseDateKey(input.date);
  const today = parseDateKey(todayKey(now));
  if (date === null) {
    violations.push({ field: 'date', message: '请选择有效的日期' });
  } else if (today !== null) {
    if (date.getTime() < today.getTime()) {
      violations.push({ field: 'date', message: '不能预约已过去的日期' });
    } else {
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + MAX_ADVANCE_DAYS);
      if (date.getTime() > maxDate.getTime()) {
        violations.push({
          field: 'date',
          message: `最多只能提前 ${MAX_ADVANCE_DAYS} 天预约`,
        });
      }
    }
  }

  const start = parseTimeToMinutes(input.start);
  const end = parseTimeToMinutes(input.end);
  if (start === null) {
    violations.push({ field: 'start', message: '请选择开始时间' });
  }
  if (end === null) {
    violations.push({ field: 'end', message: '请选择结束时间' });
  }
  if (start !== null && end !== null) {
    if (end <= start) {
      violations.push({ field: 'end', message: '结束时间必须晚于开始时间' });
    } else {
      if (start < OPENING_MIN || end > CLOSING_MIN) {
        violations.push({
          field: 'start',
          message: `预约必须在办公时段 ${formatMinutes(OPENING_MIN)}–${formatMinutes(CLOSING_MIN)} 内`,
        });
      }
      if (!isWithinMaxDuration(start, end)) {
        violations.push({
          field: 'end',
          message: `单次预约不能超过 ${MAX_DURATION_MIN / 60} 小时`,
        });
      }
    }
  }

  // 只有日期和时段本身合法时才查冲突，避免同一个问题报出两条噪音。
  const timeLooksUsable = start !== null && end !== null && end > start;
  if (violations.length === 0 && timeLooksUsable && room !== undefined) {
    const roomConflict = findRoomConflict(input, bookings);
    if (roomConflict !== undefined) {
      violations.push({
        field: 'conflict',
        message: `${room.name} 在该时段已被「${roomConflict.title}」占用（${roomConflict.start}–${roomConflict.end}）`,
      });
    } else {
      const bookerConflict = findBookerConflict(input, bookings);
      if (bookerConflict !== undefined) {
        violations.push({
          field: 'conflict',
          message: `你在这个时段已有预约「${bookerConflict.title}」，不能重复预约`,
        });
      }
    }
  }

  return violations;
}

/** 已开始的预约不允许取消。 */
export function canCancel(booking: Booking, now: Date = new Date()): boolean {
  if (isCancelled(booking)) return false;
  const start = parseTimeToMinutes(booking.start);
  if (start === null) return false;
  const today = todayKey(now);
  if (booking.date > today) return true;
  if (booking.date < today) return false;
  return start > now.getHours() * 60 + now.getMinutes();
}

/** 表单默认时段：下一个整/半点，且保证 1 小时能落在办公时段内。 */
export interface DefaultSlot {
  date: string;
  start: string;
  end: string;
}

export function nextDefaultSlot(now: Date = new Date()): DefaultSlot {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  let startMin = Math.ceil((nowMin + 1) / STEP_MIN) * STEP_MIN;
  const date = new Date(now);
  if (startMin < OPENING_MIN) startMin = OPENING_MIN;
  // 当天已放不下 1 小时 → 顺延到明天上午 10:00。
  if (startMin + 60 > CLOSING_MIN) {
    date.setDate(date.getDate() + 1);
    startMin = 10 * 60;
  }
  return {
    date: toDateKey(date),
    start: formatMinutes(startMin),
    end: formatMinutes(startMin + 60),
  };
}

export type BookingStatus = 'upcoming' | 'ongoing' | 'past' | 'cancelled';

/** 预约当前所处的状态（已取消 > 已结束 > 进行中 > 即将开始）。 */
export function bookingStatus(booking: Booking, now: Date = new Date()): BookingStatus {
  if (isCancelled(booking)) return 'cancelled';
  const today = todayKey(now);
  if (booking.date < today) return 'past';
  if (booking.date > today) return 'upcoming';
  const start = parseTimeToMinutes(booking.start);
  const end = parseTimeToMinutes(booking.end);
  if (start === null || end === null) return 'upcoming';
  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (end <= nowMin) return 'past';
  if (start <= nowMin) return 'ongoing';
  return 'upcoming';
}

/** 生成一个稳定可读的预约号：R-<当天序号>-<时间>。 */
export function makeBookingId(existing: readonly Booking[], now: Date = new Date()): string {
  const stamp = String(now.getTime()).slice(-6);
  let index = existing.length + 1;
  // 保证不与既有 id 撞车（同毫秒连续提交时）。
  while (existing.some(b => b.id === `R-${index}-${stamp}`)) index += 1;
  return `R-${index}-${stamp}`;
}
