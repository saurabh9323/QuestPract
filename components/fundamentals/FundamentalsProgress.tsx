import type {Progress} from '@/lib/progress';
import {fundamentalTracks} from '@/lib/fundamentals';
import {fundamentalProgress} from '@/lib/fundamentals/progress';
import {navigateWorkspace} from '@/lib/workspace-location';
export default function FundamentalsProgress({p}:{p:Progress}){
 const totals=fundamentalTracks.map(t=>({track:t,...fundamentalProgress(t,p.studio)}));
 const ready=totals.reduce((n,t)=>n+t.ready,0),revise=totals.reduce((n,t)=>n+t.revise,0),written=totals.reduce((n,t)=>n+t.attempted,0);
 return <section className="card language-fundamentals"><div><span className="eyebrow">FUNDAMENTALS · SELF-REVIEW</span><h2>Build explanations you can recall</h2><p>{ready}/1,700 marked “Can explain” · {revise} need revision · {written} written answers. These markers are separate from tested solutions and course completion.</p><progress aria-label="Fundamentals self-rated explanations" value={ready} max={1700}/></div><div className="fundamentals-actions"><a href="/fundamentals/" onClick={e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();navigateWorkspace('/fundamentals/');window.scrollTo(0,0)}}>Open Language Fundamentals →</a>{totals.filter(t=>t.revise).sort((a,b)=>b.revise-a.revise).slice(0,3).map(t=><a key={t.track.id} href={`/fundamentals/${t.track.id}/?filter=revise`} onClick={e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();navigateWorkspace(`/fundamentals/${t.track.id}/?filter=revise`);window.scrollTo(0,0)}}>{t.track.name}: {t.revise} to review</a>)}</div></section>;
}
