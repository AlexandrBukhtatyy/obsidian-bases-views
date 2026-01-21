import { useState, useMemo } from 'react';
import { App, BasesQueryResult } from 'obsidian';
import { adaptBasesData } from '../../../utils/basesDataAdapter';
import { entriesToEvents } from '../utils/calendarHelpers';

/**
 * Hook for Calendar view data management.
 * Transforms Bases data into calendar events.
 *
 * @param data - Data from Bases API (BasesQueryResult)
 * @param app - Obsidian app instance
 * @param initialDateProperty - Initial date property
 * @param initialEndDateProperty - Initial end date property (optional, for multi-day events)
 * @param initialViewMode - Initial view mode (month/week/day)
 * @returns Object with events, date property, and view mode management
 */
export function useCalendarData(
  data: BasesQueryResult,
  app: App,
  initialDateProperty: string,
  initialEndDateProperty: string | undefined,
  initialViewMode: 'month' | 'week' | 'day'
) {
  const [dateProperty, setDateProperty] = useState(initialDateProperty || 'start');
  const [endDateProperty, setEndDateProperty] = useState(initialEndDateProperty || 'end');
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>(initialViewMode || 'month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Transform Bases data to our internal format
  const entries = useMemo(() => {
    return adaptBasesData(data, app);
  }, [data, app]);

  // Convert entries to events with date filtering
  const events = useMemo(() => {
    return entriesToEvents(entries, dateProperty, endDateProperty || undefined);
  }, [entries, dateProperty, endDateProperty]);

  return {
    events,
    dateProperty,
    setDateProperty,
    endDateProperty,
    setEndDateProperty,
    viewMode,
    setViewMode,
    currentDate,
    setCurrentDate,
  };
}
