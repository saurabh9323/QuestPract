'use client';
import {useEffect,useRef,useState} from 'react';
import {Mic,Square} from 'lucide-react';
type Recognition={lang:string;continuous:boolean;interimResults:boolean;onresult:((event:{results:ArrayLike<{isFinal:boolean;0:{transcript:string}}>})=>void)|null;onerror:((event:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void;abort:()=>void};
type SpeechWindow=Window&{SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
export default function VoiceDictation({onInsert,disabled=false}:{onInsert:(text:string)=>boolean;disabled?:boolean}){
 const [supported,setSupported]=useState(false),[listening,setListening]=useState(false),[text,setText]=useState(''),[error,setError]=useState(''),[lang,setLang]=useState('en-IN');
 const engine=useRef<Recognition|null>(null);
 const root=useRef<HTMLDivElement|null>(null);
 const dispose=()=>{const r=engine.current;engine.current=null;if(r){r.onresult=null;r.onerror=null;r.onend=null;r.abort();}};
 useEffect(()=>{const w=window as SpeechWindow;setSupported(!!(w.SpeechRecognition||w.webkitSpeechRecognition));return dispose;},[]);
 useEffect(()=>{if(disabled){dispose();setListening(false);}},[disabled]);
 useEffect(()=>{const details=root.current?.closest('details');const stop=()=>{if(document.hidden||(details&&!details.open)){dispose();setListening(false);}};document.addEventListener('visibilitychange',stop);details?.addEventListener('toggle',stop);return()=>{document.removeEventListener('visibilitychange',stop);details?.removeEventListener('toggle',stop);};},[]);
 function start(){if(engine.current||disabled)return;const w=window as SpeechWindow,Ctor=w.SpeechRecognition||w.webkitSpeechRecognition;if(!Ctor)return;setError('');setText('');const r=new Ctor();engine.current=r;r.lang=lang;r.continuous=true;r.interimResults=true;
  r.onresult=e=>{if(engine.current!==r)return;const transcript=Array.from(e.results).map(result=>result[0].transcript).join(' ').trim();setText(transcript.slice(0,4000));if(transcript.length>=4000){setError('Dictation reached 4,000 characters. Review and add this text before continuing.');r.stop();}};
  r.onerror=e=>{if(engine.current!==r)return;const errors:Record<string,string>={'not-allowed':'Microphone access was denied. Allow microphone access in your browser’s site settings, or type your answer.','audio-capture':'No microphone is available. Check your device and permissions.','network':'Speech recognition could not connect. Check your connection or type instead.','no-speech':'No speech was detected. Try again when ready.','language-not-supported':'This recognition language is unavailable. Try another language.'};if(e.error!=='aborted')setError(errors[e.error]||'Speech recognition stopped. You can still type your answer.');};
  r.onend=()=>{if(engine.current!==r)return;engine.current=null;setListening(false);};
  try{setListening(true);r.start();}catch{dispose();setListening(false);setError('Microphone could not start. Try again or type your answer.');}
 }
 return <div ref={root} className="voice-dictation"><div className="voice-controls"><label>Dictation language<select disabled={listening||disabled} value={lang} onChange={e=>setLang(e.target.value)}><option value="en-IN">English (India)</option><option value="en-US">English (US)</option><option value="hi-IN">Hindi (India)</option></select></label><button type="button" disabled={!supported||disabled} aria-pressed={listening} onClick={()=>listening?engine.current?.stop():start()}>{listening?<Square size={15}/>:<Mic size={15}/>} {listening?'Stop microphone':'Speak to type'}</button></div>
 <small>{supported?'Your browser may send audio to its speech service. Quest90 stores text, not audio. Nothing is sent to Gemini until you submit.':'Speech recognition is unavailable in this browser. Type or paste your answer instead.'}</small>
 {listening&&<p role="status">Listening… speak naturally, then stop and review.</p>}{text&&<><label>Recognized words<textarea rows={3} maxLength={4000} value={text} readOnly={listening} onChange={e=>setText(e.target.value)}/></label><button type="button" disabled={listening||disabled||!text.trim()} onClick={()=>{if(onInsert(text.trim())){setText('');setError('');}else setError('Your answer would exceed 4,000 characters. Shorten the draft or dictation first.');}}>Add to my answer</button><button type="button" disabled={listening} onClick={()=>setText('')}>Discard dictation</button></>}{error&&<p role="alert">{error}</p>}</div>;
}
