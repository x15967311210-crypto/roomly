export interface Room {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
  floor: string;
}

export interface Booking {
  id: string;
  roomId: string;
  title: string;
  /** 预约人（本机档案名，非账号体系）。 */
  booker: string;
  attendees: number;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm */
  start: string;
  /** HH:mm */
  end: string;
  createdAt: string;
  cancelledAt?: string;
}

/** 表单原始输入，字段都是字符串（来自 select / input）。 */
export interface BookingInput {
  roomId: string;
  title: string;
  booker: string;
  attendees: string;
  date: string;
  start: string;
  end: string;
}

export interface RuleViolation {
  field: 'roomId' | 'title' | 'booker' | 'attendees' | 'date' | 'start' | 'end' | 'conflict';
  message: string;
}
