# Interview and communication mode

Upgrades: three interviewer styles; project deep dive with explicit learner-supplied facts; rescue scenarios; concept/sentence/example help that preserves round and draft; per-question explanation, hint and visual actions; AI-generated supporting cartoons; saved first/latest answer comparison by round; and an explicit repeat-opening-question checkpoint that keeps the old session. Repeat next week manually—this does not create a scheduled reminder or an automatic weekly evaluation. Sentence-building mode supplies personalised sentence practice.

Current question text is reserved in the bounded request context so help exchanges do not immediately displace it. Round metadata is added to new turns; legacy transcripts stay intact. Model-generated comparisons are guidance rather than deterministic grammar annotations or hiring scores.

Question-bank entries also offer authored hints and prepared AI explanation/visual prompts through the floating tutor. Visuals are generated with the existing cartoon renderer and a text diagram request; no external diagrams or code are executed. Generation remains subject to the existing Gemini quota and may need review for accuracy.

Open Ask your tutor → Interview & communication. Choose a practice mode, topic/role, and English or Hinglish coaching. Start explicitly sends a Gemini request for one question.

The session progresses through question, feedback, optional retries, and next question. After five rounds the next action requests a review; learners may end earlier. Typed answers and pasted speaking transcripts are supported. There is no microphone recording or pronunciation assessment.

Seven modes: interview, rough words to clear English, sentence building, correction/retry, fading hints, real STAR stories, and mistake practice. Prompts request just two priority corrections, preserve facts, and separate language from technical correctness. This is AI instruction, not a deterministic guarantee of model behavior.

Studio records persist sessions, drafts, messages, mistake notes, and a story bank. Saved sessions can be resumed. New sessions do not include old session messages. Up to three recent exchanges and 2,000 characters reach the existing Gemini backend; end summaries have the same limit and may omit earlier work. Full transcripts remain available for copying. The UI discloses the context limit.

Mistake notes are user-maintained and included in requests. Stories are not sent unless pasted into an answer. Pending messages block duplicate sends; failed requests can be retried. Existing backend quotas apply and may prevent finishing all five rounds in a day. No new backend deployment or key is required.

Validation: TypeScript and diff checks passed. Live model behavior and browser interaction have not been verified. No production build, Playwright run, or new test file.
