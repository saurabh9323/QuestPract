'use client';
import {useEffect,useRef,useState} from 'react';
import type {CartoonLesson} from '@/lib/cartoon-lessons';

export default function TutorDimensions({lesson}:{lesson:CartoonLesson}){
 const [mode,setMode]=useState<'3d'|'4d'>('3d'),[step,setStep]=useState(0),[angle,setAngle]=useState(-12),[playing,setPlaying]=useState(false);
 const scene=lesson.scenes[step];
 const root=useRef<HTMLElement>(null);
 useEffect(()=>{if(!playing)return;const timer=setTimeout(()=>{if(step>=lesson.scenes.length-1)setPlaying(false);else setStep(step+1);},4500);return()=>clearTimeout(timer);},[playing,step,lesson.scenes.length]);
 useEffect(()=>{const details=root.current?.closest('details');const stop=()=>{if(!details?.open)setPlaying(false);};details?.addEventListener('toggle',stop);return()=>details?.removeEventListener('toggle',stop);},[]);
 useEffect(()=>{const stop=()=>{if(document.hidden)setPlaying(false);};document.addEventListener('visibilitychange',stop);return()=>document.removeEventListener('visibilitychange',stop);},[]);
 if(!scene)return null;
 function jump(n:number){setPlaying(false);setStep(n);}
 return <section ref={root} className="tutor-dimensions" aria-label="Spatial explanation and timeline">
  <h3>Explore the explanation</h3><p>3D adds depth to the scene. 4D adds time: follow the explanation one step at a time.</p>
  <div className="dimension-controls"><button aria-pressed={mode==='3d'} onClick={()=>{setMode('3d');setPlaying(false);}}>3D · spatial view</button><button aria-pressed={mode==='4d'} onClick={()=>setMode('4d')}>4D · time journey</button></div>
  <div className="dimension-stage"><div className="dimension-world" style={{transform:`rotateX(12deg) rotateY(${angle}deg)`}}>{scene.items.map((item,i)=><div className={`dimension-node ${scene.active.includes(i)?'is-active':''}`} key={i} style={{transform:`translateZ(${scene.active.includes(i)?24:0}px)`}}><small>Item {i+1}{scene.active.includes(i)?' · focus':''}</small><strong>{item}</strong></div>)}</div></div>
  <label>Rotate view<input type="range" min={-30} max={30} value={angle} onChange={e=>setAngle(Number(e.target.value))}/></label>
  <label>Scene {step+1} of {lesson.scenes.length}<input type="range" min={0} max={lesson.scenes.length-1} value={step} onChange={e=>jump(Number(e.target.value))} aria-valuetext={scene.title}/></label>
  <div className="dimension-controls"><button disabled={step===0} onClick={()=>jump(step-1)}>Previous</button>{mode==='4d'&&<button onClick={()=>{if(!playing&&step===lesson.scenes.length-1)setStep(0);setPlaying(!playing);}}>{playing?'Pause':'Play timeline'}</button>}<button disabled={step===lesson.scenes.length-1} onClick={()=>jump(step+1)}>Next</button></div>
  <div aria-live="polite"><h4>{scene.title}</h4><p>{scene.say}</p><details><summary>Technical explanation & code</summary><p>{scene.technical}</p><pre><code>{scene.code}</code></pre></details></div>
  <small>Illustration of the supplied lesson, not execution of your code. Depth marks the current focus; it does not represent memory size or performance.</small>
 </section>;
}
