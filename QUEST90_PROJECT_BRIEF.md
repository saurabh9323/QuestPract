# Quest90 Project Brief

Quest90 is a private personal training app for a full-stack developer with 2.6 years of experience who wants to become interview ready in 90 days.

The app is built with Next.js and can run in guest mode or connect to Supabase. Guest mode stores progress in the browser. Supabase mode stores the learner's progress, answers, task changes, screenshots, and review dates in the learner's own account.

## Training Goal

After 90 days, the learner should be stronger at:

- DSA problem solving and explaining logic clearly.
- JavaScript, TypeScript, React, Next.js, Node.js, MongoDB, PostgreSQL, Python basics, AWS, CI/CD, testing, and debugging.
- System design for practical full-stack interviews.
- SQL reasoning and query writing.
- Behavioral and managerial interview answers.
- English communication, especially speaking with confidence, asking questions, and explaining technical decisions.

## Main Features

- Selectable course start date.
- Finalized course start date saved inside the Supabase progress payload.
- Supabase table columns for `course_start_date` and `course_start_lock_key`, with `course_start_locked_v1` preventing later date changes.
- Supabase email/password login plus email-link fallback.
- Dashboard status for days remaining, today's submitted minutes, overdue work, and recent constraints.
- 90-day timeline.
- 100 assigned DSA questions inside the 90 days.
- 1,000-question practice bank:
  - 300 DSA questions.
  - 400 interview questions.
  - 200 SQL questions.
  - 100 system design questions.
- Daily course quest with lesson, checklist, questions, hints, rubric, notes, and screenshots.
- Daily communication mission with script, real-world task, saved reflection, reply notes, and history.
- Communication and people-interaction practice appears as a managed daily task.
- ChatGPT mock interview room with technical, system design, behavioral, and English-confidence prompts.
- Smart schedule management for missed work, deferred tasks, planned breaks, and catch-up warnings.
- Saved answer attempts with older versions preserved.
- Manual ChatGPT review prompt for feedback when Codex is unavailable.
- Base64 screenshot storage with preview and delete support.
- Backup and restore for progress and media.

## Daily Rhythm

Each day should include:

1. Learn the course concept.
2. Solve the assigned DSA question.
3. Build or debug something small.
4. Explain the reasoning in interview style.
5. Complete one communication rep.
6. Submit the session and save notes.

Every ninth day has two DSA questions, which makes the 90-day total exactly 100 assigned DSA questions.

## Communication Training

The communication path repeats a 15-day ladder six times:

- Private explanation.
- Debug explanation.
- Written standup.
- Voice note.
- Peer message.
- Feedback request.
- Respectful disagreement.
- Follow-up questions.
- Public learning note.
- Helpful public comment.
- Simple stranger interaction.
- Professional self-introduction.
- Mock interviewer interruption.
- STAR story.
- Role introduction.

The goal is not perfect English. The goal is clearer, calmer, more confident communication.

## Supabase Setup

The browser app must use:

- Supabase project URL, like `https://your-project.supabase.co`
- Supabase publishable key or legacy anon key
- Supabase Auth with email/password enabled if password login is desired

The raw PostgreSQL connection string must stay private and should never be pasted into the public app UI or committed to source code.

Passwords are handled by Supabase Auth. Quest90 never stores a password in the progress JSON or screenshot tables.

Run `public/supabase-setup.sql` once in the Supabase SQL Editor. It creates:

- `public.training_state` for progress JSON.
- `public.training_images` for screenshot records.
- Row-level security so authenticated users can access only their own records.
- `public.save_training_state` with revision checks to avoid silent overwrite conflicts.

## ChatGPT Handoff

The app cannot directly connect to a personal ChatGPT account. It supports a manual workflow:

1. Attempt the question inside Quest90.
2. Click the ChatGPT review option.
3. Copy the prepared prompt.
4. Paste it into ChatGPT.
5. Bring the feedback back into Quest90.
6. Save a checkpoint after testing or revising the answer.

This keeps the learner in control and avoids sending private data automatically.

## Current Product Direction

Quest90 should feel like a personal teacher and interview gym:

- Honest about missed work.
- Encouraging when ahead.
- Strict about submitted attempts before marking solved.
- Practical instead of motivational-only.
- Strong on revision, explanations, and evidence.
- Helpful for both technical skill and communication confidence.

## Authentication update

Quest90 should use Supabase Auth for email/password login. Do not store plain passwords in application tables. The SQL setup now includes public.user_profiles for username and user details, while Supabase Auth stores and verifies passwords securely. In Vercel, set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY so normal users see only the login/create-account form instead of setup fields.

