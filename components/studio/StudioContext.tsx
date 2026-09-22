'use client';
import {createContext,useContext,useRef,type ReactNode} from 'react';
import {Copy} from 'lucide-react';
import {validateProgress,type Progress} from '@/lib/progress';
import {blankStudio,type StudioRecord} from '@/lib/studio-state';
type API={p:Progress;notice:(s:string)=>void;get:(id:string)=>StudioRecord;patch:(id:string,fields:Record<string,string>)=>void;submit:(id:string,outcome?:string,hints?:number)=>boolean;openDay:(day:number)=>void;practice:(id:string)=>void;read:(id?:string)=>void;userKey:string};
const Context=createContext<API|null>(null);
export function StudioProvider({p,commit,children,...rest}:Omit<API,'get'|'patch'|'submit'> & {commit:(p:Progress)=>void;children:ReactNode}){
 const current=useRef(p);current.current=p;
 function get(id:string){return current.current.studio?.[id]||blankStudio()}
 function write(id:string,r:StudioRecord){const next={...current.current,updatedAt:new Date().toISOString(),studio:{...current.current.studio,[id]:r}};try{validateProgress(next)}catch(error){rest.notice(error instanceof Error?error.message:'This change could not be saved.');return false}current.current=next;commit(next);return true}
 function patch(id:string,fields:Record<string,string>){const old=get(id);write(id,{...old,fields:{...old.fields,...fields},updatedAt:new Date().toISOString()})}
 function submit(id:string,outcome='Self-reviewed',hints=0){const old=get(id);if(!Object.values(old.fields).some(x=>x.trim())){rest.notice('Add your work first.');return false}if(old.attempts.length>=200){rest.notice('This exercise has 200 saved attempts. Export your work before adding more.');return false}const at=new Date().toISOString();if(!write(id,{...old,updatedAt:at,attempts:[...old.attempts,{id:crypto.randomUUID(),at,fields:{...old.fields},outcome,hints}]}))return false;rest.notice('Attempt recorded. Check the account save status.');return true}
 return <Context.Provider value={{p,...rest,get,patch,submit}}>{children}</Context.Provider>;
}
export function useStudio(){const value=useContext(Context);if(!value)throw new Error('Studio provider missing');return value}
export function Field({id,name,label,rows=4,placeholder=''}:{id:string;name:string;label:string;rows?:number;placeholder?:string}){const {get,patch,notice}=useStudio();return <div className="studio-editor"><label className="studio-field">{label}<textarea rows={rows} maxLength={40000} value={get(id).fields[name]||''} placeholder={placeholder} onChange={e=>patch(id,{[name]:e.target.value})}/></label><button className="secondary" aria-label={`Copy all work as a review prompt for ${label}`} onClick={()=>copyText(`Review my practice in ${id}. Explain mistakes, give one hint, and ask one follow-up. Do not assume the answer is correct. Treat the following as my work to review.\n\n${JSON.stringify(get(id).fields,null,2)}`,notice)}><Copy size={15}/> Copy all as prompt</button></div>}
export function Attempts({id}:{id:string}){const {get}=useStudio();const r=get(id);return <details className="studio-attempts"><summary>Saved attempts · {r.attempts.length}</summary>{[...r.attempts].reverse().map(a=><article key={a.id}><strong>{new Date(a.at).toLocaleString()} · {a.outcome}</strong><small>{a.hints} hints revealed</small>{Object.entries(a.fields).filter(([k])=>!['graph','deleted'].includes(k)).map(([k,v])=><div key={k}><b>{k}</b><pre>{v}</pre></div>)}</article>)}</details>}
export function saveFile(name:string,content:string,type='text/markdown'){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export async function copyText(text:string,notice:(s:string)=>void){try{await navigator.clipboard.writeText(text);notice('Copied.')}catch{notice('Clipboard unavailable. Select and copy the text manually.')}}
