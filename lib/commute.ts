import {questionBank,theory} from './bank';
import {commuteGuides,type ReadingLesson} from './commute-guides';
import {foundationLessons} from './foundations';
import {designGuide} from './system-design';
import {questionExamples} from './question-examples';
export type {ReadingLesson} from './commute-guides';
const modules=new Map(theory.map(t=>[t.id,t]));
function category(id:string,kind:string){
  if(kind!=='Interview')return kind;
  if(id.startsWith('int-js')||id.startsWith('int-async'))return 'JavaScript';
  if(/int-(react|next|typescript|ts)/.test(id))return 'React & TypeScript';
  if(/int-(python|fastapi)/.test(id))return 'Python';
  if(/int-(oop|functional)/.test(id))return 'OOP & design';
  if(/int-(cloud|delivery)/.test(id))return 'AWS & DevOps';
  if(id.startsWith('int-behavior'))return 'English & confidence';
  return 'Full-stack engineering';
}
// Stable note IDs retain bookmarks, notes and recall history across content upgrades.
const scenarioNotes:ReadingLesson[]=questionBank.map(q=>{
  const lesson=modules.get(q.lessonId);
  if(!lesson)throw new Error('Missing theory module for '+q.id);
  const g=q.kind==='System design'?designGuide(q):null;
  const b=g?.blueprint;
  const worked=questionExamples[q.id];
  return {id:'note-'+q.id,title:q.title,category:category(q.lessonId,q.kind),topic:q.topic,
    format:b?'Design answer':q.kind==='DSA'?'Scenario note':'Question & answer',minutes:b?5:3,
    explanation:worked?.answer||q.logic,
    example:worked?.example||g?.scenario?.example||q.prompt,
    steps:b?[
      {title:b.nodes[0],detail:g?.scenario?.example||q.prompt,state:b.contract},
      {title:b.nodes[1],detail:q.logic,state:b.data},
      {title:b.nodes[2],detail:b.tradeoff,state:b.contract},
      {title:b.nodes[3],detail:b.failure,state:'Failure to investigate: '+b.failure},
    ]:worked?[
      {title:'Input',detail:worked.example,state:worked.code},
      {title:'Mechanism',detail:worked.answer,state:worked.hint},
      {title:'Result',detail:'Trace each expression in order.',state:worked.output},
      {title:'Boundary',detail:worked.trap,state:q.rubric},
    ]:[
      {title:'Question',detail:q.prompt,state:q.topic},
      {title:'Reasoning',detail:q.logic,state:'Reference answer · explain why this holds'},
      {title:'Explain',detail:q.summary,state:q.kind==='SQL'?'State result grain, NULL behavior and duplicates.':q.kind==='DSA'?'Trace the given input; then change one boundary.':'Apply the mechanism to your own implementation.'},
      {title:'Self-check',detail:q.rubric,state:'Compare your explanation with the reference, then attempt independently.'},
    ],
    pitfall:worked?.trap||b?.failure||lesson.pitfalls,interview:worked?.answer||q.logic,
    recall:q.prompt,answer:worked?.answer||q.logic,resource:q.resource,practiceId:q.id,
    questions:[{question:q.prompt,answer:worked?.answer||q.logic}],
    ...(worked?{code:worked.code,output:worked.output}:{}),
    ...(b?{code:b.contract+'\n\nData model:\n'+b.data,useWhen:'Use this design to reason about: '+q.prompt}:{}),
  };
});
export const readingLibrary:ReadingLesson[]=[...foundationLessons,...commuteGuides,...scenarioNotes];
export const readingCategories=[...new Set(readingLibrary.map(l=>l.category))].sort();
export function lessonMarkdown(l:ReadingLesson){return `# ${l.title}\n\n${l.category} · ${l.format} · About ${l.minutes} minutes\n\n## Understand\n${l.explanation}${l.useWhen?`\n\n## When to use\n${l.useWhen}`:''}${l.hinglish?`\n\n## Hinglish help\n${l.hinglish}`:''}${l.methods?`\n\n## Methods\n${l.methods.map(m=>`- ${m.name}: ${m.use} Example: ${m.example}`).join('\n')}`:''}${l.questions?`\n\n## Questions and answers\n${l.questions.map(q=>`Q: ${q.question}\nA: ${q.answer}`).join('\n\n')}`:''}\n\n## Example\n${l.example}\n${l.code?`\n\`\`\`\n${l.code}\n\`\`\`\n`:''}${l.output?`\nExpected result: ${l.output}\n`:''}\n## Follow the flow\n${l.steps.map((s,i)=>`${i+1}. **${s.title}**: ${s.detail}\n\n   ${s.state.replace(/\n/g,'; ')}`).join('\n\n')}\n\n## Common trap\n${l.pitfall}\n\n## Say it in an interview\n${l.interview}\n\n## Recall\n${l.recall}\n\n## Recall guide\n${l.answer}\n${l.resource?`\nReference: ${l.resource}\n`:''}`;}
