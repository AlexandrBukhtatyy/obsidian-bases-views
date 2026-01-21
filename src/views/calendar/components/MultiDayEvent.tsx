import * as React from 'react';
import { App, HoverParent } from 'obsidian';
import { CalendarEvent } from '../../../types/view-config';
import { useHoverPreview } from '../../../hooks/useHoverPreview';
import { createNoteOpener } from '../../../utils/noteOpener';
import { useMultiDayEventDrag } from '../hooks/useMultiDayEventDrag';
import { useEventResize } from '../hooks/useEventResize';

interface MultiDayEventProps {
  event: CalendarEvent;
  startCol: number;
  colSpan: number;
  row: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
  app: App;
  hoverParent: HoverParent;
  containerRef: React.RefObject<HTMLDivElement>;
  dateProperty: string;
  endDateProperty: string;
  onInteractionEnd?: () => void;
}

/**
 * Multi-day event component that spans across calendar columns.
 * Rendered at the top of week rows for events spanning multiple days.
 * Supports drag (move entire event) and resize (change start/end dates).
 */
export const MultiDayEvent: React.FC<MultiDayEventProps> = ({
  event,
  startCol,
  colSpan,
  row,
  continuesBefore,
  continuesAfter,
  app,
  hoverParent,
  containerRef,
  dateProperty,
  endDateProperty,
  onInteractionEnd,
}) => {
  const { isDragging, previewDelta: dragDelta, handleDragStart, consumeHadMovement: consumeDragMovement } = useMultiDayEventDrag({
    event,
    app,
    containerRef,
    dateProperty,
    endDateProperty,
    onDragEnd: onInteractionEnd,
  });

  const { isResizing, previewDelta: resizeDelta, handleResizeStart, consumeHadMovement: consumeResizeMovement } = useEventResize({
    event,
    app,
    containerRef,
    dateProperty,
    endDateProperty,
    onResizeEnd: onInteractionEnd,
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

  // Calculate phantom position/size during drag or resize
  // Phantom always shows during interaction, original becomes semi-transparent
  const phantomData = React.useMemo((): { style: React.CSSProperties; extendsBefore: boolean; extendsAfter: boolean } | null => {
    if (isDragging) {
      // During drag, phantom shows at projected position
      const rawStartCol = startCol + dragDelta;
      const rawEndCol = rawStartCol + colSpan - 1; // 0-indexed end column

      // Clamp visible range to [0, 6]
      const clampedStartCol = Math.max(0, rawStartCol);
      const clampedEndCol = Math.min(6, rawEndCol);
      const clampedColSpan = Math.max(1, clampedEndCol - clampedStartCol + 1);

      return {
        style: {
          gridColumn: `${clampedStartCol + 1} / span ${clampedColSpan}`,
          gridRow: row + 1,
        },
        extendsBefore: rawStartCol < 0,
        extendsAfter: rawEndCol > 6,
      };
    }
    if (isResizing && resizeDelta) {
      const { type, days } = resizeDelta;

      if (type === 'start') {
        // Resize from start: adjust start column and span
        const rawStartCol = startCol + days;
        const rawEndCol = startCol + colSpan - 1; // End stays the same

        // Clamp for display within week grid
        const clampedStartCol = Math.max(0, rawStartCol);
        const clampedEndCol = Math.min(6, rawEndCol);
        const clampedSpan = Math.max(1, clampedEndCol - clampedStartCol + 1);

        return {
          style: {
            gridColumn: `${clampedStartCol + 1} / span ${clampedSpan}`,
            gridRow: row + 1,
          },
          extendsBefore: rawStartCol < 0,
          extendsAfter: false,
        };
      } else {
        // Resize from end: adjust span only
        const rawEndCol = startCol + colSpan - 1 + days;

        // Clamp for display within week grid
        const clampedEndCol = Math.min(6, rawEndCol);
        const clampedSpan = Math.max(1, clampedEndCol - startCol + 1);

        return {
          style: {
            gridColumn: `${startCol + 1} / span ${clampedSpan}`,
            gridRow: row + 1,
          },
          extendsBefore: false,
          extendsAfter: rawEndCol > 6,
        };
      }
    }
    return null;
  }, [isDragging, dragDelta, isResizing, resizeDelta, startCol, colSpan, row]);

  const style: React.CSSProperties = {
    gridColumn: `${startCol + 1} / span ${colSpan}`,
    gridRow: row + 1,
    zIndex: isActive ? 1000 : undefined,
  };

  return (
    <>
      {/* Phantom element showing projected position/size */}
      {phantomData && (
        <div
          className={`bv-calendar-multi-day-event bv-calendar-event-phantom ${phantomData.extendsBefore ? 'bv-continues-before' : ''} ${phantomData.extendsAfter ? 'bv-continues-after' : ''}`}
          style={phantomData.style}
        />
      )}

      <div
        className={`bv-calendar-multi-day-event ${continuesBefore ? 'bv-continues-before' : ''} ${continuesAfter ? 'bv-continues-after' : ''} ${isActive ? 'bv-event-active' : ''}`}
        style={style}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title={event.title}
      >
      {/* Left resize handle - only show if not continuing from previous week */}
      {!continuesBefore && (
        <div
          className="bv-calendar-event-resize-handle bv-calendar-event-resize-left"
          onMouseDown={(e) => handleResizeStart(e, 'start')}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Event content - draggable area */}
      <div
        className="bv-calendar-event-content"
        onMouseDown={handleDragStart}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <span className="bv-calendar-multi-day-event-title">{event.title}</span>
      </div>

      {/* Right resize handle - only show if not continuing to next week */}
      {!continuesAfter && (
        <div
          className="bv-calendar-event-resize-handle bv-calendar-event-resize-right"
          onMouseDown={(e) => handleResizeStart(e, 'end')}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      </div>
    </>
  );
};
