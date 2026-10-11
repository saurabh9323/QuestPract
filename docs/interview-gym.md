# Interview and communication mode

Open Ask your tutor → Interview & communication. Choose a practice mode, topic/role, and English or Hinglish coaching. Start explicitly sends a Gemini request for one question.

The session progresses through question, feedback, optional retries, and next question. After five rounds the next action requests a review; learners may end earlier. Typed answers and pasted speaking transcripts are supported. There is no microphone recording or pronunciation assessment.

Seven modes: interview, rough words to clear English, sentence building, correction/retry, fading hints, real STAR stories, and mistake practice. Prompts request just two priority corrections, preserve facts, and separate language from technical correctness. This is AI instruction, not a deterministic guarantee of model behavior.

Studio records persist sessions, drafts, messages, mistake notes, and a story bank. Saved sessions can be resumed. New sessions do not include old session messages. Up to three recent exchanges and 2,000 characters reach the existing Gemini backend; end summaries have the same limit and may omit earlier work. Full transcripts remain available for copying. The UI discloses the context limit.

Mistake notes are user-maintained and included in requests. Stories are not sent unless pasted into an answer. Pending messages block duplicate sends; failed requests can be retried. Existing backend quotas apply and may prevent finishing all five rounds in a day. No new backend deployment or key is required.

Validation: TypeScript and diff checks passed. Live model behavior and browser interaction have not been verified. No production build, Playwright run, or new test file.
