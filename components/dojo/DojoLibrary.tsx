'use client';
import {dojoChallenges} from '@/lib/dojo';
import {levels, nextSection, orderedCases, statusOf, type Section} from '@/lib/dojo-course';
import {failureRecord} from '@/lib/dojo-sim';
import {routePage, updateRouteQuery,useRouteQuery} from '@/lib/workspace-location';
import {saveFile,useStudio} from '../studio/StudioContext';
import Pagination from '../Pagination';

type Props={open:(id:string,section?:Section)=>void};
const descriptions:Record<string,string>={
  Architecture:'Trace requests, load and failure across services.',
  GenAI:'Follow evidence from ingestion to model output.',
  Database:'Protect data invariants under updates and concurrency.',
  API:'Define contracts that survive retries and partial failures.',
  Algorithms:'Test a strategy against edge cases and growth.',
  LLD:'Give each object a responsibility and protect its invariants.',
};

export default function DojoLibrary({open}:Props) {
  const {get}=useStudio();
  const query=useRouteQuery();
  const track=query.get('track')||'All',level=query.get('level')||'All';
  const status=query.get('status')||'All',search=query.get('search')||'';
  const tracks=Array.from(new Set(dojoChallenges.map(c=>c.track)));
  const rows=orderedCases(dojoChallenges).map(c=>{
    const id='dojo-'+c.id,design=get(id),experiment=get(failureRecord(id));
    return {c,design,experiment,status:statusOf(design,experiment)};
  });
  const visible=rows.filter(row=>(track==='All'||row.c.track===track) &&
    (level==='All'||row.c.level===level) && (status==='All'||row.status===status) &&
    (row.c.title+' '+row.c.concept+' '+row.c.brief).toLowerCase().includes(search.trim().toLowerCase()));
  const perPage=6;
  const page=Math.min(routePage(query.get('page')),Math.max(1,Math.ceil(visible.length/perPage)));
  const completed=rows.filter(r=>r.status==='Self-reviewed');
  const inProgress=rows.filter(r=>r.status==='In progress').sort((a,b)=>
    [b.design.updatedAt,b.experiment.updatedAt].sort().at(-1)!.localeCompare([a.design.updatedAt,a.experiment.updatedAt].sort().at(-1)!));
  const next=inProgress[0]||rows.find(r=>r.status==='New');
  const filter=(values:Record<string,string|null>,replace=false)=>updateRouteQuery({...values,page:null},replace);
  function exportPortfolio(){
    const entries=completed.map(({c,design,experiment})=>[
      '## '+c.title,c.track+' · '+c.level,c.brief,'### My evidence',design.fields.evidence,
      '### Design decision',design.fields.decision||'No separate decision note.',
      '### Failure explored',c.failure,experiment.attempts.length+' recorded model runs.',
    ].join('\n\n'));
    saveFile('quest90-dojo-portfolio.md','# My Dojo portfolio\n\nSelf-reviewed design practice.\n\n'+entries.join('\n\n'));
  }
  return <div className="dojo">
    <section className="card dojo-hero">
      <span className="eyebrow">DESIGN DOJO</span><h2>From a brief to a design you can defend.</h2>
      <p>Choose a case, draw the system, test a failure, then explain your decision as you would in an interview.</p>
      <div className="dojo-metrics"><span><b>{rows.length}</b> cases</span><span><b>{tracks.length}</b> tracks</span><span><b>{completed.length}</b> self-reviewed</span><span><b>{inProgress.length}</b> in progress</span></div>
      <progress value={completed.length} max={rows.length} aria-label="Self-reviewed cases"/>
      <div className="button-row">{next&&<button className="primary" onClick={()=>open(next.c.id,nextSection(next.design,next.experiment))}>{next.status==='In progress'?'Resume':'Start'}: {next.c.title} →</button>}
      <button className="secondary" disabled={!completed.length} onClick={exportPortfolio}>Export reviewed portfolio</button></div>
    </section>
    <h3>Choose a training track</h3>
    <div className="dojo-track-grid">{tracks.map(t=>{
      const cases=rows.filter(r=>r.c.track===t),n=cases.filter(r=>r.status==='Self-reviewed').length;
      return <button className="dojo-track" key={t} aria-pressed={track===t} onClick={()=>filter({track:track===t?null:t,level:null,status:null,search:null})}><strong>{t}</strong><span>{descriptions[t]}</span><small>{n}/{cases.length} reviewed</small></button>;
    })}</div>
    <div className="dojo-filters">
      <label>Track<select value={track} onChange={e=>filter({track:e.target.value})}>{['All',...tracks].map(t=><option key={t}>{t}</option>)}</select></label>
      <label>Difficulty<select value={level} onChange={e=>filter({level:e.target.value})}>{['All',...levels].map(t=><option key={t}>{t}</option>)}</select></label>
      <label>Progress<select value={status} onChange={e=>filter({status:e.target.value})}>{['All','New','In progress','Self-reviewed'].map(t=><option key={t}>{t}</option>)}</select></label>
      <label>Search cases<input type="search" value={search} onChange={e=>filter({search:e.target.value},true)} placeholder="Try retries or cache"/></label>
    </div>
    {query.get('challenge')&&<p role="status">That challenge was not found. Choose a case below.</p>}
    <div className="dojo-result-line"><strong>{visible.length} matching cases</strong><button className="text-btn" onClick={()=>filter({track:null,level:null,status:null,search:null,challenge:null})}>Reset filters</button></div>
    <div className="dojo-grid">{visible.slice((page-1)*perPage,page*perPage).map(({c,status,design,experiment})=>
      <article className="card" key={c.id}><span className="mini-tag">{c.track} · {c.level}</span><h3>{c.title}</h3><p>{c.brief}</p><small>{status}</small>
        <button className="secondary" onClick={()=>open(c.id,status==='In progress'?nextSection(design,experiment):'Lesson')}>{status==='In progress'?'Resume':'Open case'} →</button></article>
    )}</div>
    {!visible.length&&<p>Try another search term or reset the filters.</p>}
    {visible.length>0&&<Pagination label="Dojo cases" page={page} pageSize={perPage} total={visible.length} onChange={n=>{updateRouteQuery({page:n});document.querySelector('.dojo-filters')?.scrollIntoView({block:'start'})}}/>}
  </div>;
}
