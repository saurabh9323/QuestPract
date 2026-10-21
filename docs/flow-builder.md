# Flow builder — M1

Open `/flows/` from Practice or Module Playground. This milestone is an editable diagram workbench, not a service or query runtime.

## Implemented

- Shared SVG canvas reused by the existing Dojo design builder; legacy Dojo graph storage is unchanged.
- DSA, system-design, React and SQL node palettes.
- Six editable DSA starters: two pointers, sliding window, binary search, BFS, DFS and dynamic programming.
- Node descriptions, cost/failure notes and trade-offs; labelled connections with conditions and connection modes.
- Node dragging, canvas panning, zoom, keyboard movement, auto-layout and 30-edit undo/redo.
- Explicit save/open through existing account progress synchronization, validated with the shared learning schemas. Save logs contain metadata, not restorable snapshots.
- Unsaved-change warnings and links to existing JavaScript execution and SQL practice.

## Boundaries

The editor does not execute diagrams, judge architectural correctness, bind diagrams to code traces, or implement SQL game levels. Those are subsequent milestones. SQL diagrams only describe a plan. Saved drafts are bounded by the existing shared document/count/size limits. Undo history lasts for the current editor session.

## Verification

- TypeScript check passed.
- 24 focused tests passed across flow editing, learning foundations and Playground instrumentation.
- `/flows/` returned HTTP 200 from the development server on port 3015.
- Browser visual verification was blocked by the browser tool policy. Desktop/mobile layout, touch dragging and live account synchronization have not been verified for this milestone.
- No production build or push performed.
