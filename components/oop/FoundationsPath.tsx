'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {ArrowLeft,ArrowRight,BookOpen} from 'lucide-react';
import {foundationLessons} from '@/lib/oop-foundations/lessons';
import type {FoundationLesson} from '@/lib/oop-foundations/types';
import {navigateWorkspace,useRouteQuery} from '@/lib/workspace-location';
import type {Progress} from '@/lib/progress';
import FoundationPlayer from './FoundationPlayer';
import IdempotencyLab from './IdempotencyLab';
import MemoryPractice from './MemoryPractice';

function FoundationCheck({lesson}:{lesson:FoundationLesson}){
  const [choice,setChoice]=useState(''),[checked,setChecked]=useState(false);
  const answer=lesson.question.options.find(option=>option.id===choice);
  return <section className="oop-knowledge-check">
    <h3>Try the idea before reading the answer</h3>
    <fieldset><legend>{lesson.question.prompt}</legend>{lesson.question.options.map(option=><label key={option.id} className={choice===option.id?'selected':''}><input type="radio" name={'foundation-'+lesson.id} value={option.id} checked={choice===option.id} onChange={()=>{setChoice(option.id);setChecked(false)}}/><span>{option.label}</span></label>)}</fieldset>
    <button className="primary" type="button" disabled={!choice} onClick={()=>setChecked(true)}>Check my reasoning</button>
    <div role="status" className="oop-quiz-feedback">{checked&&answer&&<><strong>{answer.correct?'That fits this scenario.':'Try another way of thinking.'}</strong><p>{answer.feedback}</p></>}</div>
    <small>This knowledge check is session-only. Save your own explanation below to keep it.</small>
  </section>;
}

export default function FoundationsPath({p,commit,renderAnswer}:{p:Progress;commit?:(p:Progress)=>void;renderAnswer:(lesson:FoundationLesson)=>ReactNode}){
  const query=useRouteQuery();
  const current=foundationLessons.find(lesson=>lesson.id===query.get('foundation'))||foundationLessons[0];
  const index=foundationLessons.indexOf(current);
  const [search,setSearch]=useState('');
  const heading=useRef<HTMLHeadingElement>(null);
  const pendingFocus=useRef(false);
  useEffect(()=>{if(pendingFocus.current){heading.current?.focus();pendingFocus.current=false}},[current.id]);
  const matching=foundationLessons.filter(lesson=>(lesson.title+' '+lesson.category+' '+lesson.definition).toLowerCase().includes(search.toLowerCase()));
  const attempted=foundationLessons.filter(lesson=>p.oop?.['basics-'+lesson.id]?.attempts.length).length;
  function choose(id:string){
    const next=new URLSearchParams(window.location.search);next.set('mode','basics');next.set('foundation',id);
    pendingFocus.current=current.id!==id;navigateWorkspace('/oop/?'+next.toString());
  }
  return <div className="foundations-path">
    <section className="card foundation-intro"><div><span className="eyebrow">START HERE · SMALL IDEAS, STRONG FOUNDATIONS</span><h2>From “what is it?” to “I can explain it.”</h2><p>Read the idea, watch its flow, predict a change, then explain it using your own example.</p></div><div className="foundation-count"><BookOpen aria-hidden="true"/><strong>{attempted}/{foundationLessons.length}</strong><span>lessons with a saved attempt</span></div></section>
    <div className="foundation-layout">
      <nav className="card foundation-nav" aria-label="Beginner topic lessons">
        <label>Find a base topic<input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Constructor, generics, retry…"/></label>
        {(['Object basics','Types & contracts','Reliable APIs'] as const).map(category=><div key={category}><h3>{category}</h3>{matching.filter(lesson=>lesson.category===category).map(lesson=><button type="button" key={lesson.id} aria-current={current.id===lesson.id?'page':undefined} onClick={()=>choose(lesson.id)}><span>{lesson.title}</span>{p.oop?.['basics-'+lesson.id]?.attempts.length?<small>Attempt saved</small>:null}</button>)}</div>)}
        {!matching.length&&<p>No matching lesson. Try a shorter keyword.</p>}
      </nav>
      <div className="foundation-body">
        <article className="card" aria-labelledby="foundation-topic-title">
          <span className="eyebrow">{current.category} · LESSON {index+1} OF {foundationLessons.length}</span>
          <h2 id="foundation-topic-title" ref={heading} tabIndex={-1}>{current.title}</h2>
          <p className="foundation-definition">{current.definition}</p>
          <div className="foundation-why"><div><h3>Why learn it?</h3><p>{current.why}</p></div><div><h3>When would I use it?</h3><p>{current.when}</p></div></div>
          <aside className="oop-analogy"><strong>Picture it in real life</strong><p>{current.analogy.story}</p><small><strong>Where the analogy stops:</strong> {current.analogy.limit}</small></aside>
          <FoundationPlayer key={current.id} lesson={current}/>
          {current.id==='idempotency'&&<IdempotencyLab/>}
          <div className="foundation-takeaway"><strong>Remember this</strong><p>{current.takeaway}</p></div>
          <aside className="oop-pitfall"><strong>Common trap</strong><p>{current.pitfall}</p></aside>
          <FoundationCheck key={current.id+'-check'} lesson={current}/>
          <details><summary>How to answer in an interview</summary><p>{current.interviewAnswer}</p><p>Now try: define it in one sentence → give the example → explain one limitation.</p></details>
          <details><summary>Read the official references</summary><ul>{current.sources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗<span className="foundation-sr"> (opens in a new tab)</span></a></li>)}</ul></details>
        </article>
        {commit&&<MemoryPractice key={current.id} lesson={current} p={p} commit={commit}/>}
        {renderAnswer(current)}
        <nav className="foundation-pagination" aria-label="Beginner lesson pages"><button type="button" className="secondary" disabled={index===0} onClick={()=>choose(foundationLessons[index-1].id)}><ArrowLeft size={16}/>Previous topic</button><span>{index+1} / {foundationLessons.length}</span><button type="button" className="primary" disabled={index===foundationLessons.length-1} onClick={()=>choose(foundationLessons[index+1].id)}>Next topic<ArrowRight size={16}/></button></nav>
      </div>
    </div>
  </div>;
}
