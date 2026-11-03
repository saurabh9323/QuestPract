'use client';
import {useEffect,useState,type MouseEvent} from 'react';
import {BookOpen,GitBranch,ArrowRight,Play,Pause,ChevronLeft,ChevronRight,Download} from 'lucide-react';
import {fundamentalTracks,trackQuestions,fundamentalsMarkdown} from '@/lib/fundamentals';
import {commonFoundations} from '@/lib/fundamentals/common';
import {fundamentalProgress,fundamentalRecord} from '@/lib/fundamentals/progress';
import {fundamentalTutorContext} from '@/lib/fundamentals/tutor';
import type {FundamentalTrack,FundamentalQuestion,FundamentalConcept} from '@/lib/fundamentals/types';
import {navigateWorkspace,useWorkspaceLocation,updateRouteQuery,routePage} from '@/lib/workspace-location';
import {useStudio,Field,saveFile} from '../studio/StudioContext';
import Pagination from '../Pagination';

function follow(e:MouseEvent<HTMLAnchorElement>,url:string){if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();navigateWorkspace(url);window.scrollTo({top:0,behavior:'auto'})}
const href=(id:string)=>`/fundamentals/${id}/`;

function RuntimeWalkthrough({track}:{track:FundamentalTrack}){
 const [step,setStep]=useState(0),[playing,setPlaying]=useState(false);
 useEffect(()=>{if(!playing)return;const timer=setTimeout(()=>{if(step<track.runtime.length-1)setStep(step+1);if(step>=track.runtime.length-2)setPlaying(false)},2200);return()=>clearTimeout(timer)},[playing,step,track.runtime.length]);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const stop=()=>{if(media.matches)setPlaying(false)};media.addEventListener('change',stop);return()=>media.removeEventListener('change',stop)},[]);
 return <section className="card fundamentals-runtime" aria-label={`${track.name} execution model`}>
  <span className="eyebrow">UNDER THE HOOD · CONCEPTUAL MODEL</span><h2>How {track.name} work reaches execution</h2>
  <p>This is an explanatory walkthrough, not a live compiler, debugger or thread scheduler. Exact internals depend on the implementation and version.</p>
  <ol className="fundamentals-flow">{track.runtime.map((stage,i)=><li key={i}><button aria-current={step===i?'step':undefined} onClick={()=>{setPlaying(false);setStep(i)}}><span>{String(i+1).padStart(2,'0')}</span>{stage}</button>{i<track.runtime.length-1&&<ArrowRight aria-hidden="true" size={18}/>}</li>)}</ol>
  <div className="fundamentals-actions"><button className="secondary" onClick={()=>{setPlaying(false);setStep(n=>Math.max(0,n-1))}} disabled={!step}><ChevronLeft size={16}/> Previous stage</button><button className="secondary" onClick={()=>{if(playing)setPlaying(false);else{if(step===track.runtime.length-1)setStep(0);setPlaying(true)}}}>{playing?<Pause size={16}/>:<Play size={16}/>} {playing?'Pause':'Play walkthrough'}</button><button className="secondary" disabled={step===track.runtime.length-1} onClick={()=>{setPlaying(false);setStep(n=>n+1)}}>Next stage <ChevronRight size={16}/></button></div>
  <p role="status"><strong>Stage {step+1}:</strong> {track.runtime[step]}</p>
  <div className="fundamentals-thread"><GitBranch size={22} aria-hidden="true"/><div><h3>What about threads and async?</h3><p>{track.threading}</p></div></div>
 </section>;
}

