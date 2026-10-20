'use client';
import {useEffect,useRef,useState} from 'react';
import type {TraceEvent} from '@/lib/playground/types';
import {detectRenderer,rendererRegistry,type RendererId} from './renderers/registry';

export default function TracePlayer({trace,code,step,onStep}:{trace:TraceEvent[];code:string;step:number;onStep:(step:number)=>void}){
  const [playing,setPlaying]=useState(false),[delay,setDelay]=useState(600),[renderer,setRenderer]=useState<RendererId|'auto'>('auto'),[reduced,setReduced]=useState(false);
  const currentLine=useRef<HTMLLIElement>(null);
  useEffect(()=>{setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)},[]);
  useEffect(()=>{
    if(!playing)return;
    if(step>=trace.length-1){setPlaying(false);return;}
    const timer=setTimeout(()=>onStep(step+1),delay);return()=>clearTimeout(timer);
  },[playing,step,trace.length,delay,onStep]);
  useEffect(()=>{
    const line=currentLine.current,parent=line?.parentElement;
    if(!line||!parent)return;
    if(line.offsetTop<parent.scrollTop)parent.scrollTop=line.offsetTop;
    else if(line.offsetTop+line.offsetHeight>parent.scrollTop+parent.clientHeight)parent.scrollTop=line.offsetTop+line.offsetHeight-parent.clientHeight;
  },[step]);
  const event=trace[step],before=trace[step-1];
  const Renderer=rendererRegistry[renderer==='auto'?detectRenderer({event}):renderer].Component;
  const move=(n:number)=>{setPlaying(false);onStep(Math.max(0,Math.min(trace.length-1,n)))};
  const variables=[...new Set([...Object.keys(before?.snapshot||{}),...Object.keys(event?.snapshot||{})])];
  return <section className={`pg-player ${reduced?'pg-reduced':''}`} tabIndex={0} aria-label="Trace player. Arrow keys step; space plays or pauses; Home and End jump."
    onKeyDown={e=>{
      if(e.target!==e.currentTarget)return;
      if(['ArrowLeft','ArrowRight',' ','Home','End'].includes(e.key))e.preventDefault();
      if(e.key==='ArrowLeft')move(step-1);if(e.key==='ArrowRight')move(step+1);
      if(e.key===' ')setPlaying(v=>!v);if(e.key==='Home')move(0);if(e.key==='End')move(trace.length-1);
    }}>
    <div className="pg-toolbar">
      <button onClick={()=>{if(step===trace.length-1)onStep(0);setPlaying(v=>!v)}} disabled={!trace.length}>{playing?'Pause':'Play'}</button>
      <button onClick={()=>move(step-1)} disabled={step===0}>← Back</button>
      <button onClick={()=>move(step+1)} disabled={step>=trace.length-1}>Next →</button>
      <label>Speed <input aria-label="Playback delay in milliseconds" type="range" min="100" max="1500" step="100" value={delay} onChange={e=>setDelay(Number(e.target.value))}/>{delay} ms/step</label>
      <label><input type="checkbox" checked={reduced} onChange={e=>setReduced(e.target.checked)}/> Reduce motion</label>
    </div>
    <label className="pg-scrubber">Time travel · step {step} of {Math.max(0,trace.length-1)}
      <input type="range" min="0" max={Math.max(0,trace.length-1)} value={step} onChange={e=>move(Number(e.target.value))} disabled={!trace.length}/>
    </label>
    <p className="pg-event" aria-live={playing?'off':'polite'}>{event?`Step ${event.step} · line ${event.line} · ${event.kind} · ${event.target}`:'No recorded steps yet.'}</p>
    <div className="pg-trace-grid">
      <div className="pg-source"><h3>Executed code</h3><ol>{code.split('\n').map((text,index)=><li key={index} ref={event?.line===index+1?currentLine:undefined} aria-current={event?.line===index+1?'step':undefined}><code>{text||' '}</code></li>)}</ol></div>
      <div className="pg-scene">
        <label>Renderer <select value={renderer} onChange={e=>setRenderer(e.target.value as RendererId|'auto')}><option value="auto">Auto-detect</option>{Object.entries(rendererRegistry).map(([id,r])=><option key={id} value={id}>{r.label}</option>)}</select></label>
        <Renderer event={event} before={before}/>
      </div>
    </div>
    <details open className="pg-variables"><summary>Variables · before → after (current function scope)</summary>
      <div className="pg-table-scroll"><table><thead><tr><th>Variable</th><th>Before step · frame {before?.frame??'—'}</th><th>After step · frame {event?.frame??'—'}</th></tr></thead><tbody>{variables.map(name=><tr key={name}><th scope="row">{name}</th><td><pre>{JSON.stringify(before&&name in before.snapshot?before.snapshot[name]:'[out of scope]',null,2)}</pre></td><td><pre>{JSON.stringify(event&&name in event.snapshot?event.snapshot[name]:'[out of scope]',null,2)}</pre></td></tr>)}</tbody></table></div>
    </details>
    <small>Keyboard: focus this player, then use ← / →, Space, Home or End. Counts are instrumented events, not CPU instructions or a complexity proof.</small>
  </section>;
}
