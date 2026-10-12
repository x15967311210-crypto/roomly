import { useCallback, useEffect, useState } from 'react';
import type { Booking } from './types';

const BOOKINGS_KEY = 'roomly.bookings.v1';
const PROFILE_KEY = 'roomly.profile.v1';

export const DEMO_BOOKER = '林小满';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 隐私模式等场景下存储不可用：本次会话仍然可用，只是不持久化。 */
  }
}

function isBooking(value: unknown): value is Booking {
  if (value === null || typeof value !== 'object') return false;
  const b = value as Record<string, unknown>;
  return (
    typeof b.id === 'string' &&
    typeof b.roomId === 'string' &&
    typeof b.title === 'string' &&
    typeof b.booker === 'string' &&
    typeof b.attendees === 'number' &&
    typeof b.date === 'string' &&
    typeof b.start === 'string' &&
    typeof b.end === 'string' &&
    typeof b.createdAt === 'string'
  );
}

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const stored = readJson<unknown[]>(BOOKINGS_KEY, []);
    setBookings(stored.filter(isBooking));
  }, []);

  const persist = useCallback((next: Booking[]) => {
    setBookings(next);
    writeJson(BOOKINGS_KEY, next);
  }, []);

  const addBooking = useCallback(
    (booking: Booking) => {
      setBookings(current => {
        const next = [...current, booking];
        writeJson(BOOKINGS_KEY, next);
        return next;
      });
    },
    [],
  );

  const cancelBooking = useCallback((bookingId: string, now: Date = new Date()) => {
    setBookings(current => {
      const next = current.map(booking =>
        booking.id === bookingId && booking.cancelledAt === undefined
          ? { ...booking, cancelledAt: now.toISOString() }
          : booking,
      );
      writeJson(BOOKINGS_KEY, next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    persist([]);
  }, [persist]);

  return { bookings, addBooking, cancelBooking, clearAll };
}

export function useProfile() {
  const [booker, setBooker] = useState(DEMO_BOOKER);

  useEffect(() => {
    const stored = window.localStorage.getItem(PROFILE_KEY);
    if (stored !== null && stored.trim().length > 0) setBooker(stored);
  }, []);

  const updateBooker = useCallback((next: string) => {
    setBooker(next);
    writeJson(PROFILE_KEY, next);
  }, []);

  return { booker, updateBooker };
}
