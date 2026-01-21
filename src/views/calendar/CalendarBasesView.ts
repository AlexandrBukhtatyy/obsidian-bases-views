import { BasesQueryResult, QueryController, BasesViewOption } from 'obsidian';
import * as React from 'react';
import { ReactBasesView } from '../base/ReactBasesView';
import { CalendarView } from './CalendarView';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';

export const CalendarViewType = 'bases-calendar';

/**
 * Calendar Bases View - Month/week calendar with draggable events.
 * Integrates with Obsidian's Bases API and renders React components.
 */
export class CalendarBasesView extends ReactBasesView {
  type = CalendarViewType;

  constructor(controller: QueryController, containerEl: HTMLElement) {
    console.log('CalendarBasesView constructor called');
    super(controller, containerEl);
    console.log('CalendarBasesView constructor completed');
  }

  /**
   * Get the React component to render
   */
  protected getReactComponent(data: BasesQueryResult): React.ReactElement {
    // Get options from config - use same property names as Gantt view
    const dateProperty = (this.config.get('startDateProperty') as string) || 'start';
    const endDateProperty = (this.config.get('endDateProperty') as string) || 'end';
    const viewMode = (this.config.get('viewMode') as 'month' | 'week' | 'day') || 'month';

    // Wrap in ErrorBoundary to catch React errors
    return React.createElement(
      ErrorBoundary,
      {},
      React.createElement(CalendarView, {
        data,
        options: {
          dateProperty,
          endDateProperty,
          viewMode,
        },
        onViewModeChange: (value: 'month' | 'week' | 'day') => {
          this.config.set('viewMode', value);
        },
        app: this.app,
        hoverParent: this,
      })
    );
  }

  /**
   * Static method to define view options
   * Uses same property IDs as Gantt view for consistency
   */
  static getViewOptions(): BasesViewOption[] {
    return [
      {
        id: 'startDateProperty',
        name: 'Start Date',
        type: 'property-selector',
        filter: 'date',
        defaultValue: 'start',
      },
      {
        id: 'endDateProperty',
        name: 'End Date',
        type: 'property-selector',
        filter: 'date',
        defaultValue: 'end',
      },
      {
        id: 'viewMode',
        name: 'View Mode',
        type: 'dropdown',
        defaultValue: 'month',
      },
    ];
  }
}
