import { BasesQueryResult, QueryController } from 'obsidian';
import * as React from 'react';
import { ReactBasesView } from '../base/ReactBasesView';
import { BoardView } from './BoardView';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';

export const BoardViewType = 'bases-board';

/**
 * Board Bases View - Kanban-style board with vertical columns.
 * Integrates with Obsidian's Bases API and renders React components.
 */
export class BoardBasesView extends ReactBasesView {
  type = BoardViewType;

  constructor(controller: QueryController, containerEl: HTMLElement) {
    console.log('BoardBasesView constructor called');
    super(controller, containerEl);
    console.log('BoardBasesView constructor completed');
  }

  /**
   * Extract property name from BasesPropertyId (format: "type.propertyName")
   */
  private extractPropertyName(propertyId: unknown): string {
    if (!propertyId || typeof propertyId !== 'string') return '';
    // BasesPropertyId format is "type.propertyName" (e.g., "text.status")
    const parts = propertyId.split('.');
    return parts.length > 1 ? parts.slice(1).join('.') : propertyId;
  }

  /**
   * Get the React component to render
   */
  protected getReactComponent(data: BasesQueryResult): React.ReactElement {
    // Get options from config - property type returns BasesPropertyId like "text.status"
    const rawGroupBy = this.config.get('groupByProperty');
    const rawSubGroupBy = this.config.get('subGroupByProperty');

    console.log('BoardBasesView: raw config values:', { rawGroupBy, rawSubGroupBy });

    const groupByProperty = this.extractPropertyName(rawGroupBy) || 'status';
    const subGroupByProperty = this.extractPropertyName(rawSubGroupBy) || '';

    console.log('BoardBasesView: extracted properties:', { groupByProperty, subGroupByProperty });

    // Wrap in ErrorBoundary to catch React errors
    return React.createElement(
      ErrorBoundary,
      {},
      React.createElement(BoardView, {
        data,
        options: {
          groupByProperty,
          subGroupByProperty,
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
        key: 'groupByProperty',
        displayName: 'Group By',
        type: 'property',
        default: 'status',
        placeholder: 'Select property',
      },
      {
        key: 'subGroupByProperty',
        displayName: 'Sub-Group By',
        type: 'property',
        default: '',
        placeholder: 'Select property (optional)',
      },
    ];
  }
}
