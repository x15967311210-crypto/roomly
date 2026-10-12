import { useState, type FormEvent } from 'react';
import { ROOMS, roomById } from '../data';
import {
  MAX_ADVANCE_DAYS,
  makeBookingId,
  nextDefaultSlot,
  timeOptions,
  toDateKey,
  todayKey,
  validateBooking,
} from '../rules';
import type { Booking, BookingInput, RuleViolation } from '../types';

interface Props {
  booker: string;
  bookings: readonly Booking[];
  onCreate: (booking: Booking) => void;
}

const TIME_OPTIONS = timeOptions();

function defaultInput(booker: string): BookingInput {
  const slot = nextDefaultSlot();
  return {
    roomId: ROOMS[0]!.id,
    title: '',
    booker,
    attendees: '4',
    date: slot.date,
    start: slot.start,
    end: slot.end,
  };
}

function maxDateKey(): string {
  const max = new Date();
  max.setDate(max.getDate() + MAX_ADVANCE_DAYS);
  return toDateKey(max);
}

function fieldError(violations: RuleViolation[], field: RuleViolation['field']): string | undefined {
  return violations.find(v => v.field === field)?.message;
}

export default function BookingForm({ booker, bookings, onCreate }: Props) {
  const [input, setInput] = useState<BookingInput>(() => defaultInput(booker));
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const violations = validateBooking({ ...input, booker }, { bookings });
  const conflict = violations.find(v => v.field === 'conflict');
  const visible = submitted ? violations : conflict === undefined ? [] : [conflict];

  function update<K extends keyof BookingInput>(key: K, value: BookingInput[K]): void {
    setInput(current => ({ ...current, [key]: value }));
    setSuccess(null);
  }

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    setSubmitted(true);
    if (violations.length > 0) {
      setSuccess(null);
      return;
    }
    const booking: Booking = {
      id: makeBookingId(bookings),
      roomId: input.roomId,
      title: input.title.trim(),
      booker: booker.trim(),
      attendees: Number(input.attendees),
      date: input.date,
      start: input.start,
      end: input.end,
      createdAt: new Date().toISOString(),
    };
    onCreate(booking);
    setSuccess(`预约成功：${roomById(booking.roomId)?.name ?? ''} ${booking.date} ${booking.start}–${booking.end}`);
    setSubmitted(false);
    setInput(current => ({ ...current, title: '' }));
  }

  const room = roomById(input.roomId);

  return (
    <form className="card form" onSubmit={handleSubmit} data-testid="booking-form" noValidate>
      <div className="card-head">
        <h2>新建预约</h2>
        <p className="muted">填写下面几项即可预约，冲突会在提交前提示。</p>
      </div>

      <div className="grid grid-2">
        <label className="field">
          <span>会议室</span>
          <select value={input.roomId} onChange={e => update('roomId', e.target.value)}>
            {ROOMS.map(item => (
              <option key={item.id} value={item.id}>
                {item.name}（{item.floor} · {item.capacity} 人）
              </option>
            ))}
          </select>
          {room !== undefined && (
            <small className="muted">
              可用设备：{room.equipment.join('、')} · 最多 {room.capacity} 人
            </small>
          )}
        </label>

        <label className="field">
          <span>日期</span>
          <input
            type="date"
            value={input.date}
            min={todayKey()}
            max={maxDateKey()}
            onChange={e => update('date', e.target.value)}
          />
          {fieldError(visible, 'date') !== undefined && (
            <small className="error">{fieldError(visible, 'date')}</small>
          )}
        </label>

        <label className="field">
          <span>开始时间</span>
          <select value={input.start} onChange={e => update('start', e.target.value)}>
            {TIME_OPTIONS.map(time => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
          {fieldError(visible, 'start') !== undefined && (
            <small className="error">{fieldError(visible, 'start')}</small>
          )}
        </label>

        <label className="field">
          <span>结束时间</span>
          <select value={input.end} onChange={e => update('end', e.target.value)}>
            {TIME_OPTIONS.map(time => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
          {fieldError(visible, 'end') !== undefined && (
            <small className="error">{fieldError(visible, 'end')}</small>
          )}
        </label>

        <label className="field">
          <span>会议主题</span>
          <input
            type="text"
            value={input.title}
            maxLength={60}
            placeholder="例如：季度规划评审"
            onChange={e => update('title', e.target.value)}
          />
          {fieldError(visible, 'title') !== undefined && (
            <small className="error">{fieldError(visible, 'title')}</small>
          )}
        </label>

        <label className="field">
          <span>参会人数</span>
          <input
            type="number"
            value={input.attendees}
            min={1}
            step={1}
            onChange={e => update('attendees', e.target.value)}
          />
          {fieldError(visible, 'attendees') !== undefined && (
            <small className="error">{fieldError(visible, 'attendees')}</small>
          )}
        </label>
      </div>

      <div className="form-foot">
        <span className="muted">
          预约人：<strong>{booker}</strong>
        </span>
        <button type="submit" className="btn btn-primary" data-testid="submit-booking">
          提交预约
        </button>
      </div>

      {visible.length > 0 && (
        <ul className="alert alert-error" role="alert" data-testid="form-errors">
          {visible.map(v => (
            <li key={v.field}>{v.message}</li>
          ))}
        </ul>
      )}

      {success !== null && (
        <p className="alert alert-ok" role="status" data-testid="booking-success">
          {success}
        </p>
      )}
    </form>
  );
}
