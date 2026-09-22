# Quest90 study workspace

Navigation now uses five groups: Today, Learn, Practice, Progress, and Profile. Every existing destination remains available in its group. Progress opens the 90-day calendar; the original mission cards and search are under “Browse all missions”.

Daily quests have four sections:

- Learn & build: mission and worked examples beside one answer editor at a time. Switch the reference panel to its chapter diagram and data flow. Gradual hints and rubrics remain collapsed until requested.
- DSA practice: open assigned questions inside the daily workspace, using the same saved attempts as the question bank.
- Speak & reflect: the existing daily communication assignment and saved reflection.
- Checklist & submit: existing checklist, partial/complete session submission, minutes, constraints, screenshots, notes, and ChatGPT handoff.

Focus mode hides the app sidebar and header. The timer, section controls, and save status remain available. Exit with the button or Escape. Navigation away from the quest also exits focus mode. Section switches keep the components mounted so unsent session fields and draft selections are retained within the day.

The daily editor autosaves through the existing account progress hook. “Save checkpoint” keeps an explicit historical version; “New answer” preserves the previous nonempty answer before clearing the draft. “Copy prompt” includes the question, rubric, draft, and feedback for manual ChatGPT review. “Review & submit session” opens the existing submission form; it does not mark work correct or complete.

Calendar tiles derive from managed tasks, including communication and personal tasks assigned to each course day. Green means all non-skipped tasks are done; amber means work has started; pending means unstarted work has an overdue task; today marks the scheduled calendar date. Task details show actual due dates after rescheduling, skipped status, reasons, and estimates. Tiles are course days, not weekday columns. Checklist-only mission cards may show completion before communication is finished; the calendar considers that remaining task.

Styles use shared light/dark theme colors, responsive columns, text and icons alongside state colors, keyboard focus indicators, and reduced-motion preferences. No storage schema or account migration is required for this UI change.

Validation: TypeScript check and Git whitespace check. No production build or automated browser tests were run for this change.
