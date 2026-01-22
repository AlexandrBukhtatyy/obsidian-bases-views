import * as React from 'react';
import { App, HoverParent } from 'obsidian';
import { CalendarEvent } from '../../../types/view-config';
import { useHoverPreview } from '../../../hooks/useHoverPreview';
import { createNoteOpener } from '../../../utils/noteOpener';
import { isSameDay, getHours, getMinutes, differenceInMinutes, format, setHours, setMinutes } from 'date-fns';
import { isDayInEventRange } from '../utils/calendarHelpers';
import { NewEventModal } from './NewEventModal';
import { useTimedEventDrag } from '../hooks/useTimedEventDrag';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  app: App;
  hoverParent: HoverParent;
  dateProperty: string;
  endDateProperty: string;
}

// Hour height in pixels
const HOUR_HEIGHT = 60;

/**
 * Check if an event is a true all-day event (starts at midnight with no meaningful time)
 * Events with specific start times that span multiple days are NOT all-day events
 */
function isAllDayEvent(event: CalendarEvent): boolean {
  const startHours = getHours(event.date);
  const startMinutes = getMinutes(event.date);

  // If event has a specific start time (not midnight), it's a timed event
  if (startHours !== 0 || startMinutes !== 0) {
    return false;
  }

  // If it's a multi-day event starting at midnight, check if end is also midnight
  if (event.endDate) {
    const endHours = getHours(event.endDate);
    const endMinutes = getMinutes(event.endDate);
    // If end time is also midnight (or 23:59), treat as all-day
    if (endHours === 0 && endMinutes === 0) {
      return true;
    }
    // If end time is 23:59, also treat as all-day
    if (endHours === 23 && endMinutes === 59) {
      return true;
    }
    // Otherwise it's a timed event that happens to start at midnight
    return false;
  }

  // Single event at midnight with no end time - treat as all-day
  return true;
}

/**
 * Get all events for a specific day, including multi-day events.
 */
function getAllEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((event) => {
    // Single-day event on this day
    if (!event.endDate) {
      return isSameDay(event.date, day);
    }
    // Multi-day event that spans this day
    return isDayInEventRange(event, day);
  });
}

/**
 * Format hour for display (e.g., "09:00", "14:00")
 */
function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

/**
 * Event with calculated layout info for overlapping events
 */
interface EventWithLayout {
  event: CalendarEvent;
  top: number;
  height: number;
  column: number;
  totalColumns: number;
}

/**
 * Check if two time ranges overlap
 */
function eventsOverlap(
  start1: number, end1: number,
  start2: number, end2: number
): boolean {
  return start1 < end2 && end1 > start2;
}

/**
 * Calculate layout for overlapping events (columns like Outlook)
 */
function calculateEventLayout(events: CalendarEvent[], currentDate: Date): EventWithLayout[] {
  if (events.length === 0) return [];

  // Get positions for all events
  const eventsWithPos = events.map(event => ({
    event,
    ...getEventPosition(event, currentDate),
  }));

  // Sort by start time (top position)
  eventsWithPos.sort((a, b) => a.top - b.top);

  // Track active columns (events that are still "in progress" at current scan line)
  const result: EventWithLayout[] = [];
  const activeEvents: { endPos: number; column: number; index: number }[] = [];

  for (let i = 0; i < eventsWithPos.length; i++) {
    const { event, top, height } = eventsWithPos[i];
    const endPos = top + height;

    // Remove events that have ended
    const stillActive = activeEvents.filter(ae => ae.endPos > top);

    // Find which columns are occupied
    const occupiedColumns = new Set(stillActive.map(ae => ae.column));

    // Find first available column
    let column = 0;
    while (occupiedColumns.has(column)) {
      column++;
    }

    // Add this event to active list
    stillActive.push({ endPos, column, index: i });

    // Update activeEvents for next iteration
    activeEvents.length = 0;
    activeEvents.push(...stillActive);

    result.push({
      event,
      top,
      height,
      column,
      totalColumns: 1, // Will be updated in second pass
    });
  }

  // Second pass: calculate total columns for each overlapping group
  for (let i = 0; i < result.length; i++) {
    const current = result[i];
    const currentEnd = current.top + current.height;

    // Find all events that overlap with this one
    let maxColumn = current.column;
    for (let j = 0; j < result.length; j++) {
      if (i === j) continue;
      const other = result[j];
      const otherEnd = other.top + other.height;

      if (eventsOverlap(current.top, currentEnd, other.top, otherEnd)) {
        maxColumn = Math.max(maxColumn, other.column);
      }
    }

    current.totalColumns = maxColumn + 1;
  }

  // Third pass: ensure all overlapping events have same totalColumns
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < result.length; i++) {
      const current = result[i];
      const currentEnd = current.top + current.height;

      for (let j = 0; j < result.length; j++) {
        if (i === j) continue;
        const other = result[j];
        const otherEnd = other.top + other.height;

        if (eventsOverlap(current.top, currentEnd, other.top, otherEnd)) {
          const maxCols = Math.max(current.totalColumns, other.totalColumns);
          if (current.totalColumns !== maxCols || other.totalColumns !== maxCols) {
            current.totalColumns = maxCols;
            other.totalColumns = maxCols;
            changed = true;
          }
        }
      }
    }
  }

  return result;
}

