'use client';
import {useEffect,useState,type CSSProperties} from 'react';
import {ArrowLeft,ArrowRight,Pause,Play,RotateCcw} from 'lucide-react';
import type {FoundationLesson} from '@/lib/oop-foundations/types';

export default function FoundationPlayer({lesson}:{lesson:FoundationLesson}){
  const [step,setStep]=useState(0),[playing,setPlaying]=useState(false),[delay,setDelay]=useState(2200);
  const [systemReduced,setSystemReduced]=useState(false),[manualReduced,setManualReduced]=useState(false);
  const reduced=systemReduced||manualReduced;
  const last=lesson.steps.length-1,frame=lesson.steps[step];
  useEffect(()=>{
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setSystemReduced(preference.matches);update();
    preference.addEventListener('change',update);return()=>preference.removeEventListener('change',update);
  },[]);
  useEffect(()=>{if(reduced)setPlaying(false)},[reduced]);
  useEffect(()=>{
    if(!playing||reduced)return;
    if(step===last){setPlaying(false);return}
    const timer=setTimeout(()=>setStep(value=>Math.min(last,value+1)),delay);
    return()=>clearTimeout(timer);
  },[playing,reduced,step,last,delay]);
  function jump(next:number){setPlaying(false);setStep(Math.max(0,Math.min(last,next)))}
  function toggle(){if(reduced)return;if(step===last)setStep(0);setPlaying(value=>!value)}
  return <section className="foundation-player" data-reduced={reduced} aria-label={lesson.title+' animated walkthrough'} tabIndex={0} onKeyDown={event=>{
    if(event.target!==event.currentTarget)return;
    if(event.key==='ArrowRight'){event.preventDefault();jump(step+1)}
    if(event.key==='ArrowLeft'){event.preventDefault();jump(step-1)}
    if(event.key===' '){event.preventDefault();toggle()}
    if(event.key==='Home'){event.preventDefault();jump(0)}
    if(event.key==='End'){event.preventDefault();jump(last)}
  }}>
    <div className="foundation-player-title"><div><span className="eyebrow">WATCH THE IDEA MOVE</span><h3>{frame.title}</h3></div><span className="mini-tag">Step {step+1} / {lesson.steps.length}</span></div>
    <p className="foundation-model-note">Authored teaching animation. These steps illustrate the example; this player does not compile or execute the code or display real memory addresses.</p>
    <div className="foundation-flow" style={{'--step-position':((frame.active+.5)/3*100)+'%'} as CSSProperties}>
      <div className="foundation-rail" aria-hidden="true"><span className="foundation-packet">●</span></div>
      <ol>{frame.nodes.map((node,index)=><li key={index} className={index===frame.active?'active':''} aria-current={index===frame.active?'step':undefined}>
        <span className="foundation-node-icon" aria-hidden="true">{node.icon}</span><strong>{node.label}</strong><span>{node.value}</span>
      </li>)}</ol>
    </div>
    <div className="foundation-caption" aria-live={playing?'off':'polite'} aria-atomic="true"><strong>Step {step+1}: {frame.title}</strong><p>{frame.explanation}</p></div>
    <div className="foundation-controls">
      <button type="button" className="secondary" onClick={()=>jump(step-1)} disabled={step===0}><ArrowLeft size={16}/>Back</button>
      <button type="button" className="primary" onClick={toggle} disabled={reduced}>{playing?<Pause size={16}/>:<Play size={16}/>} {playing?'Pause':step===last?'Replay':'Play'}</button>
      <button type="button" className="secondary" onClick={()=>jump(step+1)} disabled={step===last}>Next<ArrowRight size={16}/></button>
      <button type="button" className="secondary" onClick={()=>jump(0)}><RotateCcw size={16}/>Restart</button>
      <label>Speed<select value={delay} onChange={event=>setDelay(Number(event.target.value))}><option value={3400}>Slow</option><option value={2200}>Normal</option><option value={1100}>Fast</option></select></label>
    </div>
    <label className="foundation-scrubber">Move through the example<input type="range" min={0} max={last} value={step} aria-valuetext={'Step '+(step+1)+': '+frame.title} onChange={event=>jump(Number(event.target.value))}/></label>
    <label className="foundation-motion"><input type="checkbox" checked={reduced} disabled={systemReduced} onChange={event=>setManualReduced(event.target.checked)}/>Reduce motion{systemReduced?' (device setting)':''}</label>
    <small>{reduced?'Motion and autoplay are off. Back, Next and the slider still work.':'Keyboard: focus the animation panel, then use ← / → to step and Space to play or pause.'}</small>
    <div className="foundation-state-table"><table><caption>What changed at this step?</caption><thead><tr><th scope="col">Value</th><th scope="col">Before</th><th scope="col">After</th></tr></thead><tbody>{frame.variables.map(variable=><tr key={variable.name}><th scope="row">{variable.name}</th><td>{variable.before}</td><td className={variable.before!==variable.after?'changed':''}>{variable.after}</td></tr>)}</tbody></table></div>
    <details className="foundation-source" open><summary>{lesson.code.language} example · {frame.line?'line '+frame.line+' highlighted':'read alongside the flow'}</summary>
      <pre tabIndex={0} aria-label="Illustrative source code">{lesson.code.source.split('\n').map((line,index)=><code key={index} className={frame.line===index+1?'active-line':''}><span aria-hidden="true">{index+1}</span>{line||' '}</code>)}</pre>
      <p><strong>Expected example result:</strong> {lesson.code.expected}</p>
    </details>
  </section>;
}
