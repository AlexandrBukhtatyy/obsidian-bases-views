import * as React from 'react';
import { App, HoverParent } from 'obsidian';
import { CalendarEvent } from '../../../types/view-config';
import { useHoverPreview } from '../../../hooks/useHoverPreview';
import { createNoteOpener } from '../../../utils/noteOpener';
import { useMultiDayEventDrag } from '../hooks/useMultiDayEventDrag';
import { useEventResize } from '../hooks/useEventResize';

interface EventProps {
  event: CalendarEvent;
  app: App;
  hoverParent: HoverParent;
  containerRef: React.RefObject<HTMLElement>;
  dateProperty: string;
  endDateProperty: string;
}

/**
 * Event component for Calendar view.
 * Displays an event as a draggable/resizable item in a calendar day.
 * Supports drag (move entire event) and resize (change start/end dates).
 */
export const Event: React.FC<EventProps> = ({
  event,
  app,
  hoverParent,
  containerRef,
  dateProperty,
  endDateProperty,
}) => {
  const { isDragging, previewDelta: dragDelta, handleDragStart, consumeHadMovement: consumeDragMovement } = useMultiDayEventDrag({
    event,
    app,
    containerRef,
    dateProperty,
    endDateProperty,
  });

  const { isResizing, previewDelta: resizeDelta, handleResizeStart, consumeHadMovement: consumeResizeMovement } = useEventResize({
    event,
    app,
    containerRef,
    dateProperty,
    endDateProperty,
  });

  const { handleMouseEnter, handleMouseLeave } = useHoverPreview(
    app,
    hoverParent,
    event.file
  );

  const openNote = createNoteOpener(app, event.file);

  const handleClick = React.useCallback((e: React.MouseEvent) => {
    const hadDrag = consumeDragMovement();
    const hadResize = consumeResizeMovement();

    if (hadDrag || hadResize) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    openNote(e);
  }, [consumeDragMovement, consumeResizeMovement, openNote]);

  const isActive = isDragging || isResizing;

  // Calculate phantom style for resize/drag preview
  // Phantom always shows during interaction, original becomes semi-transparent
  const phantomStyle = React.useMemo((): React.CSSProperties | null => {
    const dayWidth = containerRef.current ? containerRef.current.getBoundingClientRect().width / 7 : 0;
    if (!dayWidth) return null;

    if (isDragging) {
      // During drag, phantom shows at projected position
      return {
        transform: `translateX(${dragDelta * dayWidth}px)`,
      };
    }
    if (isResizing && resizeDelta) {
      const { type, days } = resizeDelta;

      if (type === 'start') {
        // Resize from start: move left and extend width
        return {
          transform: `translateX(${days * dayWidth}px)`,
          width: `calc(100% + ${-days * dayWidth}px)`,
        };
      } else {
        // Resize from end: just extend width to the right
        return {
          width: `calc(100% + ${days * dayWidth}px)`,
        };
      }
    }
    return null;
  }, [isDragging, dragDelta, isResizing, resizeDelta, containerRef]);

  const style: React.CSSProperties = {
    zIndex: isActive ? 999 : undefined,
    position: 'relative',
  };

  return (
    <>
      {/* Phantom element showing projected position/size */}
      {phantomStyle && (
        <div
          className="bv-calendar-event bv-calendar-event-phantom"
          style={{ ...style, ...phantomStyle }}
        />
      )}

      <div
        className={`bv-calendar-event ${isActive ? 'bv-event-active' : ''}`}
        style={style}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title={event.title}
      >
      {/* Left resize handle */}
      <div
        className="bv-calendar-event-resize-handle bv-calendar-event-resize-left"
        onMouseDown={(e) => handleResizeStart(e, 'start')}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Event content - draggable area */}
      <div
        className="bv-calendar-event-content"
        onMouseDown={handleDragStart}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <span className="bv-calendar-event-title">{event.title}</span>
      </div>

      {/* Right resize handle */}
      <div
        className="bv-calendar-event-resize-handle bv-calendar-event-resize-right"
        onMouseDown={(e) => handleResizeStart(e, 'end')}
        onClick={(e) => e.stopPropagation()}
      />
      </div>
    </>
  );
};
