import { BasesQueryResult, QueryController } from 'obsidian';
import * as React from 'react';
import { ReactBasesView } from '../base/ReactBasesView';
import { GanttView } from './GanttView';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';

export const GanttViewType = 'bases-gantt';

/**
 * Gantt Bases View - Timeline visualization for project management.
 * Integrates with Obsidian's Bases API and renders React components.
 */
export class GanttBasesView extends ReactBasesView {
  type = GanttViewType;

  constructor(controller: QueryController, containerEl: HTMLElement) {
    console.log('GanttBasesView constructor called');
    super(controller, containerEl);
    console.log('GanttBasesView constructor completed');
  }

  /**
   * Extract property name from BasesPropertyId (format: "type.propertyName")
   */
  private extractPropertyName(propertyId: unknown): string {
    if (!propertyId || typeof propertyId !== 'string') return '';
    const parts = propertyId.split('.');
    return parts.length > 1 ? parts.slice(1).join('.') : propertyId;
  }

  /**
   * Get the React component to render
   */
  protected getReactComponent(data: BasesQueryResult): React.ReactElement {
    // Get options from config - property type returns BasesPropertyId like "date.start"
    const startDateProperty = this.extractPropertyName(this.config.get('startDateProperty')) || 'start';
    const endDateProperty = this.extractPropertyName(this.config.get('endDateProperty')) || 'end';

    // Wrap in ErrorBoundary to catch React errors
    return React.createElement(
      ErrorBoundary,
      {},
      React.createElement(GanttView, {
        data,
        options: {
          startDateProperty,
          endDateProperty,
        },
        onStartDatePropertyChange: (value: string) => {
          this.config.set('startDateProperty', value);
        },
        onEndDatePropertyChange: (value: string) => {
          this.config.set('endDateProperty', value);
        },
        app: this.app,
        hoverParent: this,
      })
    );
  }

  /**
   * Static method to define view options
   */
  static getViewOptions() {
    return [
      {
        key: 'startDateProperty',
        displayName: 'Start Date',
        type: 'property',
        default: 'start',
        placeholder: 'Select date property',
      },
      {
        key: 'endDateProperty',
        displayName: 'End Date',
        type: 'property',
        default: 'end',
        placeholder: 'Select date property',
      },
    ];
  }
}
