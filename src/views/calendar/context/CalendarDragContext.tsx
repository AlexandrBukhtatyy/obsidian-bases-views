import * as React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';

interface CalendarDragContextValue {
  /** Dates that should be highlighted during drag */
  highlightedDates: string[];
  /** Set the dates to highlight (as YYYY-MM-DD strings) */
  setHighlightedDates: (dates: string[]) => void;
  /** Clear all highlights */
  clearHighlights: () => void;
}

const CalendarDragContext = createContext<CalendarDragContextValue | null>(null);

/**
 * Provider for calendar drag highlight state.
 * Wraps calendar views to enable date highlighting during event drag.
 */
export const CalendarDragProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [highlightedDates, setHighlightedDatesState] = useState<string[]>([]);

  const setHighlightedDates = useCallback((dates: string[]) => {
    setHighlightedDatesState(dates);
  }, []);

  const clearHighlights = useCallback(() => {
    setHighlightedDatesState([]);
  }, []);

  return (
    <CalendarDragContext.Provider value={{ highlightedDates, setHighlightedDates, clearHighlights }}>
      {children}
    </CalendarDragContext.Provider>
  );
};

/**
 * Hook to access calendar drag highlight state.
 */
export function useCalendarDrag(): CalendarDragContextValue {
  const context = useContext(CalendarDragContext);
  if (!context) {
    // Return a no-op implementation if used outside provider
    return {
      highlightedDates: [],
      setHighlightedDates: () => {},
      clearHighlights: () => {},
    };
  }
  return context;
}
