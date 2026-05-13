/**
 * EventsSection Component
 * Displays list of events for the selected date
 */

import React, { useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  eventTime?: string | null;
}

interface EventsSectionProps {
  events: Event[];
  isPastDate: boolean;
  isToday: boolean;
  previewCount?: number;
}

export function EventsSection({
  events,
  isPastDate,
  isToday,
  previewCount = 3,
}: EventsSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const shownEvents = expanded ? events : events.slice(0, previewCount);

  return (
    <div className="bg-[#150a24]/50 border border-white/5 rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <CalendarDays size={16} className="text-[#3B82F6]" />
        <span className="text-sm font-black text-white uppercase tracking-wider font-display flex-1">
          {isToday ? 'Сегодняшние события' : 'События'}
        </span>
        {events.length > 0 && (
          <span className="text-[10px] text-[#8b7ca8] font-display">{events.length}</span>
        )}
      </div>

      {/* Content */}
      {events.length === 0 ? (
        <div className="px-4 pb-4 text-center py-6">
          <p className="text-xs text-[#8b7ca8] font-display">Нет событий</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-white/5">
            {shownEvents.map((event) => (
              <div key={event.id} className="flex items-stretch gap-0 px-4 py-3">
                {/* Time block */}
                <div className="flex flex-col items-center justify-center w-14 flex-shrink-0 mr-3">
                  {event.eventTime ? (
                    <span className="text-sm font-black text-[#3B82F6] font-display leading-tight">
                      {event.eventTime}
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#8b7ca8] font-display">Весь день</span>
                  )}
                </div>

                {/* Vertical line */}
                <div className="w-0.5 bg-[#3B82F6]/30 rounded-full mr-3 flex-shrink-0" />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white font-display truncate">
                    {event.title}
                  </div>
                  <div className="text-[10px] text-[#3B82F6] font-display mt-0.5">Событие</div>
                </div>

                {/* Dot */}
                <div className="w-2 h-2 rounded-full bg-[#3B82F6] mt-1.5 flex-shrink-0" />
              </div>
            ))}
          </div>

          {/* Expand button */}
          {events.length > previewCount && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full py-3 flex items-center justify-center gap-1.5 text-[11px] text-[#8b7ca8] font-display border-t border-white/5 hover:text-white transition-colors"
            >
              {expanded ? 'Свернуть' : 'Показать все события'}
              <ChevronDown
                size={13}
                className={cn('transition-transform', expanded && 'rotate-180')}
              />
            </button>
          )}
        </>
      )}
    </div>
  );
}
