import { useState, useCallback, useRef } from 'react';
import { App } from 'obsidian';
import { differenceInDays } from 'date-fns';
import { Task } from '../../../types/view-config';
import { usePropertyUpdate } from '../../../hooks/usePropertyUpdate';
import { calculateDateFromDelta } from '../utils/dateCalculations';

interface UseTaskResizeOptions {
  task: Task;
  app: App;
  timelineStart: Date;
  timelineEnd: Date;
  chartRef: React.RefObject<HTMLDivElement>;
}

/**
 * Hook for task bar resize functionality.
 * Handles mouse events for dragging task start/end handles.
 *
 * @param options - Resize options
 * @returns Object with resize handlers and state
 */
export function useTaskResize({
  task,
  app,
  timelineStart,
  timelineEnd,
  chartRef,
}: UseTaskResizeOptions) {
  const [isResizing, setIsResizing] = useState(false);
  const resizeTypeRef = useRef<'start' | 'end' | null>(null);
  const hadMovementRef = useRef(false);
  const { updateProperty } = usePropertyUpdate(app);

  /**
   * Calculate pixels per day based on actual chart width
   */
  const getPixelsPerDay = useCallback(() => {
    // Add 1 because differenceInDays doesn't include the end date,
    // but the timeline visually shows both start and end dates (inclusive)
    const totalDays = differenceInDays(timelineEnd, timelineStart) + 1;
    const chartWidth = chartRef.current?.getBoundingClientRect().width || 1000;
    return chartWidth / totalDays;
  }, [timelineStart, timelineEnd, chartRef]);

  /**
   * Check if resize movement occurred and reset the flag.
   * Used to prevent click navigation after resize.
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
      const originalDate = handle === 'start' ? task.startDate : task.endDate;

      // Calculate pixels per day at resize start using actual chart width
      const pixelsPerDay = getPixelsPerDay();

      /**
       * Handle mouse move during resize
       */
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;

        // Mark as moved if significant movement
        if (Math.abs(deltaX) > 3) {
          hadMovementRef.current = true;
        }

        const newDate = calculateDateFromDelta(originalDate, deltaX, pixelsPerDay);

        // Update property immediately for visual feedback
        const propertyName =
          handle === 'start' ? task.startDateProperty : task.endDateProperty;

        // Only update if date changed
        if (newDate.getTime() !== originalDate.getTime()) {
          // Validate: start must be before end
          if (handle === 'start' && newDate >= task.endDate) {
            return; // Don't allow start date to be after end date
          }
          if (handle === 'end' && newDate <= task.startDate) {
            return; // Don't allow end date to be before start date
          }

          updateProperty(task.file, propertyName, newDate.toISOString());
        }
      };

      /**
       * Handle mouse up (end resize)
       */
      const handleMouseUp = () => {
        setIsResizing(false);
        resizeTypeRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [task, updateProperty, getPixelsPerDay]
  );

  return {
    isResizing,
    resizeType: resizeTypeRef.current,
    handleResizeStart,
    consumeHadMovement,
  };
}
