# Always-available Gemini tutor

The signed-in workspace now mounts a floating tutor on every page. The launcher opens a compact or expanded panel, with Escape/close controls and mobile sizing. The panel remains open across navigation and shows the new topic's conversation.

Requests use the existing `auto-coach` worker and server-side Gemini key. The `topic-chat` source is already supported by the Edge Function's conversational prompt. No secret is stored in the client and no new backend deployment is required for this interface.

Messages and drafts are saved in the existing studio records. Threads are keyed by pathname plus question, lesson or pack query identifiers. Selected question-bank entries supply their title and prompt; other pages supply page/mission context. The UI states this context explicitly. Three successful previous exchanges, truncated to 2,000 characters, accompany the latest message. No unrelated answers are collected.

Quick actions prepare editable prompts; sending remains explicit. Pending requests disable duplicate sends. Failed requests expose the existing backend error and can be retried with a new request ID. Existing Gemini quotas still apply. Each topic allows 40 messages and the storage guard preserves space for other records.

Replies offer copy controls, optional generated cartoon/code examples and follow-up exercises. AI text is rendered as text, not HTML. Drafts and pending jobs survive panel dismissal through the existing progress persistence. Successful cloud saving is reported by the existing sync indicator.

Also fixed the missing LearningCockpit mount: its component had been imported but was not rendered in the workspace.

Validation: TypeScript, shared request validator, distinct topic-key check. No live Gemini call, Playwright run or production build was performed.
