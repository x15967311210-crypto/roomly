import { useState } from 'react';
import { ROOMS } from '../data';
import { activeBookingsFor, todayKey } from '../rules';
import type { Booking } from '../types';

interface Props {
  bookings: readonly Booking[];
}

export default function RoomsView({ bookings }: Props) {
  const [date, setDate] = useState(todayKey());

  return (
    <section className="stack">
      <div className="toolbar">
        <label className="field inline">
          <span>查看日期</span>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </label>
        <span className="muted">每间会议室的当天占用情况</span>
      </div>

      <div className="grid grid-2">
        {ROOMS.map(room => {
          const occupied = activeBookingsFor(bookings, room.id, date);
          const busyMinutes = occupied.reduce((total, booking) => {
            const [sh, sm] = booking.start.split(':').map(Number);
            const [eh, em] = booking.end.split(':').map(Number);
            return total + ((eh ?? 0) * 60 + (em ?? 0) - ((sh ?? 0) * 60 + (sm ?? 0)));
          }, 0);
          return (
            <article key={room.id} className="card room" data-testid={`room-${room.id}`}>
              <header className="room-head">
                <div>
                  <h3>{room.name}</h3>
                  <p className="muted">
                    {room.floor} · 可容纳 {room.capacity} 人
                  </p>
                </div>
                <span className={occupied.length === 0 ? 'badge badge-free' : 'badge badge-busy'}>
                  {occupied.length === 0 ? '空闲' : `${occupied.length} 段占用`}
                </span>
              </header>
              <p className="chips">
                {room.equipment.map(item => (
                  <span key={item} className="chip">
                    {item}
                  </span>
                ))}
              </p>
              {occupied.length === 0 ? (
                <p className="muted">当天没有预约，全天可约。</p>
              ) : (
                <ul className="slots">
                  {occupied.map(booking => (
                    <li key={booking.id}>
                      <span className="mono">
                        {booking.start}–{booking.end}
                      </span>{' '}
                      <span>{booking.title}</span>{' '}
                      <span className="muted">（{booking.attendees} 人）</span>
                    </li>
                  ))}
                </ul>
              )}
              <footer className="muted small">
                已占用 {Math.round((busyMinutes / 60) * 10) / 10} 小时 / 办公时段 9 小时
              </footer>
            </article>
          );
        })}
      </div>
    </section>
  );
}
