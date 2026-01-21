import { useState, useCallback, useRef } from 'react';
import { App } from 'obsidian';
import { addDays } from 'date-fns';
import { CalendarEvent } from '../../../types/view-config';
import { usePropertyUpdate } from '../../../hooks/usePropertyUpdate';
import { formatDateString } from '../utils/dateUtils';

interface UseEventResizeOptions {
  event: CalendarEvent;
  app: App;
  containerRef: React.RefObject<HTMLElement>;
  dateProperty: string;
  endDateProperty: string;
  onResizeEnd?: () => void;
}

/**
 * Hook for event resize functionality.
 * Handles mouse events for dragging event start/end handles.
 * Works for both single-day and multi-day events.
 */
export function useEventResize({
  event,
  app,
  containerRef,
  dateProperty,
  endDateProperty,
  onResizeEnd,
}: UseEventResizeOptions) {
  const [isResizing, setIsResizing] = useState(false);
  const [previewDelta, setPreviewDelta] = useState<{ type: 'start' | 'end'; days: number } | null>(null);
  const resizeTypeRef = useRef<'start' | 'end' | null>(null);
  const hadMovementRef = useRef(false);
  const { updateProperty } = usePropertyUpdate(app);

  /**
   * Get the width of one day column in pixels
   */
  const getDayWidth = useCallback(() => {
    if (!containerRef.current) return 100;
    return containerRef.current.getBoundingClientRect().width / 7;
  }, [containerRef]);

  /**
   * Check if resize movement occurred and reset the flag.
   */
  const consumeHadMovement = useCallback(() => {
    const had = hadMovementRef.current;
    hadMovementRef.current = false;
    return had;
  }, []);

  /**
   * Handle resize start (mouse down on handle)
   */
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: 'start' | 'end') => {
      e.preventDefault();
      e.stopPropagation();

      setIsResizing(true);
      hadMovementRef.current = false;
      resizeTypeRef.current = handle;

      const startX = e.clientX;
      const originalStartDate = event.date;
      const originalEndDate = event.endDate || event.date;
      const dayWidth = getDayWidth();

      let currentDeltaDays = 0;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        currentDeltaDays = Math.round(deltaX / dayWidth);

        if (Math.abs(deltaX) > 5) {
          hadMovementRef.current = true;
        }

        // Update preview delta for phantom display (no file update during drag)
        setPreviewDelta({ type: handle, days: currentDeltaDays });
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        // Apply changes only on mouse up
        if (currentDeltaDays !== 0) {
          if (handle === 'start') {
            const newStartDate = addDays(originalStartDate, currentDeltaDays);
            // Don't allow start to go past end
            if (newStartDate <= originalEndDate) {
              updateProperty(event.file, dateProperty, formatDateString(newStartDate));
            }
          } else {
            const newEndDate = addDays(originalEndDate, currentDeltaDays);
            // Don't allow end to go before start
            if (newEndDate >= originalStartDate) {
              updateProperty(event.file, endDateProperty, formatDateString(newEndDate));
            }
          }
        }

        // Delay state reset to allow data update to propagate and prevent flicker
        setTimeout(() => {
          setIsResizing(false);
          setPreviewDelta(null);
          resizeTypeRef.current = null;
          // Notify parent to trigger re-sort
          onResizeEnd?.();
        }, 150);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [event, updateProperty, getDayWidth, dateProperty, endDateProperty, onResizeEnd]
  );

  return {
    isResizing,
    resizeType: resizeTypeRef.current,
    previewDelta,
    handleResizeStart,
    consumeHadMovement,
  };
}
