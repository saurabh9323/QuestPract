'use client';
import {useState} from 'react';
import {ArrowRight,Check,Download} from 'lucide-react';
import {backendTracks,backendLessons} from '@/lib/backend-tracks';
import {lessonMarkdown} from '@/lib/commute';
import type {ReadingRecord} from '@/lib/progress';

export default function BackendPaths({records,open}:{records:Record<string,ReadingRecord>;open:(id:string)=>void}){
 const [selected,setSelected]=useState('servers');
 const track=backendTracks.find(t=>t.id===selected)!;
 const lessons=track.lessonIds.map(id=>backendLessons.find(l=>l.id===id)!);
 const done=lessons.filter(l=>records[l.id]?.readAt).length;
 function download(){const text=`# ${track.title}\n\n${track.goal}\n\n## Architecture\n\`\`\`text\n${track.architecture}\n\`\`\`\n\n${lessons.map(lessonMarkdown).join('\n\n---\n\n')}`;const url=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`quest90-${track.id}-track.md`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 return <section className="card backend-paths"><span className="eyebrow">FROM KNOWING A FRAMEWORK TO OWNING A FEATURE</span><h2>Your backend learning paths</h2><p>For around three years of experience, practise explaining a request, building a reliable feature, and diagnosing a failure. Learn one backend deeply, then compare the alternatives.</p><div className="backend-tabs" aria-label="Backend learning paths">{backendTracks.map(t=><button className="secondary" key={t.id} aria-pressed={selected===t.id} onClick={()=>setSelected(t.id)}>{t.title}</button>)}</div><div className="backend-path-grid"><div><h3>{track.title}</h3><p>{track.goal}</p><p className="muted">{done}/{lessons.length} lessons read · reading progress is separate from completing the exercises.</p><progress aria-label={`${track.title} reading progress`} value={done} max={lessons.length}/><ol className="backend-lesson-list">{lessons.map((l,i)=><li key={l.id}><button onClick={()=>open(l.id)}><span>{records[l.id]?.readAt?<Check size={17}/>:i+1}</span><span>{l.title}<small>About {l.minutes} min · code, interview Q&A and build exercise</small></span><ArrowRight size={16}/></button></li>)}</ol><button className="secondary" onClick={download}><Download size={16}/>Download this track</button></div><div><h3>Architecture map</h3><div className="backend-architecture" aria-label={`${track.title} architecture`}>{track.architecture.split('\n').map((line,i)=><div key={i}>{line.split(' → ').map((node,j,all)=><span key={j}><b>{node}</b>{j<all.length-1&&<ArrowRight size={16} aria-hidden/>}</span>)}</div>)}</div><h3>Be ready to explain</h3><ul>{track.skills.map(s=><li key={s}>{s}</li>)}</ul><details><summary>Suggested project organization</summary><pre>{track.layout}</pre></details><p className="muted">Examples and diagrams teach the design. These paths do not deploy a .NET/Python server or call an AI provider.</p></div></div></section>;
}
