import * as React from 'react';
import { format } from 'date-fns';
import { Task, TaskGroup } from '../../../types/view-config';

interface TaskListProps {
  tasks: Task[];
  groups: TaskGroup[];
  onToggleGroup: (groupName: string) => void;
}

/**
 * TaskList component displaying task names and dates.
 * Shows on the left side of the Gantt chart.
 * Supports grouped display with collapsible sections.
 */
export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  groups,
  onToggleGroup,
}) => {
  const hasGroups = groups.length > 0;

  return (
    <div className="bv-gantt-task-list">
      <div className="bv-gantt-task-list-header">
        <div className="bv-gantt-task-list-title">Task</div>
      </div>

      <div className="bv-gantt-task-list-content">
        {/* Render group headers in the task list */}
        {hasGroups && groups.map((group) => (
          <div
            key={`group-${group.name}`}
            className="bv-gantt-task-list-group"
            style={{
              top: `${group.startRow * 40}px`,
            }}
            onClick={() => onToggleGroup(group.name)}
          >
            <span
              className={`bv-gantt-group-toggle ${group.isCollapsed ? 'bv-gantt-group-toggle-collapsed' : ''}`}
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
            <span className="bv-gantt-task-list-group-name">{group.name}</span>
            <span className="bv-gantt-task-list-group-count">{group.tasks.length}</span>
          </div>
        ))}

        {/* Render task items */}
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bv-gantt-task-list-item"
            style={{
              top: `${task.row * 40}px`,
            }}
          >
            <div className="bv-gantt-task-list-item-title">{task.title}</div>
            <div className="bv-gantt-task-list-item-dates">
              {format(task.startDate, 'MMM d')} - {format(task.endDate, 'MMM d')}
            </div>
          </div>
        ))}

        {/* Empty state for task list */}
        {tasks.length === 0 && groups.length === 0 && (
          <div className="bv-gantt-task-list-empty">
            <span>No tasks</span>
          </div>
        )}
      </div>
    </div>
  );
};
