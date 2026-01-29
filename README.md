# Obsidian Bases Views Plugin

Adds three custom view types to Obsidian Bases: **Board** (Kanban), **Gantt**, and **Calendar** with full editing capabilities.

## Features

### Board View

Kanban-style board with drag-and-drop cards between columns. Group notes by any property.

### Gantt View

Timeline visualization with draggable and resizable task bars. Group tasks by any property.

### Calendar View

Month, Week, and Day views with multi-day events, drag-and-drop, and hourly scheduling.

### Common Features

- Click to open notes, hover preview
- Drag-and-drop to reschedule
- Resize events/tasks by dragging edges
- All changes persist to YAML frontmatter

## Installation

1. Download `main.js` and `manifest.json` from [latest release](https://github.com/AlexandrBukhtatyy/obsidian-bases-views/releases)
2. Create folder: `<vault>/.obsidian/plugins/bases-views/`
3. Copy downloaded files into that folder
4. Restart Obsidian
5. Enable plugin in Settings → Community Plugins

## Development

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin in Obsidian
2. Open BRAT settings → Add Beta Plugin
3. Enter: `AlexandrBukhtatyy/obsidian-bases-views`
4. Clone the repository to `<vault>/.obsidian/plugins/bases-views/`
5. Install dependencies and run:

```bash
npm install
npm run dev
```

## Requirements

- Obsidian 1.10.0+ (for Bases API)

## Release Process

Releases are automated via GitHub Actions. When a tag is pushed, the workflow builds the plugin and creates a GitHub Release with all necessary files.

### Creating a Release

1. Update version in `manifest.json`, `package.json`, and `versions.json`
2. Build the project: `npm run build`
3. Commit changes: `git commit -am "Bump version to X.Y.Z"`
4. Create tag: `git tag X.Y.Z`
5. Push with tag: `git push origin master --tags`

GitHub Actions will automatically:
- Build the plugin
- Create a release with the tag name
- Attach `main.js`, `manifest.json`, and `main.css`

### Version Requirements

- Use semantic versioning: `X.Y.Z` (e.g., `0.2.1`)
- Tag must match version in `manifest.json` exactly
- No `v` prefix (use `0.2.1`, not `v0.2.1`)

## License

MIT
