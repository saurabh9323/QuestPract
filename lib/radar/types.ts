export const OPPORTUNITY_SOURCES = ['devpost', 'mlh', 'devfolio', 'unstop', 'codeforces'] as const;
export type OpportunitySource = (typeof OPPORTUNITY_SOURCES)[number];
export type OpportunityMode = 'online' | 'offline' | 'hybrid';

export interface Opportunity {
  id: string;
  source: OpportunitySource;
  title: string;
  url: string;
  mode: OpportunityMode;
  location?: string;
  registrationDeadline?: string;
  startsAt?: string;
  endsAt?: string;
  prize?: string;
  tags: string[];
  fitScore: number;
}

export const TRACKING_STATUSES = ['new', 'interested', 'registered', 'building', 'submitted', 'skipped'] as const;
export const RADAR_CHECKLIST_IDS = ['register-team', 'scope-mvp', 'repo-stack', 'demo-video', 'readme', 'submit'] as const;
export type TrackingStatus = (typeof TRACKING_STATUSES)[number];
export interface Tracking {
  status: TrackingStatus;
  notes?: string;
}

export interface RadarRequestOptions {
  signal?: AbortSignal;
}

export interface RadarClientOptions {
  /** Optional fetch implementation for tests or a host-provided transport. */
  fetcher?: typeof fetch;
  /** Bounds the complete request, including reading its body; defaults to 10 seconds. */
  timeoutMs?: number;
}

export interface RadarClient {
  readonly mode: 'mock' | 'live';
  listOpportunities(options?: RadarRequestOptions): Promise<Opportunity[]>;
  updateTracking(id: string, tracking: Tracking, options?: RadarRequestOptions): Promise<Tracking>;
}

export interface DeadlineCountdown {
  status: 'missing' | 'invalid' | 'open' | 'urgent' | 'closed';
  label: string;
  remainingMillis: number | null;
}

export interface DeadlineChecklistItem {
  id: (typeof RADAR_CHECKLIST_IDS)[number];
  label: string;
  at: string;
  status: 'upcoming' | 'due' | 'closed';
}
