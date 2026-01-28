import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableColumnHeaderProps {
  id: string;
  title: string;
  count: number;
}

/**
 * Sortable column header for drag-to-reorder columns in board view.
 */
export const SortableColumnHeader: React.FC<SortableColumnHeaderProps> = ({
  id,
  title,
  count,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bv-board-header-column bv-sortable-column"
      {...attributes}
      {...listeners}
    >
      <span className="bv-column-title">{title}</span>
      <span className="bv-column-count">{count}</span>
    </div>
  );
};
