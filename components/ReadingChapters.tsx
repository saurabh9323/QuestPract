'use client';
import {useState} from 'react';
import {readingLibrary,type ReadingLesson} from '@/lib/commute';
import {designCourseGroups} from '@/lib/design-course';
import {jsPreparationPath} from '@/lib/js-preparation';
import type {ReadingRecord} from '@/lib/progress';

export default function ReadingChapters({lesson,records,open}:{lesson:ReadingLesson;records:Record<string,ReadingRecord>;open:(id:string)=>void}){
 const [search,setSearch]=useState(''),[page,setPage]=useState(1);
 const designIds=designCourseGroups.flatMap(g=>g.ids),isDesign=designIds.includes(lesson.id);
 const chapters=isDesign?designIds.map(id=>readingLibrary.find(l=>l.id===id)!).filter(Boolean):jsPreparationPath.includes(lesson.id)?jsPreparationPath.map(id=>readingLibrary.find(l=>l.id===id)!).filter(Boolean):readingLibrary.filter(l=>l.category===lesson.category);
 const filtered=chapters.filter(l=>l.title.toLowerCase().includes(search.toLowerCase())),pages=Math.max(1,Math.ceil(filtered.length/12)),current=Math.min(page,pages),index=chapters.findIndex(l=>l.id===lesson.id),read=chapters.filter(l=>records[l.id]?.readAt).length;
 return <aside className="reading-chapters"><details open><summary>{isDesign?'System design course':jsPreparationPath.includes(lesson.id)?'JavaScript basics':lesson.category} · chapters</summary><p>{read} / {chapters.length} read</p><progress value={read} max={chapters.length||1} aria-label="Chapters read"/><label>Find a chapter<input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search chapter titles"/></label><nav aria-label="Lesson chapters">{filtered.slice((current-1)*12,current*12).map(l=><button key={l.id} aria-current={l.id===lesson.id?'page':undefined} onClick={()=>open(l.id)}><span aria-hidden>{records[l.id]?.readAt?'✓':'○'}</span>{l.title}</button>)}</nav>{!filtered.length&&<p>No matching chapters.</p>}{pages>1&&<div className="chapter-paging"><button disabled={current===1} onClick={()=>setPage(current-1)}>Previous</button><span>{current}/{pages}</span><button disabled={current===pages} onClick={()=>setPage(current+1)}>Next</button></div>}<div className="chapter-paging"><button disabled={index<=0} onClick={()=>open(chapters[index-1].id)}>← Chapter</button><button disabled={index>=chapters.length-1} onClick={()=>open(chapters[index+1].id)}>Chapter →</button></div><small>Reading progress is separate from solving a design problem.</small></details></aside>;
}

export function SystemDesignCourse({records,open,browse}:{records:Record<string,ReadingRecord>;open:(id:string)=>void;browse:()=>void}){
 const ids=designCourseGroups.flatMap(g=>g.ids),read=ids.filter(id=>records[id]?.readAt).length;
 return <section className="card design-course-shelf"><span className="eyebrow">SYSTEM DESIGN · LEARN, TRACE, DEFEND</span><h2>From a request to a design you can explain</h2><p>Start with HLD and LLD, then reason about objects, data and failure. All chapters stay accessible.</p><progress value={read} max={ids.length} aria-label="System design chapters read"/><p>{read} / {ids.length} chapters read</p><div className="design-course-groups">{designCourseGroups.map(g=><div key={g.title}><h3>{g.title}</h3>{g.ids.map(id=>{const l=readingLibrary.find(l=>l.id===id);return l?<button key={id} onClick={()=>open(id)}><span>{records[id]?.readAt?'✓ Read':'○ Start'}</span><strong>{l.title}</strong><small>{l.minutes} min · {l.format}</small></button>:null;})}</div>)}</div><div className="button-row"><button className="primary" onClick={()=>open(ids.find(id=>!records[id]?.readAt)||ids[0])}>Continue course</button><button className="secondary" onClick={browse}>Browse system-design scenarios</button></div></section>;
}
