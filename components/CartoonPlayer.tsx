'use client';
import {useEffect,useRef,useState} from 'react';
import {drawCartoon,MOVIE_WIDTH,MOVIE_HEIGHT} from '@/lib/cartoon-renderer';
import type {CartoonLesson} from '@/lib/cartoon-lessons';
import {useStudio,Field,Attempts,saveFile} from './studio/StudioContext';

export default function CartoonPlayer({lesson}:{lesson:CartoonLesson}){
 const {get,patch,submit}=useStudio(),id=`cartoon-${lesson.id}`,record=get(id);
 const canvas=useRef<HTMLCanvasElement>(null),stopExport=useRef<(()=>void)|null>(null),mounted=useRef(true);
 const [step,setStep]=useState(0),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(1),[dark,setDark]=useState(false),[reduced,setReduced]=useState(false),[speaking,setSpeaking]=useState(false),[voiceReady,setVoiceReady]=useState(false),[exportReady,setExportReady]=useState(false),[exporting,setExporting]=useState(false),[exportPercent,setExportPercent]=useState(0),[video,setVideo]=useState<{url:string;extension:string}|null>(null),[error,setError]=useState('');
 const scene=lesson.scenes[step];
 const seconds=(index:number)=>Math.max(7,lesson.scenes[index].say.split(/\s+/).length/2.1+2);
 function stopVoice(){if(typeof window!=='undefined'&&'speechSynthesis'in window)window.speechSynthesis.cancel();setSpeaking(false)}
 useEffect(()=>{
  mounted.current=true;setVoiceReady('speechSynthesis'in window);setExportReady(typeof MediaRecorder!=='undefined'&&typeof HTMLCanvasElement.prototype.captureStream==='function');
  const mq=window.matchMedia('(prefers-reduced-motion: reduce)');const motion=()=>setReduced(mq.matches);motion();mq.addEventListener('change',motion);
  const theme=()=>setDark(!!canvas.current?.closest('.night-mode'));theme();const observer=new MutationObserver(theme);observer.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class']});
  return()=>{mounted.current=false;stopExport.current?.();if('speechSynthesis'in window)window.speechSynthesis.cancel();mq.removeEventListener('change',motion);observer.disconnect()};
 },[]);
 useEffect(()=>()=>{if(video)URL.revokeObjectURL(video.url)},[video]);
 useEffect(()=>{
  const ctx=canvas.current?.getContext('2d');if(!ctx)return;let raf=0;const start=performance.now();
  const paint=(now:number)=>{const phase=playing?Math.min(1,(now-start)/(seconds(step)*1000/speed)):0;drawCartoon(ctx,lesson,step,phase,dark,reduced);if(playing){if(phase>=1){if(step<lesson.scenes.length-1)setStep(step+1);else setPlaying(false)}else raf=requestAnimationFrame(paint)}};
  paint(start);return()=>cancelAnimationFrame(raf);
 // Duration is derived only from this lesson/step; changing controls restarts that scene.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[lesson,step,playing,speed,dark,reduced]);
 useEffect(()=>{const hide=()=>{if(document.hidden){setPlaying(false);stopVoice();stopExport.current?.()}};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide)},[]);
 function jump(index:number){stopVoice();setPlaying(false);setStep(index)}
 function narrate(){setPlaying(false);if(speaking){stopVoice();return}stopVoice();const utterance=new SpeechSynthesisUtterance(`${scene.title}. ${scene.say}`);utterance.lang='en-IN';utterance.rate=speed;utterance.onend=()=>{if(mounted.current)setSpeaking(false)};utterance.onerror=()=>{if(mounted.current){setSpeaking(false);setError('Your browser could not read this scene. The full captions are below.')}};setSpeaking(true);window.speechSynthesis.speak(utterance)}
 async function exportVideo(){
  setPlaying(false);stopVoice();setError('');setVideo(null);
  const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'].find(t=>MediaRecorder.isTypeSupported(t));
  if(!mime){setError('This browser cannot export a supported video. You can still play the story or download its transcript.');return}
  let stream:MediaStream|undefined,recorder:MediaRecorder|undefined,raf=0,watchdog:ReturnType<typeof setTimeout>|undefined;
  try{
   const surface=document.createElement('canvas');surface.width=MOVIE_WIDTH;surface.height=MOVIE_HEIGHT;const ctx=surface.getContext('2d');if(!ctx)throw new Error('Canvas is unavailable.');
   drawCartoon(ctx,lesson,0,0,dark,reduced);stream=surface.captureStream(24);recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2_500_000});
   const chunks:BlobPart[]=[];let cancelled=false,finished=false,lastPercent=-1;
   const cleanup=()=>{cancelAnimationFrame(raf);if(watchdog)clearTimeout(watchdog);stream?.getTracks().forEach(t=>t.stop());stopExport.current=null};
   stopExport.current=()=>{cancelled=true;if(recorder?.state!=='inactive')recorder?.stop();else cleanup();if(mounted.current){setExporting(false);setError('Video export cancelled. Keep this tab visible while exporting.')}};
   recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
   recorder.onerror=()=>{cancelled=true;cleanup();if(mounted.current){setExporting(false);setError('Video recording failed. Try a browser with MediaRecorder support.')}};
   recorder.onstop=()=>{cleanup();if(!mounted.current)return;setExporting(false);if(!cancelled&&finished&&chunks.length){const blob=new Blob(chunks,{type:recorder?.mimeType||mime});if(blob.size)setVideo({url:URL.createObjectURL(blob),extension:mime.includes('mp4')?'mp4':'webm'})}else if(!cancelled)setError('The recording stopped before the lesson finished. Please try again.')};
   const durations=lesson.scenes.map((_,i)=>seconds(i)*1000),total=durations.reduce((a,b)=>a+b,0);recorder.start(250);setExporting(true);setExportPercent(0);const start=performance.now();
   watchdog=setTimeout(()=>stopExport.current?.(),total+15000);
   const tick=(now:number)=>{const elapsed=now-start;let remaining=elapsed,index=0;while(index<durations.length-1&&remaining>=durations[index])remaining-=durations[index++];drawCartoon(ctx,lesson,index,Math.min(1,remaining/durations[index]),dark,reduced);const percent=Math.min(100,Math.floor(elapsed/total*100));if(percent!==lastPercent){lastPercent=percent;setExportPercent(percent)}if(elapsed<total)raf=requestAnimationFrame(tick);else{finished=true;recorder?.stop()}};
   raf=requestAnimationFrame(tick);
  }catch(e){cancelAnimationFrame(raf);if(watchdog)clearTimeout(watchdog);if(recorder?.state==='recording')recorder.stop();stream?.getTracks().forEach(t=>t.stop());stopExport.current=null;setExporting(false);setError(e instanceof Error?e.message:'Video export is unavailable.')}
 }
 const choice=record.fields.choice??'',checked=record.fields.checked==='yes',correct=Number(choice)===lesson.quiz.answer;
 return <section className="cartoon-player" aria-label={`${lesson.title} animated lesson`}>
  <div className="cartoon-screen"><canvas ref={canvas} width={MOVIE_WIDTH} height={MOVIE_HEIGHT} role="img" aria-label={`${scene.title}. ${scene.say}`}/></div>
  <div className="cartoon-controls">
   <button className="secondary" disabled={step===0} onClick={()=>jump(step-1)}>← Previous</button>
   <button className="primary" onClick={()=>{stopVoice();if(!playing&&step===lesson.scenes.length-1)setStep(0);setPlaying(!playing)}}>{playing?'Pause':'▶ Play story'}</button>
   <button className="secondary" disabled={step===lesson.scenes.length-1} onClick={()=>jump(step+1)}>Next →</button>
   <button className="secondary" onClick={()=>jump(0)}>Restart</button>
   <label>Speed <select value={speed} onChange={e=>{stopVoice();setSpeed(Number(e.target.value))}}>{[0.75,1,1.25].map(n=><option key={n} value={n}>{n}×</option>)}</select></label>
   <button className="secondary" disabled={!voiceReady} onClick={narrate}>{speaking?'Stop voice':'Read this scene aloud'}</button>
  </div>
  <div className="cartoon-chapters" aria-label="Story scenes">{lesson.scenes.map((s,i)=><button key={s.title} className="secondary" aria-current={step===i?'step':undefined} onClick={()=>jump(i)}>{i+1}. {s.title}</button>)}</div>
  <div className="cartoon-caption" aria-live="polite"><strong>Scene {step+1} of {lesson.scenes.length}: {scene.title}</strong><p>{scene.say}</p></div>
  <p className="cartoon-small">{reduced?'Reduced motion is on: the story changes scenes without moving characters. ':'Pause, step forward, or replay at your own pace. '}Browser voices depend on your device. These learning illustrations do not execute your code.</p>
  <details className="cartoon-technical"><summary>Now explain it like a developer</summary><p>{scene.technical}</p><pre><code>{scene.code}</code></pre><h4>Why and when?</h4><p>{lesson.why}</p><h4>Where the story analogy stops</h4><p>{lesson.limit}</p></details>
  <details className="cartoon-export"><summary>Take the story with you · video and transcript</summary><p>Create a real captioned video of all {lesson.scenes.length} scenes. It takes about {Math.ceil(lesson.scenes.reduce((n,_,i)=>n+seconds(i),0))} seconds; keep this tab visible.</p><p><strong>The exported video is silent.</strong> Browser narration is available in the player but is not included in the download. Files stay on your device.</p><div className="cartoon-controls"><button className="secondary" disabled={!exportReady||exporting} onClick={exportVideo}>{exporting?`Creating video · ${exportPercent}%`:'Create captioned video'}</button>{exporting&&<button className="secondary" onClick={()=>stopExport.current?.()}>Cancel export</button>}<button className="secondary" onClick={()=>saveFile(`${lesson.id}-story.md`,`# ${lesson.title}\n\n${lesson.why}\n\n${lesson.scenes.map((s,i)=>`## ${i+1}. ${s.title}\n\n${s.say}\n\nTechnical view: ${s.technical}\n\n\`\`\`\n${s.code}\n\`\`\``).join('\n\n')}\n\nAnalogy limit: ${lesson.limit}\n\nRecall: ${lesson.quiz.question}\n${lesson.quiz.why}`)}>Download transcript</button></div>{!exportReady&&<p>Your browser does not support video recording here. Use the player and transcript instead.</p>}{exporting&&<progress value={exportPercent} max={100} aria-label="Video export progress"/>}{video&&<div className="cartoon-video"><video src={video.url} controls playsInline aria-label={`${lesson.title} captioned video`}/><a className="secondary" href={video.url} download={`${lesson.id}.${video.extension}`}>Download video ({video.extension})</a></div>}</details>
  {error&&<p role="alert" className="cartoon-error">{error}</p>}
  <section className="cartoon-check"><h3>Your turn: teach Pip</h3><fieldset><legend>{lesson.quiz.question}</legend>{lesson.quiz.choices.map((c,i)=><label key={c}><input type="radio" name={`${id}-choice`} value={i} checked={choice===String(i)} onChange={()=>patch(id,{choice:String(i),checked:'no'})}/>{c}</label>)}</fieldset><button className="primary" disabled={choice===''} onClick={()=>{patch(id,{checked:'yes'});submit(id,correct?'Correct recall':'Review this idea')}}>Check my understanding</button>{checked&&<p role="status"><strong>{correct?'You got it.':'Try thinking about it this way.'}</strong> {lesson.quiz.why}</p>}<Field id={id} name="explanation" label="Explain it in your own words — English or Hinglish" rows={3} placeholder="Imagine that… The real code does… I would use it when…"/><button className="secondary" disabled={!record.fields.explanation?.trim()} onClick={()=>submit(id,'Self-explanation')}>Save explanation checkpoint</button><p className="cartoon-small">Answers and drafts use your existing account save. Watching a story does not mark a course day complete.</p><Attempts id={id}/></section>
 </section>;
}
