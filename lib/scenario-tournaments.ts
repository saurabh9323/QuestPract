import type {VisualScenario} from './visual-scenarios';

export type RoundProblem=Pick<VisualScenario,'id'|'title'|'topic'|'difficulty'|'input'|'expected'|'prompt'|'explanation'>;
export type RoundResult={id:string;title:string;input:RoundProblem['input'];prompt:string;submitted:string;expected:unknown;explanation:string;correct:boolean;validJson:boolean;points:number};
export function snapshotProblems(catalog:VisualScenario[],count:number,random:()=>number=Math.random):RoundProblem[]{
 const bag=[...catalog];for(let i=bag.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]]}
 // First choose different topics where possible, then fill remaining positions.
 const picked:VisualScenario[]=[],topics=new Set<string>();
 for(const q of bag)if(!topics.has(q.topic)&&picked.length<count){picked.push(q);topics.add(q.topic)}
 for(const q of bag)if(picked.length<count&&!picked.some(x=>x.id===q.id))picked.push(q);
 return picked.map(({id,title,topic,difficulty,input,expected,prompt,explanation})=>({id,title,topic,difficulty,input,expected,prompt,explanation}));
}
function canonical(value:unknown):string{
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value!==null&&typeof value==='object')return '{'+Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>JSON.stringify(k)+':'+canonical(v)).join(',')+'}';
 return JSON.stringify(value);
}
export function isFiniteJson(value:unknown,depth=0):boolean{
 if(depth>50)return false;
 if(typeof value==='number')return Number.isFinite(value);
 if(value===null||typeof value==='string'||typeof value==='boolean')return true;
 if(Array.isArray(value))return value.every(v=>isFiniteJson(v,depth+1));
 if(typeof value==='object'&&value)return Object.values(value).every(v=>isFiniteJson(v,depth+1));
 return false;
}
export function readStringMap(value:string|undefined):Record<string,string>|null{const parsed=readJson<unknown>(value,null);return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)&&Object.values(parsed).every(v=>typeof v==='string')?parsed as Record<string,string>:null}
export function readProblems(value:string|undefined):RoundProblem[]|null{
 const parsed=readJson<unknown>(value,null);if(!Array.isArray(parsed)||!parsed.length||parsed.length>8)return null;
 if(!parsed.every(q=>q&&['id','title','topic','difficulty','prompt','explanation'].every(k=>typeof q[k]==='string')&&q.input&&Array.isArray(q.input.nums)&&q.input.nums.every((n:unknown)=>typeof n==='number'&&Number.isFinite(n))&&isFiniteJson(q.expected)))return null;
 return new Set(parsed.map(q=>q.id)).size===parsed.length?parsed:null;
}
export function readResults(value:string|undefined):RoundResult[]|null{const parsed=readJson<unknown>(value,null);return Array.isArray(parsed)&&parsed.length>0&&parsed.length<=8&&parsed.every(q=>q&&['id','title','prompt','submitted','explanation'].every(k=>typeof q[k]==='string')&&typeof q.correct==='boolean'&&typeof q.validJson==='boolean'&&(q.points===0||q.points===100)&&q.input&&isFiniteJson(q.input)&&isFiniteJson(q.expected))?parsed:null}
export function gradeRound(problems:RoundProblem[],answers:Record<string,string>):RoundResult[]{return problems.map(q=>{
 const submitted=answers[q.id]||'';let correct=false,validJson=false;
 try{const value=JSON.parse(submitted);validJson=isFiniteJson(value);correct=validJson&&isFiniteJson(q.expected)&&canonical(value)===canonical(q.expected)}catch{/* Invalid or missing JSON receives zero points. */}
 return {id:q.id,title:q.title,input:q.input,prompt:q.prompt,submitted,expected:q.expected,explanation:q.explanation,correct,validJson,points:correct?100:0};
})}
export function readJson<T>(value:string|undefined,fallback:T):T{try{return value?JSON.parse(value) as T:fallback}catch{return fallback}}
