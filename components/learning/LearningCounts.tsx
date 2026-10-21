import {learningCounts} from '@/lib/learning/analytics';
import type {Progress} from '@/lib/progress';
export default function LearningCounts({p}:{p:Progress}){
  const c=learningCounts(p.studio);
  return <section className="card"><h2>Learning workspace drafts</h2><p>{c.flow} flows · {c.module} modules · {c.stroke} drawings · {c.card} cards · {c.session} session plans</p><p>{c.aiDrafts} AI drafts awaiting your review. These are saved artifact counts, not mastery, correctness or readiness scores.</p>{c.invalid>0&&<p>{c.invalid} invalid records excluded.</p>}<a href="/playground/">Manage draft data & backups →</a></section>;
}
