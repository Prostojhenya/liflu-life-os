/**
 * Calendar Component
 * Horizontal scrollable calendar for date selection
 */

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CalendarDay {
  day: number;
  weekday: string;
  isToday: boolean;
  month: string;
  date: Date;
}

interface CalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function Calendar({ selectedDate, onSelectDate }: CalendarProps) {
  const calendarRef = useRef<HTMLDivElement>(null);
  const [visibleMonth, setVisibleMonth] = useState('');

  const today = new Date();

  // Generate 181 days (90 days before and after today)
  const weekDays: CalendarDay[] = Array.from({ length: 181 }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 90 + i);
    return {
      day: date.getDate(),
      weekday: date.toLocaleDateString('ru-RU', { weekday: 'short' }).slice(0, 2).toUpperCase(),
      isToday: i === 90,
      month: date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
      date,
    };
  });

  const currentMonthName = visibleMonth || today.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const isToday = selectedDate.toDateString() === today.toDateString();

  // Scroll to today on mount
  useEffect(() => {
    if (calendarRef.current) {
      const el = calendarRef.current.querySelector('[data-today="true"]');
      el?.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' });
    }
  }, []);

  // Scroll to selected date when it changes
  useEffect(() => {
    if (calendarRef.current) {
      const el = calendarRef.current.querySelector('[data-selected="true"]');
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedDate]);

  // Update visible month on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!calendarRef.current) return;
      const container = calendarRef.current;
      const cx = container.getBoundingClientRect().left + container.getBoundingClientRect().width / 2;
      let closest: Element | null = null;
      let minDist = Infinity;

      container.querySelectorAll('[data-month]').forEach((day) => {
        const r = day.getBoundingClientRect();
        const dist = Math.abs(cx - (r.left + r.width / 2));
        if (dist < minDist) {
          minDist = dist;
          closest = day;
        }
      });

      if (closest) {
        const m = (closest as Element).getAttribute('data-month');
        if (m) setVisibleMonth(m);
      }
    };

    const c = calendarRef.current;
    if (c) {
      c.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => c.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div className="bg-[#150a24]/50 border border-white/5 rounded-3xl p-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-black text-[#8b7ca8] uppercase tracking-wider font-display">
          {currentMonthName}
        </span>
        {!isToday && (
          <button
            onClick={() => onSelectDate(new Date())}
            className="text-[10px] text-accent-purple font-black uppercase tracking-wider font-display hover:text-accent-purple/80 transition-colors"
          >
            Сегодня
          </button>
        )}
      </div>

      <div ref={calendarRef} className="overflow-x-auto snap-x snap-mandatory scrollbar-hide">
        <div className="flex gap-1.5 pb-1" style={{ width: 'max-content' }}>
          {weekDays.map((day, i) => {
            const isSelected = selectedDate.toDateString() === day.date.toDateString();
            return (
              <button
                key={i}
                data-today={day.isToday}
                data-selected={isSelected}
                data-month={day.month}
                onClick={() => onSelectDate(day.date)}
                className={cn(
                  'flex flex-col items-center justify-center snap-center py-2.5 rounded-2xl transition-all flex-shrink-0',
                  day.isToday && !isSelected
                    ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30'
                    : isSelected
                    ? 'bg-accent-purple text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]'
                    : 'text-[#8b7ca8] hover:bg-white/5'
                )}
                style={{ width: 'calc((100vw - 48px) / 7)' }}
              >
                <span className="text-[9px] font-black uppercase tracking-wider mb-1.5 font-display">
                  {day.weekday}
                </span>
                <span className={cn('text-lg font-black font-display', isSelected && 'glow-purple')}>
                  {day.day}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
