import type {Progress} from '@/lib/progress';
import {playgroundModules} from '@/lib/playground/modules';
export default function PlaygroundProgress({p}:{p:Progress}){
  const records=playgroundModules.map(m=>p.studio?.[`playground-${m.id}`]);
  const completed=records.filter(r=>r?.fields.completedAt).length;
  return <section className="card"><h2>Module Playground</h2><p><strong>{completed} / {playgroundModules.length}</strong> modules with a saved run passing all supplied tests · {records.reduce((n,r)=>n+(r?.attempts.length||0),0)} saved attempts · {Math.floor(records.reduce((n,r)=>n+Number(r?.fields.timeSeconds||0),0)/60)} active minutes</p><progress value={completed} max={playgroundModules.length} aria-label="Playground modules completed"/><p>Test-case completion, not a correctness proof or interview-readiness score.</p><a href="/playground/">Open Module Playground →</a></section>;
}