/**
 * Calculate event position and height in the hourly grid
 */
function getEventPosition(event: CalendarEvent, currentDate: Date): { top: number; height: number } {
  const startHour = getHours(event.date);
  const startMinutes = getMinutes(event.date);

  // Calculate top position based on start time
  const top = startHour * HOUR_HEIGHT + (startMinutes / 60) * HOUR_HEIGHT;

  // Calculate height based on duration
  let height = HOUR_HEIGHT; // Default 1 hour
  if (event.endDate) {
    // If event ends on a different day, extend to end of current day
    if (!isSameDay(event.date, event.endDate)) {
      // If this is the start day, go to end of day
      if (isSameDay(event.date, currentDate)) {
        height = (24 * HOUR_HEIGHT) - top;
      }
      // If this is the end day, go from start of day to end time
      else if (isSameDay(event.endDate, currentDate)) {
        const endHour = getHours(event.endDate);
        const endMinutes = getMinutes(event.endDate);
        return {
          top: 0,
          height: endHour * HOUR_HEIGHT + (endMinutes / 60) * HOUR_HEIGHT
        };
      }
      // If this is a middle day, fill entire day
      else {
        return { top: 0, height: 24 * HOUR_HEIGHT };
      }
    } else {
      // Same day event - calculate actual duration
      const durationMinutes = differenceInMinutes(event.endDate, event.date);
      height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 20); // Minimum 20px height
    }
  }

  return { top, height };
}

/**
 * DayView component displaying events for a single day with hourly grid.
 * Shows all-day events at the top and timed events in the hourly grid.
 * Double-click on the grid to create a new 30-minute event.
 */
