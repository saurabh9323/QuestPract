# Activity observatory

The Analytics route includes a CSS 3D-style activity landscape with a calendar timeline, selectable dates, replay, 7/28/90-day windows, flat view, and CSV export. It uses existing saved progress and introduces no database schema or progress writes.

Each tower represents dated course submissions, question-bank attempts, and the earliest retained communication Attempted/Done event for a course day. Tower height represents activity count; the selected-day panel provides exact counts and submitted minutes. Minimal tower bases remain visible on empty dates. Dates use the browser timezone.

Time totals add submitted session minutes, deduplicating submission IDs within each course day. They are not measured screen time. Independent attempts are self-reported confidence, not verified correctness. Missing historical events cannot be reconstructed. Current completion and backlog remain separate from the historical timeline.

The previous-seven-day comparison always uses the latest seven calendar days against the seven before, irrespective of selected window. CSV exports the full selected window. Reduced-motion preferences remove transform transitions, while timeline replay only starts when requested.

Validation: TypeScript check and an inline aggregation check covering duplicate submissions, independent attempts, time totals, and earliest communication date. No production build or Playwright run.
