import * as React from 'react';
import { App, BasesQueryResult, HoverParent } from 'obsidian';
import { addDays, format, differenceInDays } from 'date-fns';
import { useGanttData } from './hooks/useGanttData';
import { Timeline } from './components/Timeline';
import { Grid } from './components/Grid';
import { TaskBar } from './components/TaskBar';
import { TaskList } from './components/TaskList';
import { GanttGroupHeader } from './components/GanttGroupHeader';
import { PropertySelector } from '../../components/shared/PropertySelector';
import { GanttViewOptions } from '../../types/view-config';
import { NewTaskModal } from './components/NewTaskModal';
import { usePropertyUpdate } from '../../hooks/usePropertyUpdate';

interface GanttViewProps {
  data: BasesQueryResult;
  options: GanttViewOptions;
  onStartDatePropertyChange?: (value: string) => void;
  onEndDatePropertyChange?: (value: string) => void;
  onGroupByPropertyChange?: (value: string) => void;
  app: App;
  hoverParent: HoverParent;
}

/**
 * Main Gantt view component.
 * Displays tasks as horizontal bars on a timeline with start/end dates.
 * Supports grouping by property (projects/categories).
 */
export const GanttView: React.FC<GanttViewProps> = ({
  data,
  options,
  onStartDatePropertyChange,
  onEndDatePropertyChange,
  onGroupByPropertyChange,
  app,
  hoverParent,
}) => {
  const {
    tasks,
    groups,
    timelineStart,
    timelineEnd,
    startDateProperty,
    endDateProperty,
    groupByProperty,
    setStartDateProperty,
    setEndDateProperty,
    setGroupByProperty,
    toggleGroupCollapse,
  } = useGanttData(
    data,
    app,
    options.startDateProperty,
    options.endDateProperty,
    options.groupByProperty
  );

  // Wrap callbacks to trigger both local state and parent callback
  const handleStartDatePropertyChange = React.useCallback((value: string) => {
    setStartDateProperty(value);
    onStartDatePropertyChange?.(value);
  }, [setStartDateProperty, onStartDatePropertyChange]);

  const handleEndDatePropertyChange = React.useCallback((value: string) => {
    setEndDateProperty(value);
    onEndDatePropertyChange?.(value);
  }, [setEndDateProperty, onEndDatePropertyChange]);

  const handleGroupByPropertyChange = React.useCallback((value: string) => {
    setGroupByProperty(value);
    onGroupByPropertyChange?.(value);
  }, [setGroupByProperty, onGroupByPropertyChange]);

  // Property update for renaming groups
  const { updateProperty } = usePropertyUpdate(app);

  /**
   * Rename a group by updating the group property for all tasks in that group
   */
  const handleRenameGroup = React.useCallback(async (oldName: string, newName: string) => {
    if (!groupByProperty) return;

    // Find the group and update all its tasks
    const group = groups.find((g) => g.name === oldName);
    if (!group) return;

    // Update each task's group property
    for (const task of group.tasks) {
      await updateProperty(task.file, groupByProperty, newName);
    }
  }, [groups, groupByProperty, updateProperty]);

  /**
   * Create a new task with specified dates
   */
  const handleNewTask = React.useCallback(async (taskName: string, startDate: Date, endDate: Date) => {
    const timestamp = Date.now();
    const fileName = `${taskName || 'Untitled'} ${timestamp}.md`;

    let frontmatter = `---
${startDateProperty}: ${format(startDate, 'yyyy-MM-dd')}
${endDateProperty}: ${format(endDate, 'yyyy-MM-dd')}`;

    // Add group property if grouping is enabled
    if (groupByProperty && groupByProperty.trim() !== '') {
      frontmatter += `\n${groupByProperty}: ""`;
    }

    frontmatter += `
---

# ${taskName || 'Untitled'}

`;

    try {
      const file = await app.vault.create(fileName, frontmatter);
      const leaf = app.workspace.getLeaf('tab');
      await leaf.openFile(file);
    } catch (error) {
      console.error('Failed to create new task:', error);
    }
  }, [app, startDateProperty, endDateProperty, groupByProperty]);

  /**
   * Open modal to create new task
   */
  const handleNewTaskClick = React.useCallback(() => {
    const today = new Date();
    const defaultEndDate = addDays(today, 7);

    const modal = new NewTaskModal(
      app,
      today,
      defaultEndDate,
      handleNewTask
    );
    modal.open();
  }, [app, handleNewTask]);

  // Ref for the chart container (used for drag-to-group detection)
  const chartRef = React.useRef<HTMLDivElement>(null);

  /**
   * Handle double-click on chart area to create new task at clicked date
   */
  const handleChartDoubleClick = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartRef.current) return;

    // Don't trigger if clicking on a task bar or group header
    const target = e.target as HTMLElement;
    if (target.closest('.bv-gantt-task-bar') || target.closest('.bv-gantt-group-header')) {
      return;
    }

    const chartRect = chartRef.current.getBoundingClientRect();
    const relativeX = e.clientX - chartRect.left;
    const chartWidth = chartRect.width;

    // Calculate date from X position
    const totalDays = differenceInDays(timelineEnd, timelineStart);
    const clickedDayOffset = Math.floor((relativeX / chartWidth) * totalDays);
    const clickedDate = addDays(timelineStart, clickedDayOffset);
    const defaultEndDate = addDays(clickedDate, 7);

    const modal = new NewTaskModal(
      app,
      clickedDate,
      defaultEndDate,
      handleNewTask
    );
    modal.open();
  }, [app, timelineStart, timelineEnd, handleNewTask]);

  // Calculate chart dimensions
  const hasGroups = groups.length > 0;
  const maxRow = hasGroups
    ? Math.max(...groups.map((g) => g.startRow + g.rowCount - 1), 0)
    : tasks.length > 0
    ? Math.max(...tasks.map((t) => t.row), 0)
    : 0;
  const chartHeight = (maxRow + 1) * 40;

  return (
    <div className="bv-gantt-view">
      {/* Header with property selectors and new task button */}
      <div className="bv-gantt-header">
        <div className="bv-gantt-property-selectors">
          <PropertySelector
            label="Start Date"
            value={startDateProperty}
            onChange={handleStartDatePropertyChange}
            app={app}
            filter="date"
          />
          <PropertySelector
            label="End Date"
            value={endDateProperty}
            onChange={handleEndDatePropertyChange}
            app={app}
            filter="date"
          />
          <PropertySelector
            label="Group by"
            value={groupByProperty}
            onChange={handleGroupByPropertyChange}
            app={app}
            filter="all"
            placeholder="(No grouping)"
          />
        </div>
        <button className="bv-gantt-new-task-btn" onClick={handleNewTaskClick}>
          + New Task
        </button>
      </div>

      {/* Gantt chart container */}
      <div className="bv-gantt-container">
        {/* Left sidebar with task list */}
        <TaskList
          tasks={tasks}
          groups={groups}
          onNewTask={handleNewTaskClick}
          onToggleGroup={toggleGroupCollapse}
        />

        {/* Right side with timeline and chart */}
        <div className="bv-gantt-chart-wrapper">
          {/* Timeline header */}
          <Timeline start={timelineStart} end={timelineEnd} />

          {/* Chart area with grid and task bars */}
          <div
            ref={chartRef}
            className="bv-gantt-chart"
            style={{ height: `${chartHeight}px` }}
            onDoubleClick={handleChartDoubleClick}
          >
            {/* Background grid */}
            <Grid start={timelineStart} end={timelineEnd} rowCount={maxRow + 1} />

            {/* Group headers */}
            {groups.map((group) => (
              <GanttGroupHeader
                key={group.name}
                group={group}
                onToggle={toggleGroupCollapse}
                onRenameGroup={handleRenameGroup}
                timelineWidth="100%"
              />
            ))}

            {/* Task bars */}
            {tasks.map((task) => (
              <TaskBar
                key={task.id}
                task={task}
                timelineStart={timelineStart}
                timelineEnd={timelineEnd}
                app={app}
                hoverParent={hoverParent}
                groups={groups}
                groupByProperty={groupByProperty}
                chartRef={chartRef}
              />
            ))}

            {/* Empty state message when no tasks */}
            {tasks.length === 0 && groups.length === 0 && (
              <div className="bv-gantt-empty-overlay">
                <div className="bv-gantt-empty-message">
                  <span className="bv-gantt-empty-icon">📊</span>
                  <p>No tasks with valid dates found</p>
                  <p className="bv-gantt-empty-hint">
                    Click "+ New Task" to create your first task, or add{' '}
                    <code>{startDateProperty}</code> and <code>{endDateProperty}</code>{' '}
                    properties to existing notes.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