export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  events,
  app,
  hoverParent,
  dateProperty,
  endDateProperty,
}) => {
  const eventsColumnRef = React.useRef<HTMLDivElement>(null);
  const dayEvents = getAllEventsForDay(events, currentDate);
  const isToday = isSameDay(currentDate, new Date());

  // State for drag-to-create event
  const [isCreating, setIsCreating] = React.useState(false);
  const [creationStart, setCreationStart] = React.useState<number | null>(null);
  const [creationEnd, setCreationEnd] = React.useState<number | null>(null);
  const creationStartRef = React.useRef<number | null>(null);

  // Separate all-day events from timed events
  const allDayEvents = dayEvents.filter(isAllDayEvent);
  const timedEvents = dayEvents.filter(e => !isAllDayEvent(e));

  // Calculate layout for overlapping timed events
  const timedEventsLayout = React.useMemo(
    () => calculateEventLayout(timedEvents, currentDate),
    [timedEvents, currentDate]
  );

  // Generate hours array (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Current time indicator position
  const now = new Date();
  const currentTimeTop = isToday
    ? getHours(now) * HOUR_HEIGHT + (getMinutes(now) / 60) * HOUR_HEIGHT
    : null;

  /**
   * Convert Y position to snapped minutes (15-minute intervals)
   */
  const positionToMinutes = React.useCallback((y: number): number => {
    const totalMinutes = Math.floor((y / HOUR_HEIGHT) * 60);
    return Math.floor(totalMinutes / 15) * 15;
  }, []);

  /**
   * Convert minutes to Y position
   */
  const minutesToPosition = React.useCallback((minutes: number): number => {
    return (minutes / 60) * HOUR_HEIGHT;
  }, []);

  /**
   * Handle mouse down to start creating event
   */
  const handleMouseDown = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle left click on the grid itself, not on events
    if (e.button !== 0 || (e.target as HTMLElement).closest('.bv-calendar-day-timed-event')) {
      return;
    }

    if (!eventsColumnRef.current) return;

    const rect = eventsColumnRef.current.getBoundingClientRect();
    const scrollTop = eventsColumnRef.current.parentElement?.scrollTop || 0;
    const y = e.clientY - rect.top + scrollTop;

    const snappedMinutes = positionToMinutes(y);
    const snappedPos = minutesToPosition(snappedMinutes);

    setIsCreating(true);
    setCreationStart(snappedPos);
    setCreationEnd(snappedPos + minutesToPosition(15)); // Minimum 15 minutes
    creationStartRef.current = snappedMinutes;

    e.preventDefault();
  }, [positionToMinutes, minutesToPosition]);

  /**
   * Handle mouse move during creation
   */
  React.useEffect(() => {
    if (!isCreating) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!eventsColumnRef.current || creationStartRef.current === null) return;

      const rect = eventsColumnRef.current.getBoundingClientRect();
      const scrollTop = eventsColumnRef.current.parentElement?.scrollTop || 0;
      const y = e.clientY - rect.top + scrollTop;

      const snappedMinutes = positionToMinutes(Math.max(0, Math.min(y, 24 * HOUR_HEIGHT)));
      const startMinutes = creationStartRef.current;

      // Allow dragging both up and down from start point
      const minMinutes = Math.min(startMinutes, snappedMinutes);
      const maxMinutes = Math.max(startMinutes, snappedMinutes);

      // Ensure minimum duration of 15 minutes
      const endMinutes = Math.max(maxMinutes, minMinutes + 15);

      setCreationStart(minutesToPosition(minMinutes));
      setCreationEnd(minutesToPosition(endMinutes));
    };

    const handleMouseUp = () => {
      if (creationStart !== null && creationEnd !== null) {
        // Calculate times from positions
        const startMinutes = Math.round((creationStart / HOUR_HEIGHT) * 60);
        const endMinutes = Math.round((creationEnd / HOUR_HEIGHT) * 60);

        const startHour = Math.floor(startMinutes / 60);
        const startMinute = startMinutes % 60;
        const endHour = Math.floor(endMinutes / 60);
        const endMinute = endMinutes % 60;

        const startTime = setMinutes(setHours(currentDate, startHour), startMinute);
        const endTime = setMinutes(setHours(currentDate, endHour), endMinute);

        // Show modal to create event
        const modal = new NewEventModal(
          app,
          startTime,
          endTime,
          async (name: string, start: Date, end: Date) => {
            await createNewEvent(app, name, start, end, dateProperty, endDateProperty);
          }
        );
        modal.open();
      }

      setIsCreating(false);
      setCreationStart(null);
      setCreationEnd(null);
      creationStartRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isCreating, creationStart, creationEnd, currentDate, app, dateProperty, endDateProperty, positionToMinutes, minutesToPosition]);

  // Calculate creation preview dimensions
  const creationPreview = React.useMemo(() => {
    if (!isCreating || creationStart === null || creationEnd === null) return null;

    const top = creationStart;
    const height = creationEnd - creationStart;

    // Format preview time
    const startMinutes = Math.round((creationStart / HOUR_HEIGHT) * 60);
    const endMinutes = Math.round((creationEnd / HOUR_HEIGHT) * 60);
    const startHour = Math.floor(startMinutes / 60);
    const startMin = startMinutes % 60;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;

    const timeText = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')} - ${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

    return { top, height, timeText };
  }, [isCreating, creationStart, creationEnd]);

  return (
    <div className="bv-calendar-day-view">
      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <div className="bv-calendar-day-allday-section">
          <div className="bv-calendar-day-allday-label">All day</div>
          <div className="bv-calendar-day-allday-events">
            {allDayEvents.map((event) => (
              <AllDayEvent
                key={event.id}
                event={event}
                currentDate={currentDate}
                app={app}
                hoverParent={hoverParent}
              />
            ))}
          </div>
        </div>
      )}

      {/* Hourly grid */}
      <div className="bv-calendar-day-grid-container">
        <div className="bv-calendar-day-grid">
          {/* Time labels column */}
          <div className="bv-calendar-day-time-column">
            {hours.map((hour) => (
              <div key={hour} className="bv-calendar-day-time-label" style={{ height: HOUR_HEIGHT }}>
                {formatHour(hour)}
              </div>
            ))}
          </div>

          {/* Events column with hour lines */}
          <div
            ref={eventsColumnRef}
            className={`bv-calendar-day-events-column ${isCreating ? 'bv-creating-event' : ''}`}
            onMouseDown={handleMouseDown}
          >
            {/* Hour lines */}
            {hours.map((hour) => (
              <div
                key={hour}
                className="bv-calendar-day-hour-line"
                style={{ top: hour * HOUR_HEIGHT }}
              />
            ))}

            {/* Current time indicator */}
            {currentTimeTop !== null && (
              <div
                className="bv-calendar-day-current-time"
                style={{ top: currentTimeTop }}
              />
            )}

            {/* Timed events */}
            {timedEventsLayout.map((layout) => (
              <TimedEvent
                key={layout.event.id}
                event={layout.event}
                top={layout.top}
                height={layout.height}
                column={layout.column}
                totalColumns={layout.totalColumns}
                app={app}
                hoverParent={hoverParent}
                containerRef={eventsColumnRef}
                dateProperty={dateProperty}
                endDateProperty={endDateProperty}
              />
            ))}

            {/* Creation preview */}
            {creationPreview && (
              <div
                className="bv-calendar-day-creation-preview"
                style={{
                  top: creationPreview.top,
                  height: Math.max(creationPreview.height, 20),
                }}
              >
                <span className="bv-calendar-day-creation-preview-time">
                  {creationPreview.timeText}
                </span>
              </div>
            )}

            {/* Empty state */}
            {dayEvents.length === 0 && (
              <div className="bv-calendar-day-empty">
                No events for this day
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Create a new event note with frontmatter
 */
async function createNewEvent(
  app: App,
  name: string,
  startDate: Date,
  endDate: Date,
  dateProperty: string,
  endDateProperty: string
): Promise<void> {
  const fileName = `${name || 'Untitled Event'}.md`;
  const startDateStr = format(startDate, "yyyy-MM-dd'T'HH:mm:ss");
  const endDateStr = format(endDate, "yyyy-MM-dd'T'HH:mm:ss");

  const frontmatter = `---
${dateProperty}: ${startDateStr}
${endDateProperty}: ${endDateStr}
---

# ${name || 'Untitled Event'}

`;

  try {
    await app.vault.create(fileName, frontmatter);
  } catch (error) {
    console.error('Failed to create new event:', error);
  }
}

interface AllDayEventProps {
  event: CalendarEvent;
  currentDate: Date;
  app: App;
  hoverParent: HoverParent;
}

/**
 * All-day event item displayed at the top of day view.
 */
const AllDayEvent: React.FC<AllDayEventProps> = ({
  event,
  currentDate,
  app,
  hoverParent,
}) => {
  const { handleMouseEnter, handleMouseLeave } = useHoverPreview(
    app,
    hoverParent,
    event.file
  );

  const openNote = createNoteOpener(app, event.file);

  const isMultiDay = event.endDate && !isSameDay(event.date, event.endDate);
  const isStart = isSameDay(event.date, currentDate);
  const isEnd = event.endDate && isSameDay(event.endDate, currentDate);

  // Format date range for multi-day events
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className={`bv-calendar-day-allday-event ${isMultiDay ? 'bv-calendar-day-event-multiday' : ''}`}
      onClick={openNote}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="bv-calendar-day-allday-event-title">{event.title}</span>
      {isMultiDay && (
        <span className="bv-calendar-day-allday-event-dates">
          {formatDate(event.date)} - {formatDate(event.endDate!)}
          {isStart && <span className="bv-calendar-day-event-badge">Start</span>}
          {isEnd && !isStart && <span className="bv-calendar-day-event-badge">End</span>}
        </span>
      )}
    </div>
  );
};

interface TimedEventProps {
  event: CalendarEvent;
  top: number;
  height: number;
  column: number;
  totalColumns: number;
  app: App;
  hoverParent: HoverParent;
  containerRef: React.RefObject<HTMLDivElement>;
  dateProperty: string;
  endDateProperty: string;
}

/**
 * Timed event positioned in the hourly grid.
 * Supports drag to move and resize from top/bottom edges.
 */
const TimedEvent: React.FC<TimedEventProps> = ({
  event,
  top,
  height,
  column,
  totalColumns,
  app,
  hoverParent,
  containerRef,
  dateProperty,
  endDateProperty,
}) => {
  const { handleMouseEnter, handleMouseLeave } = useHoverPreview(
    app,
    hoverParent,
    event.file
  );

  const openNote = createNoteOpener(app, event.file);

  const {
    isDragging,
    isResizing,
    dragDeltaMinutes,
    resizeDelta,
    handleDragStart,
    handleResizeStart,
    consumeDragMovement,
  } = useTimedEventDrag({
    event,
    app,
    containerRef,
    dateProperty,
    endDateProperty,
  });

  // Format time range
  const formatTime = (date: Date) => {
    const hours = getHours(date);
    const minutes = getMinutes(date);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const startTime = formatTime(event.date);
  const endTime = event.endDate ? formatTime(event.endDate) : null;

  // Handle click - only open note if no drag/resize occurred
  const handleClick = React.useCallback((e: React.MouseEvent) => {
    if (consumeDragMovement()) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    openNote(e);
  }, [consumeDragMovement, openNote]);

  const isActive = isDragging || isResizing;

  // Calculate visual position and size during drag/resize
  const visualTop = React.useMemo(() => {
    if (isDragging) {
      return top + (dragDeltaMinutes / 60) * HOUR_HEIGHT;
    }
    if (isResizing && resizeDelta?.type === 'start') {
      return top + (resizeDelta.minutes / 60) * HOUR_HEIGHT;
    }
    return top;
  }, [top, isDragging, dragDeltaMinutes, isResizing, resizeDelta]);

  const visualHeight = React.useMemo(() => {
    if (isResizing && resizeDelta) {
      if (resizeDelta.type === 'start') {
        return height - (resizeDelta.minutes / 60) * HOUR_HEIGHT;
      } else {
        return height + (resizeDelta.minutes / 60) * HOUR_HEIGHT;
      }
    }
    return height;
  }, [height, isResizing, resizeDelta]);

  // Calculate width and left position based on column layout
  const widthPercent = 100 / totalColumns;
  const leftPercent = column * widthPercent;

  return (
    <div
      className={`bv-calendar-day-timed-event ${isActive ? 'bv-event-active' : ''}`}
      style={{
        top: visualTop,
        height: Math.max(visualHeight, 20),
        left: `${leftPercent}%`,
        width: `calc(${widthPercent}% - 2px)`,
        zIndex: isActive ? 100 : column + 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onClick={handleClick}
      onMouseDown={handleDragStart}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Top resize handle */}
      <div
        className="bv-calendar-day-event-resize-handle bv-calendar-day-event-resize-top"
        onMouseDown={(e) => handleResizeStart(e, 'start')}
        onClick={(e) => e.stopPropagation()}
      />

      <div className="bv-calendar-day-timed-event-content">
        <span className="bv-calendar-day-timed-event-time">
          {startTime}{endTime && ` - ${endTime}`}
        </span>
        <span className="bv-calendar-day-timed-event-separator">·</span>
        <span className="bv-calendar-day-timed-event-title">{event.title}</span>
      </div>

      {/* Bottom resize handle */}
      <div
        className="bv-calendar-day-event-resize-handle bv-calendar-day-event-resize-bottom"
        onMouseDown={(e) => handleResizeStart(e, 'end')}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};
