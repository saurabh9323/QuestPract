# Challenges from submitted course days

Open **Practice → My challenges**, or use the available-challenges button on Today.

## Eligibility

A course day qualifies when it has a recorded checklist completion (`completedAt`), a complete session submission, or a partial submission containing actual steps, answer text, or notes. A draft alone, a not-started submission, or a time entry without learning work does not qualify. A day counts once even if submitted repeatedly. Future-dated records are not used before their recorded date.

The legacy checklist-completion fallback retains support for earlier course records. It does not claim that every assigned coding answer was independently verified. Source days with partial work are labeled accordingly.

## Three schedules

| Schedule | Unlocks with | Source pool | Round | Refresh |
|---|---:|---|---|---|
| Daily | 1 submitted day | Latest submitted day | Concept, assigned DSA, spoken explanation | Every calendar day |
| Alternate-day | 2 submitted days | Latest two submitted days | DSA, concept, build, explanation | Every 2 calendar days |
| Weekly | 7 submitted days | Latest seven submitted days | Seven questions covering every source day | Every 7 calendar days |

Each schedule is anchored to the calendar date on which enough distinct days first qualified, using the browser's local calendar. For example, if Days 1–10 were submitted on September 20–29, the September 29 daily round uses Day 10, alternate-day uses Days 9–10, and weekly uses Days 4–10. No Day 11 content is introduced. Later submissions can update a round only before it is started.

The question pool comes from those days' authored course questions, missions, assigned DSA questions and speaking context. This is revision practice, so known questions can recur. DSA follow-up focus rotates across periods; weekly question roles rotate. It is not an AI question generator or an unseen-question guarantee.

## Saving and review

Starting a round freezes its source days, question text, hints, rubrics and scheduling window in a `progress-challenge-*` Studio record. The same record resumes after navigation or reload. Questions do not move when additional course work is submitted. Older unfinished rounds remain accessible from Saved rounds.

Draft answers autosave through the existing account sync. Submit permits partial work, retains an immutable attempt, and records answered count, hint count and elapsed time. Timing includes time away, does not block late submissions and never auto-submits. A fresh retry retains the original questions and all previous attempts. Ratings are self-reported, not an automatic pass score; code is not executed here.

After submission, reference reasoning is available and a question can be added to the existing Mistake notebook for tomorrow. Existing notes are never overwritten by this shortcut. Copy round for review produces a prompt without sending a message externally.

All challenge work stays separate from course completion, start-date locks and task deadlines. Missing a round does not add course overdue tasks. No database migration or progress reset is required.

Validation covers eligibility, date windows, submitted-day-only question selection, stable snapshots, and compatibility with the existing progress format. Live browser appearance, deployment and Supabase round trips require separate verification.
