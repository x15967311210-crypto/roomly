import { useState } from 'react';
import { roomById } from '../data';
import { bookingStatus, canCancel, todayKey, type BookingStatus } from '../rules';
import type { Booking } from '../types';

interface Props {
  bookings: readonly Booking[];
  onCancel: (bookingId: string) => void;
}

type Filter = 'upcoming' | 'all' | 'cancelled';

const STATUS_LABEL: Record<BookingStatus, string> = {
  upcoming: '即将开始',
  ongoing: '进行中',
  past: '已结束',
  cancelled: '已取消',
};

const STATUS_CLASS: Record<BookingStatus, string> = {
  upcoming: 'badge badge-upcoming',
  ongoing: 'badge badge-ongoing',
  past: 'badge badge-past',
  cancelled: 'badge badge-cancelled',
};

export default function MyBookings({ bookings, onCancel }: Props) {
  const [filter, setFilter] = useState<Filter>('upcoming');
  const today = todayKey();

  const rows = bookings
    .map(booking => ({ booking, status: bookingStatus(booking) }))
    .filter(row => {
      if (filter === 'all') return true;
      if (filter === 'cancelled') return row.status === 'cancelled';
      return row.status === 'upcoming' || row.status === 'ongoing';
    })
    .sort((a, b) =>
      a.booking.date === b.booking.date
        ? a.booking.start.localeCompare(b.booking.start)
        : a.booking.date.localeCompare(b.booking.date),
    );

  return (
    <section className="stack">
      <div className="toolbar">
        <div className="seg" role="tablist" aria-label="预约筛选">
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'upcoming'}
            className={filter === 'upcoming' ? 'seg-item active' : 'seg-item'}
            onClick={() => setFilter('upcoming')}
          >
            即将开始
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'all'}
            className={filter === 'all' ? 'seg-item active' : 'seg-item'}
            onClick={() => setFilter('all')}
          >
            全部
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'cancelled'}
            className={filter === 'cancelled' ? 'seg-item active' : 'seg-item'}
            onClick={() => setFilter('cancelled')}
          >
            已取消
          </button>
        </div>
        <span className="muted" data-testid="booking-count">
          共 {rows.length} 条
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="empty" data-testid="bookings-empty">
          这里还没有预约。切到「预订会议室」创建第一条。
        </p>
      ) : (
        <ul className="list" data-testid="bookings-list">
          {rows.map(({ booking, status }) => {
            const room = roomById(booking.roomId);
            const cancellable = canCancel(booking);
            return (
              <li key={booking.id} className="card item" data-testid={`booking-${booking.id}`}>
                <div className="item-main">
                  <div className="item-title">
                    <span className="mono">{booking.id}</span>
                    <strong>{booking.title}</strong>
                  </div>
                  <div className="item-meta muted">
                    {room?.name ?? booking.roomId} · {booking.date} {booking.start}–{booking.end} ·{' '}
                    {booking.attendees} 人 · {booking.booker}
                    {booking.date === today && status === 'upcoming' && ' · 今天'}
                  </div>
                </div>
                <div className="item-side">
                  <span className={STATUS_CLASS[status]}>{STATUS_LABEL[status]}</span>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={!cancellable}
                    title={cancellable ? '取消这条预约' : '已开始或已取消的预约不能取消'}
                    onClick={() => onCancel(booking.id)}
                  >
                    取消
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
