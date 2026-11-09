'use client';
import {useState} from 'react';
import {learningPathLessons,learningPathTracks,learningPhases} from '@/lib/learning-path';
import type {ReadingRecord} from '@/lib/progress';
import '@/app/learning-path.css';

export function LessonPhases({hasExercise}:{hasExercise:boolean}){
 return <nav className="lesson-phases" aria-label="Four learning phases">{learningPhases.map((phase,index)=><a key={phase.id} href={'#'+(phase.id==='build'&&!hasExercise?'lesson-practice':phase.anchor)}><span aria-hidden="true">0{index+1}</span><div><strong>{phase.title}</strong><small>{phase.action}</small></div></a>)}</nav>;
}

export default function LearningPathShelf({records,open,browse}:{records:Record<string,ReadingRecord>;open:(id:string)=>void;browse:()=>void}){
 const [track,setTrack]=useState('javascript');
 const lesson=learningPathLessons.find(item=>item.id==='guide-path-'+track);
 const read=learningPathLessons.filter(item=>records[item.id]?.readAt).length;
 return <section className="card learning-path-shelf"><span className="eyebrow">REAL LIFE → CODE → EXPLANATION</span><h3>A four-phase path through each technology</h3><p>Choose a technology, follow a concrete example, then build and explain a small variation. All phases stay available.</p>
  <ol className="learning-path-phases">{learningPhases.map(phase=><li key={phase.id}><strong>{phase.title}</strong><span>{phase.action}</span></li>)}</ol>
  <label className="learning-path-select">Choose a technology<select value={track} onChange={e=>setTrack(e.target.value)}>{learningPathTracks.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
  {lesson&&<article className="learning-path-preview"><span className="mini-tag">{lesson.topic} · {lesson.minutes} min</span><h4>{lesson.title}</h4><p>{lesson.useWhen}</p><div className="button-row"><button className="primary" onClick={()=>open(lesson.id)}>{records[lesson.id]?.readAt?'Revisit example':'Start the four phases'}</button>{lesson.resource&&<a className="secondary" href={lesson.resource} target="_blank" rel="noopener noreferrer">Official reference ↗</a>}<button className="secondary" onClick={browse}>Browse all {learningPathLessons.length} lessons</button></div></article>}
  <p>{read} / {learningPathLessons.length} lessons marked read. Reading does not mark an exercise solved.</p><small>Flows are illustrated models. Run the examples in the appropriate runtime; this reader does not execute or grade them.</small>
 </section>;
}
