# SQL Expedition

Route: `/sql-game/`, available under Practice and from Module Playground / Flow Builder.

Ten missions cover projection, filters, DISTINCT, NULL, ordering/limits, joins, aggregation, HAVING, LEFT JOIN and dense ranking. Missions unlock sequentially after both datasets pass; earlier missions can be replayed. Failed queries do not remove prior completions. The rocket indicates the selected mission, not physical query execution.

Real SQLite runs in a disposable worker with an 8-second timeout, 10,000-character input limit, one statement, query-only database and 200-row output limit. Each test uses a fresh database. Reference queries and learner queries run separately. Ordered missions compare row order; other missions compare multisets, preserving duplicates. Column count and values matter; aliases do not. Passing these sample datasets is not a proof for every database.

Code drafts, hints, notes and attempts reuse StudioProvider/account synchronization. Unlocks derive from saved passed attempts. No secret keys or production SQL database are involved. SQLite is explicitly labelled; PostgreSQL syntax is not guaranteed.

Verification: five tests run the actual worker source with real SQLite, including all ten reference answers checked against independent base expectations, extra-fixture rejection, order/duplicate/column comparison, errors and write rejection. Browser layout and live account sync were not verified because browser access was blocked in this session. No production build performed.
