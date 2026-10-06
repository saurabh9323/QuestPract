import type {Progress} from './progress';
import {dateKey,dayDate} from './progress';
import {questionBank} from './bank';
import {quests,chapters} from './curriculum';
import {cartoonLessons,type CartoonLesson} from './cartoon-lessons';
import {readCoachPack,type CoachInput,type CoachPack} from './coach-contract';
import {localVariation} from './coach-variations';
export {readCoachPack,type CoachInput,type CoachPack} from './coach-contract';
export const COACH_SETTINGS='auto-coach-settings',COACH_LIMIT=100;
const questions=new Map(questionBank.map(q=>[q.id,q]));
export function coachKey(input:Pick<CoachInput,'source'|'attemptId'>){const text=input.source+':'+input.attemptId;let a=2166136261,b=5381;for(const c of text){a=Math.imul(a^c.charCodeAt(0),16777619);b=Math.imul(b,33)^c.charCodeAt(0)}return `auto-pack-${(a>>>0).toString(16)}-${(b>>>0).toString(16)}`}
const trim=(s:string)=>s.slice(0,8000);
export function submittedWork(p:Progress):CoachInput[]{
 const list:CoachInput[]=[];
 for(const[id,r]of Object.entries(p.practice||{})){const q=questions.get(id);if(!q)continue;r.attempts.forEach((a,i)=>list.push({source:`question:${id}`,attemptId:a.id,at:a.createdAt,title:q.title,topic:q.topic,question:q.prompt,answer:trim(a.text),previous:trim(r.attempts[i-1]?.text||''),confidence:a.confidence}))}
 for(const[n,d]of Object.entries(p.days)){const q=quests[Number(n)-1];if(!q)continue;(d.submissions||[]).filter(a=>a.status!=='not-started').forEach((a,i)=>{const answer=Object.values(a.answers).map(v=>v.text).join('\n\n')+'\n'+a.notes;if(answer.trim())list.push({source:`day:${n}`,attemptId:a.id,at:a.at,title:q.title,topic:chapters[q.chapter-1].name,question:q.mission,answer:trim(answer),previous:trim(Object.values(d.submissions?.[i-1]?.answers||{}).map(v=>v.text).join('\n')),confidence:a.status})})}
 for(const[id,r]of Object.entries(p.oop||{}))r.attempts.forEach((a,i)=>list.push({source:`oop:${id}`,attemptId:a.id,at:a.createdAt,title:id,topic:'OOP and design',question:'Explain this OOP concept and its trade-offs.',answer:trim(a.text),previous:trim(r.attempts[i-1]?.text||''),confidence:a.confidence}));
 for(const[id,r]of Object.entries(p.studio||{})){
  if(id.startsWith('auto-')||id.startsWith('cartoon-auto-'))continue;
  r.attempts.forEach((a,i)=>{const f=a.fields,answer=f.answer||f.explanation||f.reason||f.correction||'';if(!answer.trim())return;let title=f.title||id,question=f.prompt||f.question||'Explain the idea and apply it to a different example.';if(f.plan)try{const plan=JSON.parse(f.plan);title=String(plan.title||title);question=String(plan.prompt||question)}catch{}list.push({source:`studio:${id}`,attemptId:a.id,at:a.at,title:trim(title),topic:/speak|communication/.test(id)?'Communication':title,question:trim(question),answer:trim(answer),previous:trim(r.attempts[i-1]?.fields.answer||r.attempts[i-1]?.fields.explanation||r.attempts[i-1]?.fields.reason||''),confidence:a.outcome})
  });
 }
 return list.filter(x=>x.answer.trim()).map(x=>({...x,title:x.title.slice(0,300),topic:x.topic.slice(0,300),question:x.question.slice(0,2000),previous:x.previous.slice(0,2000),confidence:x.confidence.slice(0,2000)})).sort((a,b)=>b.at.localeCompare(a.at));
}
function chooseStory(input:CoachInput){
 const text=`${input.title} ${input.topic} ${input.question}`.toLowerCase();
 const specific:[RegExp,string][]=[[/idempotenc/,'idempotency'],[/websocket/,'websocket'],[/rag|retrieval.augmented/,'rag'],[/gpu|cpu/,'cpu-gpu'],[/load balanc/,'load-balancer'],[/message queue|kafka|rabbitmq/,'message-queue'],[/\bacid\b|transaction/,'acid'],[/sql.*join|\bjoin\b/,'sql-join'],[/group by|having|aggregate/,'sql-group'],[/database index|sql index|query plan/,'indexes'],[/memo|react context|usecontext/,'react-context-memo'],[/django/,'django'],[/ci\/cd|pipeline/,'cicd'],[/two.pointer/,'two-pointers'],[/graph/,'graph-visited'],[/depth.first|\bdfs\b/,'dfs'],[/frequency|anagram/,'string-counts']];
 const specificMatch=specific.find(([pattern])=>pattern.test(text));if(specificMatch)return cartoonLessons.find(l=>l.id===specificMatch[1]);
 const routes:[RegExp,string][]=[[/two.?sum|map|hash/,'map-set'],[/duplicate|\bset\b/,'map-set'],[/binary search/,'binary-search'],[/sliding|substring/,'substring-window'],[/monotonic|warmer/,'monotonic-stack'],[/stack|bracket/,'stack'],[/queue|breadth|\bbfs\b/,'queue'],[/tree|depth|\bdfs\b/,'trees-bfs'],[/backtrack|permutation|subset/,'backtracking'],[/dynamic programming|\bdp\b/,'dp-ways'],[/bitwise|xor|bit manipulation/,'bitwise'],[/sql|join|database|postgres/,'sql-where'],[/redis|cache/,'redis'],[/react|render|memo|context/,'react-render'],[/closure|counter/,'closure'],[/event loop|promise|async|javascript/,'event-loop'],[/oop|solid|polymorph|encapsul|inheritance/,'oop'],[/docker|container|ci\/cd|deploy/,'docker'],[/python|django|flask/,'flask'],[/c#|\.net|dotnet/,'dotnet'],[/communicat|speak|behavior|interview|confidence/,'communication'],[/aws|serverless/,'serverless'],[/linux|terminal/,'linux'],[/system|architecture|api|node|server/,'hld-lld']];
 const match=routes.find(([r])=>r.test(text));return match?cartoonLessons.find(l=>l.id===match[1]):undefined;
}
export function createLocalPack(input:CoachInput,now=new Date()):CoachPack{
 const key=coachKey(input),seed=parseInt(key.split('-')[2],16),selected=chooseStory(input);
 const observations=[`You submitted ${input.answer.trim().split(/\s+/).length} words. This engine uses topic and text signals; it has not executed or graded your answer.`];
 if(input.previous)observations.push(input.previous.trim()===input.answer.trim()?'This matches your previous submission. Try explaining one assumption without copying.':'Your answer differs from the previous attempt. Describe one change and why you made it.');
 if(!/because|therefore|so that|kyunki|isliye|trade.?off/i.test(input.answer))observations.push('No explicit reasoning connector was detected. Add a sentence explaining why your choice works.');
 if(!/edge|empty|null|duplicate|failure|retry|boundary|negative|timeout|exception/i.test(input.answer))observations.push('No common boundary/failure-case words were detected. Choose one relevant case to discuss.');
 let challenge=`Explain “${input.title}” to a teammate with one concrete example, then change one assumption and explain what breaks.`,hint='Start with the input, the rule that must stay true, and the result. Say what your example does not prove.';
 const world=selected?.world||'stage';
 let lesson:CartoonLesson=selected?{...selected,id:key,title:`Your next step: ${selected.title}`,scenes:selected.scenes.map(s=>({...s,items:[...s.items],active:[...s.active]}))}:{id:key,category:'Personal recall',title:'Teach the idea back',world,why:`Revisit your explanation of ${input.title}.`,limit:'This is a reflection scaffold, not a technical review of your answer.',scenes:[{title:'Name the idea',say:'Tell Pip what problem you are solving in one simple sentence.',technical:input.question,code:'Problem → input → expected result',items:['Problem','Input','Result'],active:[0]},{title:'Show one example',say:'Pick a tiny example. Explain each step without looking at your saved answer.',technical:'Choose explicit input values and state the expected behavior.',code:'Concrete input → steps → expected output',items:['Example','Steps','Output'],active:[0,1,2]},{title:'Change one rule',say:'Now change one condition. Tell Pip what must change in your explanation.',technical:'Name assumptions and describe a counterexample or limitation.',code:'Assumption → change → consequence',items:['Assumption','Change','Consequence'],active:[1,2]}],quiz:{question:'What shows understanding beyond repeating a definition?',choices:['Applying it to a new example and explaining why','Repeating the same sentence faster','Counting pages read'],answer:0,why:'A different example checks whether you can use the idea.'}};
 if(/two.?sum/i.test(input.title)){
  const a=2+seed%8,b=12+seed%11,target=a+b,values=[a,b,40+seed%10];
  challenge=`Return distinct indices adding to ${target} in ${JSON.stringify(values)}. Then handle [${a},${a}] with target ${2*a}. Explain why lookup must happen before insertion.`;
  hint='What earlier value do you need, and which information must you store to return its index?';
  const code='function twoSum(nums,target){\n  const seen=new Map();\n  for(let i=0;i<nums.length;i++){\n    const need=target-nums[i];\n    if(seen.has(need))return [seen.get(need),i];\n    seen.set(nums[i],i);\n  }\n  return [];\n}';
  lesson={id:key,category:'Generated Two Sum variation',title:'Pip finds your new pair',world:'array',why:'Use value → earlier index to preserve the distinct-index rule.',limit:'This trace comes from the built-in Map algorithm, not from executing your submitted code.',scenes:[{title:'Read the first value',say:`Pip sees ${a}. Its partner ${b} has not arrived yet.`,technical:`At index 0, need=${target}-${a}=${b}; Map is empty.`,code:`seen.set(${a},0)`,items:values.map(String),active:[0]},{title:'Remember the earlier partner',say:`Now ${b} arrives. Pip remembers ${a} at position zero.`,technical:`At index 1, need=${a}; seen.has(${a}) is true.`,code:`return [seen.get(${a}),1]; // [0,1]`,items:values.map(String),active:[0,1]},{title:'Try equal partners',say:`Two ${a}s can be a pair when they sit in different positions.`,technical:'Lookup before storing prevents the current index from matching itself. Expected O(n) time and O(n) auxiliary space.',code,items:[String(a),String(a),'Indices [0,1]'],active:[0,1]}],quiz:{question:`For [${a},${a}] and target ${2*a}, which result uses two distinct positions?`,choices:['[0,0]','[0,1]','No pair can exist'],answer:1,why:'Equal values are permitted; reusing the same index is not.'}};
 }else if(/duplicate|\bset\b/i.test(input.title)){
  const n=1+seed%9,values=[n,n+3,n];challenge=`Does ${JSON.stringify(values)} contain a duplicate? Return a Boolean using a Set; then explain what extra information you need to count repeats.`;
  hint='Check membership before adding the current value.';lesson={...lesson,id:key,title:'Pip checks the guest list',world:'array',limit:'A generated reference trace; the submitted code is not executed.',scenes:values.map((x,i)=>({title:`Arrival ${i+1}`,say:i===2?`${x} is already on the list. Pip has found a repeat.`:`${x} is new. Pip adds it to the guest list.`,technical:i===2?'has(value) returns true; stop.':'Membership is sufficient for a Boolean duplicate check.',code:i===2?'return true;':`seen.add(${x});`,items:values.map(String),active:[i]})),quiz:{question:'Which structure is sufficient for a yes/no duplicate check?',choices:['Set','A Map is always required','A sorted tree is always required'],answer:0,why:'Only membership is required; counts would need more information.'}};
 }else if(selected){
  const changes=['Describe one boundary case and predict the result.','Compare this approach with an alternative and name a trade-off.','Remove one assumption from the example and explain whether it still works.'];challenge=`For “${input.title}”: ${changes[seed%changes.length]} Then explain the related ${selected.title} example without hints.`;
 }
 if(selected?.id==='trees-bfs')lesson={...lesson,layout:'bfs-tree'};
 if(selected?.id==='linux')lesson={...lesson,layout:'linux-path'};
 const variation=localVariation(input,key,seed);if(variation){lesson=variation.lesson;challenge=variation.challenge;hint=variation.hint}
 if(selected&&!variation&&!/two.?sum|duplicate|\bset\b/i.test(input.title))lesson={...lesson,limit:`Related authored example selected by topic; not an animation of your code. ${lesson.limit}`};
 return {version:1,mode:'local',input,observations,challenge,hint,checklist:['State the input and assumptions.','Give a concrete expected result or observable behavior.','Explain why the approach works and one limitation.','Explain it aloud in 60 seconds.'],lesson,createdAt:now.toISOString(),due:dayDate(dateKey(now),1),sources:[]};
}
export function addCoachPack(p:Progress,input:CoachInput,now=new Date()):Progress{
 const key=coachKey(input);if(p.studio?.[key])return p;
 if(Object.keys(p.studio||{}).length>=1900||Object.keys(p.studio||{}).filter(k=>k.startsWith('auto-pack-')).length>=COACH_LIMIT)return p;
 const pack=JSON.stringify(createLocalPack(input,now));if(!readCoachPack(pack))return p;
 const ai=p.studio?.[COACH_SETTINGS]?.fields.aiAuto==='yes';
 return {...p,studio:{...p.studio,[key]:{fields:{type:'auto-pack',pack,cloudStatus:ai?'pending':'off',requestId:ai?crypto.randomUUID():'',research:p.studio?.[COACH_SETTINGS]?.fields.research==='yes'?'yes':'no'},attempts:[],updatedAt:now.toISOString()}}};
}
export function autoCoachAfterSubmission(previous:Progress,next:Progress):Progress{
 if(next.studio?.[COACH_SETTINGS]?.fields.enabled==='no')return next;
 const old=new Set(submittedWork(previous).map(coachKey));let result=next;
 // Only fresh explicit submissions trigger work; loading an account never backfills it.
 for(const input of submittedWork(next).filter(x=>!old.has(coachKey(x))).slice(0,3))result=addCoachPack(result,input);
 return result;
}
export function preserveCoachArtifacts(previous:Progress,next:Progress):Progress{
 const studio={...next.studio};
 for(const [id,old] of Object.entries(previous.studio||{})){
  if(!id.startsWith('auto-pack-'))continue;
  const current=studio[id];if(!current){studio[id]=old;continue}
  // A textarea save made before React received an AI response must not erase it
  // or reopen the completed request. A deliberate retry has a new request ID.
  if(old.fields.requestId===current.fields.requestId&&['complete','failed'].includes(old.fields.cloudStatus)&&!['complete','failed'].includes(current.fields.cloudStatus)){
   studio[id]={...current,fields:{...current.fields,cloudStatus:old.fields.cloudStatus,cloudError:old.fields.cloudError||'',...(old.fields.aiPack?{aiPack:old.fields.aiPack}:{})}};
  }else if(old.fields.aiPack&&!current.fields.aiPack){studio[id]={...current,fields:{...current.fields,aiPack:old.fields.aiPack}}}
 }
 return {...next,studio};
}
