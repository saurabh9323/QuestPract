# Discovery inbox and language foundations

`/discovery/` provides account-private pending/accepted/discarded shelves, source links and retrieval dates, daily/request counts, exact normalized-question duplicate suppression, retries and pagination. Accepted material stays on the personal question shelf, separate from the curated shared bank. All items remain labelled AI content.

Enable daily discovery to queue one rotating topic per India calendar day **while this page is open**. Manual checks allow one request per topic/day. This is not a deployed background scheduler; no closed-browser daily execution is claimed. Up to 400 review records and the existing global progress limits apply. Existing Gemini quotas and authentication apply. Never expose a Gemini key in the client.

The updated auto-coach function fetches fixed official pages for React, Next.js, JavaScript, Node.js, PostgreSQL, MongoDB, DSA, Python, .NET, AWS, Docker and system design. It follows no redirects and uses existing byte/time limits. A bounded excerpt informs one draft. This is not a general web search; it may miss updates and may return fundamentals instead of news. Source retrieval does not verify every generated claim. Unsourced responses cannot be accepted. A user must inspect the source before accepting. This does not upgrade project dependencies.

Deployment required: redeploy the existing `auto-coach` Edge Function to activate new source mappings, using the existing server secrets and allowed origins. Frontend source changes alone cannot update the deployed function. No new secret is needed. Example from repo: `npx.cmd supabase functions deploy auto-coach --project-ref xavuhmunsmiknusfskwr --no-verify-jwt` (handler retains explicit authenticated-user validation). No new DB migration is needed.

DSA Pattern Lab now has a language foundations panel with equivalent array traversal in C, C++, JavaScript, Java and Python. Reference-only examples, not five-language execution or translations of all patterns.

Checks: typecheck and focused discovery tests. Live Gemini, browser visual checks, provider quotas and cloud sync not verified. No automatic backend deployment or Git push performed by this change.
