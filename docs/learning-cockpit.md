# Learning cockpit

All authenticated workspace pages share a learning cockpit. Existing canonical URLs and query links are retained.

- Find anything (Ctrl/Command K): search workspace pages, interview guides, 90 course missions, and question-bank titles/topics. Results show their destination URLs. Search displays the first 30 matches and supports multiple words, keyboard tab navigation, Enter, Escape, and opening links in another tab.
- Course constellation: selectable chapters with actual completion counts and native progress indicators; every day links to its existing route. No new mastery scores are inferred.
- Connect this session: page-specific links between reading, visual practice, question solving, communication, and revision. These are navigation suggestions, not generated coaching.
- Focus: hide the sidebar on every workspace page; exit using the cockpit or Escape. On daily quests the existing detailed focus layout is retained.
- Motion: decorative orbit and beacon animation are opt-in and stored only as a browser display preference. System reduced-motion preferences override animation. Hover and entrance transitions also respect reduced motion.

No progress records or database schemas are changed. This is a shared interface upgrade, not a rewrite of each lesson's content. No claim of worldwide uniqueness is made.

Verification: TypeScript and route/catalog integrity checks; no production build or Playwright run.