function CommonGround(){
 const [left,setLeft]=useState('javascript'),[right,setRight]=useState('python');
 return <div className="fundamentals-common"><div className="card"><span className="eyebrow">LEARN ONCE · COMPARE CAREFULLY</span><h2>What carries across technologies?</h2><p>Use these questions when you move to a new stack. Similar words can describe different behavior; always name the runtime and the boundary.</p></div>
 <div className="fundamentals-grid">{commonFoundations.map(c=><article className="card" key={c.title}><h3>{c.title}</h3><p>{c.idea}</p><p>{c.example}</p><blockquote>{c.question}</blockquote><div className="fundamentals-actions">{c.tracks.map(id=>{const t=fundamentalTracks.find(t=>t.id===id)!;return <a key={id} href={href(id)} onClick={e=>follow(e,href(id))}>{t.name} ↗</a>})}</div></article>)}</div>
 <section className="card"><h2>Compare two execution models</h2><div className="fundamentals-compare">{[[left,setLeft],[right,setRight]].map(([value,set],i)=>{const id=value as string,setter=set as (v:string)=>void,t=fundamentalTracks.find(t=>t.id===id)!;return <article key={i}><label>Technology {i+1}<select value={id} onChange={e=>setter(e.target.value)}>{fundamentalTracks.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><p><strong>{t.kind}</strong> · {t.summary}</p><ol>{t.runtime.map(s=><li key={s}>{s}</li>)}</ol><h3>Concurrency</h3><p>{t.threading}</p></article>})}</div></section></div>;
}

function QuestionCard({track,q,concept}:{track:FundamentalTrack;q:FundamentalQuestion;concept:FundamentalConcept}){
 const {get,patch}=useStudio(),id=fundamentalRecord(track.id,concept.id),record=get(id),rating=record.fields[`rating_${q.lens}`]||'';
 const [revealed,setRevealed]=useState(false);
 const context=fundamentalTutorContext(track,concept,q,record.fields[`answer_${q.lens}`]||'');
 function ask(){window.dispatchEvent(new CustomEvent('quest90:question-help',{detail:{id:q.id,title:`${track.name}: ${concept.title}`,context:context.text,prompt:'Ask me one follow-up about this concept. Wait for my answer. Help me improve clarity and correctness without inventing project experience. The example is illustrative, not a verified execution.'}}))}
 return <article className="card fundamental-question" id={q.id}>
  <div className="fundamentals-question-meta"><span className="eyebrow">{concept.category} · {q.lens}</span><span>{concept.title}</span></div><h3>{q.question}</h3>
  <details><summary>Try my answer first</summary><Field id={id} name={`answer_${q.lens}`} label={`My ${q.lens.toLowerCase()} answer: ${concept.title}`} placeholder="Definition → why it matters → a real example → one limitation. Use your own words." rows={4}/></details>
  <button className="secondary" aria-expanded={revealed} aria-controls={`answer-${q.id}`} onClick={()=>setRevealed(v=>!v)}>{revealed?'Hide answer':'Reveal answer & example'}</button>
  {revealed&&<div id={`answer-${q.id}`} className="fundamentals-answer"><p className="fundamentals-direct">{q.answer}</p>
   <h4>Make it concrete</h4><p>{concept.example}</p><pre><code>{concept.code}</code></pre><p><strong>Expected behavior:</strong> {concept.output}</p><small>Illustrative snippet; setup may be required. This guide does not run or judge code.</small>
   <details><summary>Explain the background execution</summary><p>{concept.execution}</p><p><strong>Concurrency in {track.name}:</strong> {track.threading}</p></details>
   <p><strong>Watch out:</strong> {concept.pitfall}</p><div className="fundamentals-practice"><strong>Change one thing and investigate</strong><p>{concept.exercise}</p></div>
  </div>}
  <div className="fundamentals-actions"><button className={rating==='revise'?'primary':'secondary'} aria-pressed={rating==='revise'} onClick={()=>patch(id,{[`rating_${q.lens}`]:'revise'})}>Needs revision</button><button className={rating==='ready'?'primary':'secondary'} aria-pressed={rating==='ready'} onClick={()=>patch(id,{[`rating_${q.lens}`]:'ready'})}>I can explain this</button>{rating&&<button className="secondary" onClick={()=>patch(id,{[`rating_${q.lens}`]:''})}>Clear rating</button>}<button className="secondary" onClick={ask}>Practise with tutor</button><a href={`/commute/?lesson=guide-fundamentals-${track.id}-${concept.id}`} onClick={e=>follow(e,`/commute/?lesson=guide-fundamentals-${track.id}-${concept.id}`)}>Read in Commute ↗</a></div>
  {context.trimmed&&<small>Tutor context trimmed to fit the existing 1,600-character topic limit. The draft excerpt includes up to 500 characters. Review the prepared message before sending.</small>}
  <details><summary>My notes for {concept.title}</summary><Field id={id} name="notes" label={`Notes: ${concept.title}`} rows={3}/></details>
 </article>;
}

function TrackGuide({track,url}:{track:FundamentalTrack;url:URL}){
 const {p,get}=useStudio(),stats=fundamentalProgress(track,p.studio),params=url.searchParams;
 const search=params.get('q')||'',concept=params.get('concept')||'',filter=params.get('filter')||'all',lens=params.get('lens')||'all';
 const questions=trackQuestions(track).filter(q=>{
  const c=track.concepts.find(c=>c.id===q.conceptId)!,rating=get(fundamentalRecord(track.id,c.id)).fields[`rating_${q.lens}`];
  return (!concept||c.id===concept)&&(lens==='all'||q.lens===lens)&&(filter==='all'||rating===filter)&&`${q.question} ${q.answer} ${c.title} ${c.category}`.toLowerCase().includes(search.toLowerCase());
 });
 const pageSize=5,page=Math.min(routePage(params.get('page')),Math.max(1,Math.ceil(questions.length/pageSize)));
 function choose(values:Record<string,string|null>){updateRouteQuery({...values,page:null})}
 const reset=()=>choose({q:null,concept:null,filter:null,lens:null});
 return <>
 <div className="card fundamentals-intro"><span className="eyebrow">{track.kind} · CORE INTERVIEW PREPARATION</span><h2>{track.name}, from the foundations up</h2><p>{track.summary}</p><p><strong>20 concepts × 5 interview angles = 100 questions.</strong> Start with Explain, then work towards tracing execution and diagnosing mistakes.</p><progress aria-label={`${track.name} self-rated readiness`} value={stats.ready} max={stats.total}/><p>{stats.ready}/100 can explain · {stats.revise} need revision · {stats.attempted} written answers. These are self-assessments, not tested mastery or completed course days.</p><div className="fundamentals-actions"><button className="secondary" onClick={()=>saveFile(`${track.id}-fundamentals.md`,fundamentalsMarkdown(track))}><Download size={16}/> Download study guide</button><button className="secondary" onClick={()=>choose({filter:'revise',concept:null,q:null,lens:null})}>Review my weak areas</button></div></div>
 <details className="card"><summary>Runtime, compilation and threading walkthrough</summary><RuntimeWalkthrough key={track.id} track={track}/></details>
 <details className="card"><summary>Browse all 20 core concepts</summary><div className="fundamentals-concepts">{track.concepts.map((c,i)=><button className="secondary" key={c.id} onClick={()=>choose({concept:c.id,filter:null,q:null,lens:null})}><small>{String(i+1).padStart(2,'0')} · {c.category}</small><strong>{c.title}</strong></button>)}</div></details>
 <div className="card fundamentals-filters"><label>Search this track<input type="search" value={search} placeholder="Try threads, memory, validation…" onChange={e=>{updateRouteQuery({q:e.target.value,page:null},true)}}/></label><label>Concept<select value={concept} onChange={e=>choose({concept:e.target.value||null})}><option value="">All 20 concepts</option>{track.concepts.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label><label>Interview angle<select value={lens} onChange={e=>choose({lens:e.target.value})}>{['all','Explain','Apply','Demonstrate','Trace','Diagnose'].map(v=><option key={v} value={v}>{v==='all'?'All five angles':v}</option>)}</select></label><label>Revision status<select value={filter} onChange={e=>choose({filter:e.target.value})}><option value="all">All questions</option><option value="revise">Needs revision</option><option value="ready">Can explain</option></select></label><button className="secondary" onClick={reset}>Reset filters</button></div>
 <div className="fundamentals-answer-frame"><strong>Answer in 60 seconds</strong><span>Define it <ArrowRight size={14}/> Explain why <ArrowRight size={14}/> Give an example <ArrowRight size={14}/> Mention a trade-off</span></div>
 {!questions.length&&<div className="card"><p>No questions match these filters. Mark an answer “Needs revision” to build your review list.</p><button className="secondary" onClick={reset}>Show all questions</button></div>}
 {questions.slice((page-1)*pageSize,page*pageSize).map(q=><QuestionCard key={q.id} track={track} q={q} concept={track.concepts.find(c=>c.id===q.conceptId)!}/>)}
 <Pagination page={page} pageSize={pageSize} total={questions.length} label={`${track.name} fundamentals`} onChange={n=>{updateRouteQuery({page:n});window.scrollTo({top:0,behavior:'auto'})}}/>
 <div className="card"><h3>Go deeper in the official documentation</h3><p>Examples describe the stated environment. Check the version used by your project before relying on a framework default.</p><ul>{track.sources.map(s=><li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label} ↗</a></li>)}</ul></div>
 </>;
}

export default function LanguageFundamentals(){
 const {p}=useStudio(),location=useWorkspaceLocation(),url=new URL(location,'https://quest90.local');
 const slug=url.pathname.split('/').filter(Boolean)[1],track=fundamentalTracks.find(t=>t.id===slug),common=url.searchParams.get('view')==='common';
 const [search,setSearch]=useState('');
 return <section className="language-fundamentals">
  <nav className="fundamentals-nav" aria-label="Fundamentals navigation"><a href="/fundamentals/" onClick={e=>follow(e,'/fundamentals/')} aria-current={!track&&!common?'page':undefined}><BookOpen size={17}/> All tracks</a><a href="/fundamentals/?view=common" onClick={e=>follow(e,'/fundamentals/?view=common')} aria-current={common?'page':undefined}>Common foundations</a><a href="/interview-materials/frontend-3plus/" onClick={e=>follow(e,'/interview-materials/frontend-3plus/')}>Frontend scenario round ↗</a></nav>
  {track?<TrackGuide key={track.id} track={track} url={url}/>:common?<CommonGround/>:<>
   <header className="card fundamentals-hero"><span className="eyebrow">LANGUAGE FUNDAMENTALS · YOUR INTERVIEW BASE</span><h2>Know what your code is doing.</h2><p>From the first value to the running system. Build a clear mental model, practise explaining it, and connect concepts across your stack.</p><div className="fundamentals-numbers"><span><strong>17</strong> technology tracks</span><span><strong>340</strong> core concepts</span><span><strong>1,700</strong> interview questions</span></div><p>Each concept has five questions with a shared worked example. Tracks distinguish languages, libraries, frameworks, runtimes, build tools and data systems.</p><label>Find your next track<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="JavaScript, C#, SQL, React…"/></label></header>
   <div className="fundamentals-grid">{fundamentalTracks.filter(t=>`${t.name} ${t.id} ${t.kind} ${t.summary}`.toLowerCase().includes(search.toLowerCase())).map(t=>{const stats=fundamentalProgress(t,p.studio);return <a href={href(t.id)} onClick={e=>follow(e,href(t.id))} className="card fundamentals-track" key={t.id}><span className="eyebrow">{t.kind}</span><h3>{t.name}</h3><p>{t.summary}</p><small>20 concepts · 100 questions · runtime & threads</small><progress aria-label={`${t.name} self-assessed progress`} value={stats.ready} max={stats.total}/><span>{stats.ready}/100 can explain</span><strong>Open fundamentals <ArrowRight size={16}/></strong></a>})}</div>
   {!fundamentalTracks.some(t=>`${t.name} ${t.id} ${t.kind} ${t.summary}`.toLowerCase().includes(search.toLowerCase()))&&<p>No track matches. Try a language or framework name.</p>}
  </>}
 </section>;
}
