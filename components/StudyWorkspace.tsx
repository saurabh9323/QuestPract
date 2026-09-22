'use client';
import {useRef,useState,type ReactNode} from 'react';
import {BookOpen,Code2,MessageCircle,Send,Maximize2,Minimize2} from 'lucide-react';
const sections=[{id:'learn',label:'Learn & build',icon:BookOpen},{id:'practice',label:'DSA practice',icon:Code2},{id:'speak',label:'Speak & reflect',icon:MessageCircle},{id:'finish',label:'Checklist & submit',icon:Send}] as const;
export default function StudyWorkspace({day,title,focus,onFocus,timer,lesson,diagram,editor,practice,communication,finish,support,sync}:{day:number;title:string;focus:boolean;onFocus:()=>void;timer:ReactNode;lesson:ReactNode;diagram:ReactNode;editor:(finish:()=>void)=>ReactNode;practice:ReactNode;communication:ReactNode;finish:ReactNode;support:ReactNode;sync:string}){
  const [section,setSection]=useState<typeof sections[number]['id']>('learn');
  const [reference,setReference]=useState<'guide'|'diagram'>('guide');
  const finishRef=useRef<HTMLDivElement>(null);
  function openSubmission(){setSection('finish');requestAnimationFrame(()=>{finishRef.current?.focus();finishRef.current?.scrollIntoView({block:'start',behavior:'smooth'})})}
  return <section className="study-workspace" aria-label={`Day ${day} study workspace`}>
    <div className="study-commandbar"><div><span className="eyebrow">DAY {String(day).padStart(2,'0')} · STUDY WORKSPACE</span><strong>{title}</strong></div><div className="study-command-actions">{timer}<button className="secondary" onClick={onFocus} aria-pressed={focus}>{focus?<Minimize2 size={16}/>:<Maximize2 size={16}/>} {focus?'Exit focus':'Focus mode'}</button></div></div>
    <div className="study-section-nav" aria-label="Study sections">{sections.map((item,i)=><button key={item.id} aria-pressed={section===item.id} onClick={()=>setSection(item.id)}><item.icon size={17}/><span>{i+1}. {item.label}</span></button>)}</div>
    <div className="study-save-line" role="status">{sync}<span>Drafts stay with this day. Submit your session when you finish.</span></div>
    <div hidden={section!=='learn'} className="study-workbench"><div className="study-reference"><div className="study-reference-switch"><button aria-pressed={reference==='guide'} onClick={()=>setReference('guide')}>Task & examples</button><button aria-pressed={reference==='diagram'} onClick={()=>setReference('diagram')}>Diagram & flow</button></div><div hidden={reference!=='guide'}>{lesson}</div><div hidden={reference!=='diagram'}>{diagram}</div></div><div className="study-editor-panel">{editor(openSubmission)}</div></div>
    <div hidden={section!=='practice'} className="study-section-content">{practice}</div>
    <div hidden={section!=='speak'} className="study-section-content">{communication}</div>
    <div hidden={section!=='finish'} ref={finishRef} tabIndex={-1} aria-label="Checklist and session submission" className="study-finish-grid">{finish}<div>{support}</div></div>
  </section>;
}
