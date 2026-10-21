import {checkCitations,type CitationScope} from '@/lib/learning/citations';
export default function AIEvidenceText({text,scope,onSelect}:{text:string;scope:CitationScope;onSelect:(kind:'step'|'node'|'item',id:string)=>void}){
  return <p><small>AI</small>{' '}{checkCitations(text,scope).map((p,i)=>p.kind===null?<span key={i}>{p.text}</span>:p.valid?<button className="pg-citation" key={i} onClick={()=>onSelect(p.kind!,p.id!)}>{p.text}</button>:<span key={i}>{p.text} <small>(unavailable citation)</small></span>)}</p>;
}
