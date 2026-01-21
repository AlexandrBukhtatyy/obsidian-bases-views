# Obsidian Bases Custom Views Plugin

Adds three custom view types to Obsidian Bases: **Board** (Kanban), **Gantt**, and **Calendar** with full editing capabilities.

## Features

### Board View

- Kanban-style board with vertical columns
- Group notes by any property (status, category, priority, etc.)
- Drag-and-drop cards between columns to update properties
- Visual card display with note information
- Color-coded columns

### Gantt View

- Timeline visualization for project management
- Tasks with configurable start/end dates
- Drag tasks horizontally to reschedule
- Resize task bars from left/right edges to adjust dates
- Group tasks by any property
- Auto-adjusting timeline range
- Visual grouping headers

### Calendar View

- **Month View**: Traditional monthly calendar grid
  - Multi-day events spanning across days
  - Drag-and-drop events to reschedule
  - Resize multi-day events from edges

- **Week View**: 7-day weekly overview
  - Multi-day events at the top
  - Single-day events in day cells
  - Events sorted by length (longest first)

- **Day View**: Detailed hourly schedule
  - Vertical hourly grid (00:00 - 23:00)
  - Current time indicator (red line)
  - All-day events section at top
  - Timed events positioned by start time
  - Overlapping events displayed side-by-side (Outlook-style)
  - Drag events vertically to change time
  - Resize events from top/bottom edges
  - Double-click to create new 30-minute events

### Interactive Features

- **Click to open**: Open notes in Obsidian
- **Hover preview**: Native Obsidian hover preview on all items
- **Drag-and-drop**: Move cards/events/tasks between positions
- **Resize**: Adjust dates by dragging edges
- **Create events**: Double-click in day view to create new events
- **Property editing**: All changes persist to YAML frontmatter
- **Configurable**: Select which properties to use for dates and grouping

## Tech Stack

- **React 18**: Component-based UI
- **TypeScript**: Type safety
- **TailwindCSS 4**: Utility-first styling
- **@dnd-kit**: Modern drag-and-drop
- **date-fns**: Lightweight date utilities
- **esbuild**: Fast bundling

## Installation (Development)

1. Clone the repository:
```bash
git clone <repository-url>
cd obsidian-bases-view-plugin
```

2. Install dependencies:
```bash
npm install
```

3. Build the plugin:
```bash
npm run build
```

4. Copy to your Obsidian vault:
```bash
# Copy main.js and manifest.json to:
# <vault>/.obsidian/plugins/bases-custom-views/
```

5. Enable the plugin in Obsidian Settings → Community Plugins

## Development

### Commands

- `npm run dev` - Build in watch mode with sourcemaps
- `npm run build` - Build for production

### Project Structure

```
src/
├── main.ts                      # Plugin entry
├── types/                       # TypeScript definitions
├── views/
│   ├── base/                    # ReactBasesView base class
│   ├── board/                   # Board view (Kanban)
│   ├── gantt/                   # Gantt view (Timeline)
│   └── calendar/                # Calendar view
│       ├── components/
│       │   ├── MonthView.tsx    # Monthly calendar
│       │   ├── WeekView.tsx     # Weekly calendar
│       │   ├── DayView.tsx      # Daily hourly grid
│       │   ├── DayCell.tsx      # Day cell component
│       │   ├── Event.tsx        # Event item
│       │   ├── MultiDayEvent.tsx # Multi-day event bar
│       │   └── NewEventModal.ts # Event creation modal
│       ├── hooks/
│       │   ├── useCalendarData.ts
│       │   ├── useEventDrag.ts
│       │   ├── useEventResize.ts
│       │   └── useTimedEventDrag.ts
│       └── utils/
├── components/shared/           # Reusable components
├── utils/                       # Utilities
├── hooks/                       # React hooks
└── styles/                      # TailwindCSS styles
```

### Architecture

The plugin uses a **React Bridge** pattern:

```
Obsidian BasesView (class)
    ↓
ReactBasesView (bridge)
    ↓
React Components
```

Key files:
- `src/views/base/ReactBasesView.ts` - Core abstraction
- `src/types/obsidian-bases.d.ts` - Bases API types
- `esbuild.config.mjs` - Build configuration

## Requirements

- Obsidian 1.10.0+ (for Bases API)
- Node.js 18+ (for development)

## License

MIT

## See Also

- [Implementation Plan](PLAN.md) - Detailed technical plan
- [Obsidian Bases Documentation](https://help.obsidian.md/bases)
- [Obsidian Plugin API](https://docs.obsidian.md/)
