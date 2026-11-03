import type {Progress} from '@/lib/progress';
import {insideProgress} from '@/lib/inside-app/progress';
export default function InsideAppProgress({p}:{p:Progress}){
  const progress=insideProgress(p.studio);
  return <section className="card inside-analytics"><div><span className="eyebrow">INSIDE A REAL APP · LEARNING EVIDENCE</span><h2>Predict it. Investigate it. Explain it.</h2><p>{progress.scenarios}/7 cinema scenarios reflected on · {progress.predictions} predictions · {progress.investigations} investigated attempts · {progress.explanations} explanations.</p><small>Counts come from explicitly saved reflections, not opened pages or recovered drafts. They are separate from course completion and interview readiness.</small></div><a className="secondary" href="/inside-app/">Continue the cinema journey →</a></section>;
}
