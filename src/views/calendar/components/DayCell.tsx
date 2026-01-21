import * as React from 'react';
import { App, HoverParent } from 'obsidian';
import { useDroppable } from '@dnd-kit/core';
import { CalendarEvent } from '../../../types/view-config';
import { Event } from './Event';
import { formatDayNumber, formatDateString } from '../utils/dateUtils';
import { isDayInMonth, isDayToday } from '../utils/calendarHelpers';

interface DayCellProps {
  date: Date;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  app: App;
  hoverParent: HoverParent;
  showDayNumber?: boolean;
  containerRef: React.RefObject<HTMLElement>;
  dateProperty: string;
  endDateProperty: string;
}

/**
 * DayCell component for Calendar view.
 * Represents a single day in the calendar grid with events.
 */
export const DayCell: React.FC<DayCellProps> = ({
  date,
  events,
  isCurrentMonth,
  app,
  hoverParent,
  showDayNumber = true,
  containerRef,
  dateProperty,
  endDateProperty,
}) => {
  const dateString = formatDateString(date); // YYYY-MM-DD in local timezone
  const { setNodeRef, isOver } = useDroppable({
    id: dateString,
  });

  const isToday = isDayToday(date);

  return (
    <div
      ref={setNodeRef}
      className={`bv-calendar-day-cell ${
        !isCurrentMonth ? 'bv-calendar-day-other-month' : ''
      } ${isToday ? 'bv-calendar-day-today' : ''}`}
    >
      {showDayNumber && (
        <div className="bv-calendar-day-number">{formatDayNumber(date)}</div>
      )}

      <div className="bv-calendar-day-events">
        {events.map((event) => (
          <Event
            key={event.id}
            event={event}
            app={app}
            hoverParent={hoverParent}
            containerRef={containerRef}
            dateProperty={dateProperty}
            endDateProperty={endDateProperty}
          />
        ))}

        {events.length === 0 && isOver && (
          <div className="bv-calendar-day-drop-hint">Drop here</div>
        )}
      </div>
    </div>
  );
};
