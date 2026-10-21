import {validateModule} from '../playground/schema';
import {domains,palettes,type LearningDocument,type Flow,type StrokeDocument,type Card,type SessionPlan,type Link} from './types';

export const DOCUMENT_CAP=30000;
export const byteSize=(text:string)=>new TextEncoder().encode(text).byteLength;
export function object(v:unknown):Record<string,unknown>{
  if(!v||typeof v!=='object'||Array.isArray(v)||![Object.prototype,null].includes(Object.getPrototypeOf(v)))throw new Error('Expected a plain object.');
  return v as Record<string,unknown>;
}
function keys(v:Record<string,unknown>,allowed:string[]){if(Object.keys(v).some(k=>!allowed.includes(k)))throw new Error('Unknown or unsafe field.');}
function text(v:unknown,max=1000,required=false):asserts v is string{if(typeof v!=='string'||v.length>max||(required&&!v.trim()))throw new Error(`Expected text up to ${max} characters.`);}
function id(v:unknown):asserts v is string{if(typeof v!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(v)||['__proto__','constructor','prototype'].includes(v))throw new Error('Invalid identifier.');}
function number(v:unknown,min:number,max:number){if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw new Error('Number outside allowed range.');}
function list(v:unknown,max:number):unknown[]{if(!Array.isArray(v)||v.length>max)throw new Error(`Expected at most ${max} entries.`);return v;}
function unique(v:{id:string}[]){if(new Set(v.map(x=>x.id)).size!==v.length)throw new Error('Duplicate identifiers.');}
function date(v:unknown){if(typeof v!=='string'||!/^\d{4}-\d\d-\d\dT/.test(v)||!Number.isFinite(Date.parse(v)))throw new Error('Invalid timestamp.');}
export function validateLink(v:unknown):Link{
  const x=object(v);keys(x,['kind','id','label']);id(x.id);text(x.label,200);
  if(!['question','dsa-path','dojo','module','lesson'].includes(String(x.kind)))throw new Error('Unsupported link kind.');
  return x as Link;
}
export function validateFlow(v:unknown):Flow{
  const x=object(v);keys(x,['id','title','domain','nodes','edges','tags','links','versions','createdAt','updatedAt']);
  id(x.id);text(x.title,200,true);
  if(!domains.includes(x.domain as Flow['domain']))throw new Error('Unsupported flow domain.');
  const nodes=list(x.nodes,80).map(v=>{
    const n=object(v);keys(n,['id','type','label','x','y','note','costNote','lines','tradeoff']);id(n.id);text(n.label,200,true);text(n.note);text(n.costNote);number(n.x,-10000,10000);number(n.y,-10000,10000);
    if(!(palettes[x.domain as Flow['domain']] as readonly string[]).includes(String(n.type)))throw new Error('Node type does not belong to this domain.');
    list(n.lines,100).forEach(line=>{number(line,1,10000);if(!Number.isInteger(line))throw new Error('Code lines must be integers.');});
    if(n.tradeoff!==undefined){const t=object(n.tradeoff);keys(t,['why','alternative','breaksWhen']);text(t.why);text(t.alternative);text(t.breaksWhen);}
    return n as Flow['nodes'][number];
  });unique(nodes);
  const edges=list(x.edges,160).map(v=>{
    const e=object(v);keys(e,['id','from','to','label','condition','mode']);id(e.id);id(e.from);id(e.to);text(e.label,200);text(e.condition,200);
    if(!['sync','async','control'].includes(String(e.mode)))throw new Error('Invalid edge mode.');
    if(!nodes.some(n=>n.id===e.from)||!nodes.some(n=>n.id===e.to))throw new Error('Edge endpoint is missing.');
    return e as Flow['edges'][number];
  });unique(edges);
  list(x.tags,20).forEach(t=>text(t,60,true));list(x.links,30).forEach(validateLink);
  const versions=list(x.versions,20).map(v=>{const r=object(v);keys(r,['id','at','note']);id(r.id);date(r.at);text(r.note,300);return r as Flow['versions'][number]});unique(versions);
  date(x.createdAt);date(x.updatedAt);if(Date.parse(String(x.updatedAt))<Date.parse(String(x.createdAt)))throw new Error('Updated time precedes creation.');
  return x as Flow;
}
export function validateStrokeDocument(v:unknown):StrokeDocument{
  const x=object(v);keys(x,['id','title','host','strokes']);id(x.id);text(x.title,200,true);validateLink(x.host);
  let total=0;
  const strokes=list(x.strokes,200).map(v=>{
    const s=object(v);keys(s,['id','tool','color','width','points','t','text']);id(s.id);
    if(!['pen','highlighter','eraser','line','arrow','rectangle','ellipse','diamond','text'].includes(String(s.tool)))throw new Error('Invalid drawing tool.');
    if(typeof s.color!=='string'||!/^#[0-9a-f]{6}$/i.test(s.color))throw new Error('Use a six-digit hex color.');
    number(s.width,0.1,100);number(s.t,0,3600000);text(s.text,500);
    let last=-1;
    list(s.points,2000).forEach(v=>{const p=list(v,4);if(p.length!==4)throw new Error('Point requires x, y, pressure and elapsed milliseconds.');number(p[0],-10000,10000);number(p[1],-10000,10000);number(p[2],0,1);number(p[3],0,3600000);if(Number(p[3])<last)throw new Error('Point times must be ordered.');last=Number(p[3]);total++});
    return s as StrokeDocument['strokes'][number];
  });unique(strokes);if(total>4000)throw new Error('Drawing point budget exceeded.');
  return x as StrokeDocument;
}
export function validateCard(v:unknown):Card{
  const x=object(v);keys(x,['id','title','topic','kind','prompt','answer','source','evidence','status']);id(x.id);text(x.title,200,true);text(x.topic,100,true);text(x.prompt,2000,true);text(x.answer,2000);validateLink(x.source);
  if(!['cloze','next-step','pattern','bug'].includes(String(x.kind))||x.status!=='draft')throw new Error('Invalid draft card.');
  const e=object(x.evidence);keys(e,['origin','excerpt','step']);if(!['trace','test','self','ai-draft'].includes(String(e.origin)))throw new Error('Invalid evidence origin.');text(e.excerpt,2000);
  if(e.step!==undefined){number(e.step,0,4999);if(!Number.isInteger(e.step))throw new Error('Invalid step.');}
  return x as Card;
}
export function validateSession(v:unknown):SessionPlan{
  const x=object(v);keys(x,['id','title','minutes','items','status']);id(x.id);text(x.title,200,true);
  if(![30,60,90].includes(Number(x.minutes))||typeof x.minutes!=='number'||x.status!=='draft')throw new Error('Invalid draft session budget.');
  const items=list(x.items,20).map(v=>{const i=object(v);keys(i,['id','source','minutes','reason']);id(i.id);validateLink(i.source);number(i.minutes,1,90);if(!Number.isInteger(i.minutes))throw new Error('Use whole minutes.');text(i.reason,500);return i as SessionPlan['items'][number]});unique(items);
  if(items.reduce((n,i)=>n+i.minutes,0)>Number(x.minutes))throw new Error('Session exceeds its time budget.');
  return x as SessionPlan;
}
export function validateDocument(v:unknown):LearningDocument{
  if(byteSize(JSON.stringify(v)||'')>DOCUMENT_CAP)throw new Error('Document exceeds 30 KB.');
  const x=object(v);keys(x,['schemaVersion','kind','origin','status','data']);
  if(x.schemaVersion!==1||x.status!=='draft'||!['manual','ai'].includes(String(x.origin)))throw new Error('Unsupported version or document must be a draft.');
  switch(x.kind){
    case 'flow':validateFlow(x.data);break;
    case 'module':{
      const m=object(x.data);keys(m,['id','title','topic','starterCode','inputs','goal','hints','expectedPattern','tests','renderers']);validateModule(m);break;
    }
    case 'stroke':validateStrokeDocument(x.data);break;
    case 'card':validateCard(x.data);if(x.origin==='ai'&&(x.data as Card).evidence.origin!=='ai-draft')throw new Error('AI cards must declare AI-draft evidence.');break;
    case 'session':validateSession(x.data);break;
    default:throw new Error('Unknown document kind.');
  }
  // A fresh JSON object prevents mutation through caller-owned references.
  return JSON.parse(JSON.stringify(x)) as LearningDocument;
}
export function parseDocument(text:string):LearningDocument{
  if(byteSize(text)>DOCUMENT_CAP)throw new Error('Document exceeds 30 KB.');
  try{return validateDocument(JSON.parse(text))}catch(e){throw new Error(e instanceof SyntaxError?'Malformed JSON.':e instanceof Error?e.message:'Invalid document.')}
}
