import { useState } from 'react';
import BookingForm from './components/BookingForm';
import MyBookings from './components/MyBookings';
import RoomsView from './components/RoomsView';
import { ROOMS } from './data';
import { makeBookingId, todayKey } from './rules';
import { useBookings, useProfile } from './store';
import type { Booking } from './types';

type Tab = 'book' | 'mine' | 'rooms';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'book', label: '预订会议室' },
  { id: 'mine', label: '我的预约' },
  { id: 'rooms', label: '会议室' },
];

/**
 * 一键填充演示数据：今天两个不冲突的预约。
 * 每次运行都从"当前时刻"推导，所以不会因为日期过期而失效。
 */
function seedBookings(booker: string): Booking[] {
  const today = todayKey();
  const specs = [
    { roomId: ROOMS[0]!.id, title: '产品周会', start: '10:00', end: '11:00', attendees: 5 },
    { roomId: ROOMS[1]!.id, title: '客户演示', start: '14:00', end: '15:30', attendees: 8 },
  ];
  const seeded: Booking[] = [];
  for (const spec of specs) {
    seeded.push({
      id: makeBookingId(seeded),
      roomId: spec.roomId,
      title: spec.title,
      booker,
      attendees: spec.attendees,
      date: today,
      start: spec.start,
      end: spec.end,
      createdAt: new Date().toISOString(),
    });
  }
  return seeded;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('book');
  const { booker, updateBooker } = useProfile();
  const { bookings, addBooking, cancelBooking, clearAll } = useBookings();
  const [nameDraft, setNameDraft] = useState<string | null>(null);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden="true">
            R
          </span>
          <div>
            <h1>Roomly</h1>
            <p className="muted small">会议室预约 · 自动检测时间冲突</p>
          </div>
        </div>

        <div className="topbar-actions">
          <label className="field inline">
            <span>预约人</span>
            <input
              type="text"
              value={nameDraft ?? booker}
              data-testid="booker-name"
              onChange={e => setNameDraft(e.target.value)}
              onBlur={() => {
                if (nameDraft !== null && nameDraft.trim().length > 0) updateBooker(nameDraft.trim());
                setNameDraft(null);
              }}
            />
          </label>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              for (const booking of seedBookings(booker)) addBooking(booking);
            }}
          >
            载入示例
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            data-testid="reset-all"
            onClick={() => {
              if (window.confirm('清空本机保存的全部预约？此操作不可撤销。')) clearAll();
            }}
          >
            清空数据
          </button>
        </div>
      </header>

      <nav className="tabs" role="tablist" aria-label="主导航">
        {TABS.map(item => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? 'tab active' : 'tab'}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="content">
        {tab === 'book' && (
          <BookingForm
            booker={booker}
            bookings={bookings}
            onCreate={booking => {
              addBooking(booking);
              setTab('mine');
            }}
          />
        )}
        {tab === 'mine' && <MyBookings bookings={bookings} onCancel={cancelBooking} />}
        {tab === 'rooms' && <RoomsView bookings={bookings} />}
      </main>

      <footer className="footer muted small">
        数据保存在本机浏览器（localStorage），无需登录、不上传服务器。
      </footer>
    </div>
  );
}
