import * as React from 'react';
import { StatusBadge } from './StatusBadge';

interface RowHeaderProps {
  title: string;
  count: number;
  isCollapsed: boolean;
  onToggle: () => void;
}

/**
 * Collapsible row header for sub-groups in grid mode.
 * Shows triangle indicator, colored badge title, and count.
 */
export const RowHeader: React.FC<RowHeaderProps> = ({
  title,
  count,
  isCollapsed,
  onToggle,
}) => {
  return (
    <div className="bv-row-header" onClick={onToggle}>
      <span
        className={`bv-row-header-toggle ${isCollapsed ? 'bv-row-header-toggle-collapsed' : ''}`}
      >
        <svg
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M3 4.5 L6 7.5 L9 4.5" />
        </svg>
      </span>
      <div className="bv-row-header-content">
        <StatusBadge value={title} count={count} size="sm" />
      </div>
    </div>
  );
};
