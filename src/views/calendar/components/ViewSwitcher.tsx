import React from 'react';

interface ViewSwitcherProps {
  value: 'month' | 'week' | 'day';
  onChange: (value: 'month' | 'week' | 'day') => void;
}

/**
 * ViewSwitcher component for toggling between month, week, and day views.
 */
export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ value, onChange }) => {
  return (
    <div className="bv-calendar-view-switcher">
      <button
        className={`bv-calendar-view-button ${
          value === 'month' ? 'bv-calendar-view-button-active' : ''
        }`}
        onClick={() => onChange('month')}
      >
        Month
      </button>
      <button
        className={`bv-calendar-view-button ${
          value === 'week' ? 'bv-calendar-view-button-active' : ''
        }`}
        onClick={() => onChange('week')}
      >
        Week
      </button>
      <button
        className={`bv-calendar-view-button ${
          value === 'day' ? 'bv-calendar-view-button-active' : ''
        }`}
        onClick={() => onChange('day')}
      >
        Day
      </button>
    </div>
  );
};
