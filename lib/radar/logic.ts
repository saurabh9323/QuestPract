import type { DeadlineChecklistItem, DeadlineCountdown, Opportunity } from './types';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Accept ISO dates and timezone-qualified ISO timestamps, without Date.parse's loose formats. */
export function isoDateMillis(value: string | undefined): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value)) return null;
  const day = value.slice(0, 10);
  const calendar = new Date(`${day}T00:00:00.000Z`);
  if (!Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== day) return null;
  const result = Date.parse(value);
  return Number.isFinite(result) ? result : null;
}

/** Highest fit first; equal scores retain the incoming order and never mutate the source. */
export function topOpportunities<T extends Opportunity>(items: readonly T[], limit = 5): T[] {
  const count = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0;
  return items.map((item, index) => ({ item, index }))
    .sort((a, b) => b.item.fitScore - a.item.fitScore || a.index - b.index)
    .slice(0, count)
    .map(({ item }) => item);
}

/** Uses the caller's clock so countdowns are deterministic and easy to refresh together. */
export function deadlineCountdown(deadline: string | undefined, now: Date): DeadlineCountdown {
  if (!deadline) return { status: 'missing', label: 'Registration deadline not listed', remainingMillis: null };
  const at = isoDateMillis(deadline);
  if (at === null || !Number.isFinite(now.getTime())) return { status: 'invalid', label: 'Registration deadline unavailable', remainingMillis: null };
  const remainingMillis = Math.max(0, at - now.getTime());
  if (remainingMillis === 0) return { status: 'closed', label: 'Registration closed', remainingMillis: 0 };
  const days = Math.floor(remainingMillis / DAY);
  const hours = Math.floor((remainingMillis % DAY) / HOUR);
  const minutes = Math.floor((remainingMillis % HOUR) / 60000);
  const label = days > 0 ? `${days}d ${hours}h left`
    : hours > 0 ? `${hours}h ${minutes}m left`
      : minutes > 0 ? `${minutes}m left` : 'Less than a minute left';
  return { status: remainingMillis <= 6 * HOUR ? 'urgent' : 'open', label, remainingMillis };
}

/** A suggested preparation plan anchored to registrationDeadline, not a submission schedule.
 * "due" means the suggested start time has arrived; it never means a task was completed.
 */
export function checklistFor(deadline: string | undefined, now: Date): DeadlineChecklistItem[] {
  const at = isoDateMillis(deadline);
  const current = now.getTime();
  if (at === null || !Number.isFinite(current)) return [];
  const plan = [
    { id: 'register-team', label: 'Register and find a team', offset: 7 * DAY },
    { id: 'scope-mvp', label: 'Scope your MVP', offset: 5 * DAY },
    { id: 'repo-stack', label: 'Set up the repo and stack', offset: 3 * DAY },
    { id: 'demo-video', label: 'Prepare a demo video', offset: 6 * HOUR },
    { id: 'readme', label: 'Write the README', offset: 6 * HOUR },
    { id: 'submit', label: 'Review submission requirements and submit when eligible', offset: 6 * HOUR },
  ] as const;
  return plan.map(({ id, label, offset }) => ({
    id,
    label,
    at: new Date(at - offset).toISOString(),
    status: current >= at ? 'closed' : current >= at - offset ? 'due' : 'upcoming',
  }));
}
