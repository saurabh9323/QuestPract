# Portal navigation and module ownership

The portal follows five stages. Existing URLs and persisted progress IDs are retained.

| Area | Purpose | Subsections |
| --- | --- | --- |
| Today | Pick and plan work | Overview, daily quest, schedule, tasks |
| Learn | Understand a concept | Basics; reading and deep dives; visual explanations |
| Practice | Apply understanding | Solve and recall; code experiments; system design; interviews |
| Progress | Decide what to revisit | Recall, analytics, calendar, DSA path |
| Profile | Manage the workspace | Account, appearance, data |

Interview materials now sit alongside mock interviews and communication practice. Their previously saved Learn theme still applies for compatibility.

## Code boundaries

- `lib/workspace-routes.ts`: stable route slugs, parsing and static export paths. Never rename a route simply to rename a navigation label.
- `lib/navigation/catalog.ts`: module names, descriptions, groups, ordering and search. Every workspace route appears exactly once. This is the shared catalog for sidebar navigation, breadcrumbs, command search and the portal guide.
- `components/WorkspaceNavigation.tsx`: navigation interaction and group icons; re-exports the existing group API for appearance settings.
- `components/navigation/ModuleGuide.tsx`: the expandable portal directory inside the learning toolbar.
- `app/navigation.css`: scoped directory and navigation styles, including narrow-screen wrapping.
- `components/QuestWorkspace.tsx`: existing route composition and account state. Feature implementations remain in their own components; this change does not move persistence logic.
- `lib/<feature>/`, `components/<feature>/`, `tests/<feature>*.test.ts`: preferred boundaries for new feature data, UI and checks. Existing legacy flat modules remain supported; avoid bulk moves that obscure behavior changes.

When adding a module, register its route and catalog entry, implement it in a feature folder, and add a route-coverage test. Do not create another local map of module names. Changing sidebar placement must not reset progress or change saved appearance inheritance.

The sidebar provides a module search. The portal guide explains when to use each tool. Ctrl/Cmd+K continues to search course content as well as module names. All destinations retain real links, modified-click behavior and browser history.
