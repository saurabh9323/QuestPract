'use client';
import {useState} from 'react';
import type {StudioRecord} from '@/lib/studio-state';
const prompts={shipped:'What shipped?',stuck:"What’s stuck?",priority:'One priority for next week'};
const metrics={dsaSolved:'DSA solved',openSourceMoved:'Contributions moved',openSourceMerged:'Contributions merged',hackathonsProgressed:'Hackathons progressed',questsCompleted:'Quests completed'};
export default function ReviewHistory({reviews}:{reviews:[string,StudioRecord][]}){
 const [requested,setPage]=useState(0),pages=Math.max(1,Math.ceil(reviews.length/5)),page=Math.min(requested,pages-1);
 return <details><summary>Past reviews · {reviews.length}/104</summary><p>Read-only snapshots. Counts remain as they were when saved.</p>{reviews.length===0&&<p>No reviews yet. Save your first weekly reflection above.</p>}{reviews.slice(page*5,page*5+5).map(([id,r])=>{
 let counts:Record<string,unknown>|null=null;try{counts=JSON.parse(r.fields.summary)}catch{}
 return <article className="card" key={id}><h4>Review saved {new Date(r.fields.createdAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})} IST</h4>{Object.entries(prompts).map(([key,label])=><p key={key} style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}><strong>{label}</strong><br/>{r.fields[key]}</p>)}{counts?<><p>{String(counts.start)} – {String(counts.end)}</p><dl className="career-review-counts">{Object.entries(metrics).map(([key,label])=><div key={key}><dt>{label}</dt><dd>{String(counts![key])}</dd></div>)}</dl></>:<p>Snapshot counts unavailable. Your written reflection is preserved.</p>}</article>;
 })}{reviews.length>5&&<nav className="career-review-pages" aria-label="Weekly review history pages"><button className="secondary" disabled={page===0} onClick={()=>setPage(page-1)}>Previous reviews</button><span>Page {page+1} of {pages}</span><button className="secondary" disabled={page===pages-1} onClick={()=>setPage(page+1)}>Next reviews</button></nav>}</details>;
}
