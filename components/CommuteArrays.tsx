'use client';
import {arrayReadingPath,arrayReadingTracks} from '@/lib/commute-arrays';
import type {ReadingRecord} from '@/lib/progress';
import type {ReadingLesson} from '@/lib/commute-guides';
import {ComparisonLab} from './ArrayFoundations';

export function CommuteArrayPath({records,start,browse}:{records:Record<string,ReadingRecord>;start:(ids:string[])=>void;browse:()=>void}){
 return <section className="card commute-array-path"><span className="eyebrow">ARRAYS FROM ZERO · YOUR COMMUTE PATH</span><h3>Read it. Watch it. Explain it.</h3><p>All 60 worked examples from Array Foundations are here: 20 loops, 20 Set, 20 Map. Start with a short introduction, then read one example at a time. Each example has input, output, code, hints, costs and a visual reasoning flow.</p><div className="array-learning-route">{arrayReadingTracks.map(t=>{const ids=arrayReadingPath(t.id),read=ids.filter(id=>records[id]?.readAt).length;return <button className="secondary" key={t.id} onClick={()=>{const firstUnread=ids.findIndex(id=>!records[id]?.readAt);start(firstUnread<0?ids:ids.slice(firstUnread))}}><span aria-hidden="true">{t.emoji}</span><strong>{t.title}</strong><small>{read}/{ids.length} read · introduction + 20 examples</small><span>Continue reading →</span></button>})}</div><div className="reading-actions"><button className="primary" onClick={()=>start(['array-reading-compare'])}>Watch three approaches</button><button className="secondary" onClick={browse}>Browse all 64 array lessons</button></div><small>Read-aloud, larger text, bookmarks, notes and revision reminders are available inside each lesson. Reading progress is separate from solving progress.</small></section>;
}

export function CommuteArrayVisual({lesson,step}:{lesson:ReadingLesson;step:number}){
 if(!lesson.id.startsWith('array-reading-'))return null;
 if(lesson.id==='array-reading-compare')return <div className="adventure"><ComparisonLab/></div>;
 return <figure className="commute-array-visual"><figcaption>Follow the idea from input to answer</figcaption><div className="array-story-track" aria-hidden="true"><span style={{left:`${step/(lesson.steps.length-1)*100}%`}}>🎒</span></div><ol>{lesson.steps.map((s,i)=><li key={s.title} aria-current={i===step?'step':undefined}><strong>{i+1}. {s.title}</strong><pre>{s.state}</pre>{i<lesson.steps.length-1&&<span aria-hidden="true">↓</span>}</li>)}</ol><small>The moving marker follows the reading steps. This is an illustrated explanation; it does not execute code. Use Play, Previous or Next above and below.</small></figure>;
}
