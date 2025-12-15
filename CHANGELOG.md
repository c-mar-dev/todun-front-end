# Changelog

All notable changes to the Decision Queue application will be documented in this file.

## [0.3.0] - 2024-12-14

### Added

#### New Decision Type: Meeting Tasks
- **Meeting Task Extraction** (`meeting_triage`) - New card type for triaging tasks extracted from enriched meeting transcripts
  - Displays meeting metadata (date, duration, project)
  - Shows AI-extracted task list with checkboxes for selection
  - Tasks display assignee badges ("You" in blue, "Team" in gray)
  - High priority tasks show red priority badge
  - Select All / Deselect All buttons for batch selection
  - Confirm button shows dynamic selected task count

#### Animations
- **Task pulse animation** - Selected tasks pulse with emerald glow during confirmation
- **Card entrance animation** - New triage cards animate into queue with staggered entrance effect

#### Keyboard Shortcuts
- `Alt+M` - Filter to show Meeting Tasks only
- Command palette entry for "Show Meeting Tasks"

### Technical Details

#### Data Structure
New `extractedTasks` array on meeting_triage decisions:
```javascript
extractedTasks: [
  { id: 'task_id', title: 'Task title', assignee: 'You', priority: 'high' }
]
```

#### Files Modified
- `src/lib/data/decisions.js` - Added `meeting_triage` config and 3 example meeting transcripts
- `src/routes/+page.svelte` - Added task selection UI, state management, handlers, and animations

---

## [0.2.0] - 2024-12-14

### Added

#### New Views
- **Inbox View** (`/inbox`) - Email-style layout with wider list panel (40% width), more spacious detail view, and visible preview text in list items
- **Focus Mode** (`/focus`) - Full-screen distraction-free interface showing one decision at a time with auto-advance after each action and progress bar
- **Entity Timeline** (`/entity/:id`) - State progression view showing an entity's complete history with expandable/clickable inputs and outputs at each transition

#### Visual Enhancements
- **Color-coded decision states** - Each decision type now has a distinct background color in the queue list:
  - Enrich: amber (`bg-amber-900/20`)
  - Triage: purple (`bg-purple-900/20`)
  - Specify: orange (`bg-orange-900/20`)
  - Review: cyan (`bg-cyan-900/20`)
  - Categorize: pink (`bg-pink-900/20`)
- Selected items show a colored left border matching their decision type

#### Navigation
- View switcher buttons (Inbox, Focus) in main page header
- Quick actions menu via `o` key now includes view navigation commands
- New keyboard shortcuts:
  - `i` - Go to Inbox view
  - `f` - Go to Focus mode
  - `e` - View entity timeline for selected decision
  - `Esc` - Return to main queue from any view

#### Data Architecture
- **Shared data module** (`src/lib/data/decisions.js`) - Extracted all mock data and configuration to a shared module used by all views:
  - `mockDecisions` - Array of all decision objects
  - `decisionTypeConfig` - Decision type icons, labels, and color classes
  - `thingTypeConfig` - Entity type (task/transcript/email) configuration
  - `knownSpeakers` - Autocomplete data for speaker fields
  - `allProjects` - Extracted project list
  - `entityHistory` - State progression data for timeline view
  - `getEntityById()` - Helper to find entity by ID
  - `getDecisionByEntityId()` - Helper to find decision by entity ID

### Changed
- Main page now imports data from shared module instead of inline definitions
- Queue item styling updated to use type-specific background colors
- Command palette expanded with view navigation options

### Technical Details

#### Files Created
- `src/lib/data/decisions.js`
- `src/routes/inbox/+page.svelte`
- `src/routes/focus/+page.svelte`
- `src/routes/entity/[id]/+page.svelte`

#### Files Modified
- `src/routes/+page.svelte` - Refactored to use shared data module, added color-coded backgrounds, navigation links, and keyboard shortcuts

---

## [0.1.0] - Initial Release

### Added
- Decision Queue interface with five decision types (enrich, triage, specify, review, categorize)
- Two-panel layout with queue list and detail panel
- Multi-dimensional filtering (by stage, thing type, project)
- Keyboard navigation and shortcuts
- Command palette (`o` key)
- Toast notifications with undo support
- Fuzzy search for project and speaker fields
