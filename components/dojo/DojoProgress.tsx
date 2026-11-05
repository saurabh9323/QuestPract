'use client';
import type {Progress} from '@/lib/progress';
import {blankStudio} from '@/lib/studio-state';
import {dojoChallenges} from '@/lib/dojo';
import {currentReview} from '@/lib/dojo-course';
import {failureRecord} from '@/lib/dojo-sim';

export default function DojoProgress({p}:{p:Progress}) {
  const rows=dojoChallenges.map(c=>{
    const id='dojo-'+c.id,design=p.studio?.[id]||blankStudio(),experiment=p.studio?.[failureRecord(id)]||blankStudio();
    return {c,design,experiment,reviewed:currentReview(design,experiment)};
  });
  const reviewed=rows.filter(r=>r.reviewed).length;
  const versions=rows.reduce((sum,r)=>sum+r.design.attempts.filter(a=>a.outcome==='Design checkpoint').length,0);
  const runs=rows.reduce((sum,r)=>sum+r.experiment.attempts.filter(a=>a.outcome.startsWith('Model experiment')).length,0);
  return <section className="card dojo dojo-progress-card">
    <span className="eyebrow">DESIGN PRACTICE</span><h2>Your Dojo progress</h2>
    <div className="dojo-metrics"><span><b>{reviewed}/{rows.length}</b> cases self-reviewed</span><span><b>{versions}</b> design checkpoints</span><span><b>{runs}</b> model experiments</span><span><b>{new Set(rows.filter(r=>r.reviewed).map(r=>r.c.track)).size}/6</b> tracks with a reviewed case</span></div>
    <p>These are saved practice records, not an interview-readiness score. Dojo completion is separate from your 90-day course.</p>
    <a href="/dojo/">Continue in Dojo →</a>
  </section>;
}
