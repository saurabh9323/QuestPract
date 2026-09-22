import {questionBank,theory} from './bank';
import {commuteGuides,type ReadingLesson} from './commute-guides';
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
// Scenario notes reuse the authored curriculum rather than inventing 1,000 new facts.
// The topic example is explicitly labelled; it is not represented as a solved answer.
const scenarioNotes:ReadingLesson[]=questionBank.map(q=>{
  const lesson=modules.get(q.lessonId);
  if(!lesson)throw new Error(`Missing theory module for ${q.id}`);
  return {id:`note-${q.id}`,title:q.title,category:category(q.lessonId,q.kind),topic:q.topic,format:'Scenario note',minutes:3,
    explanation:`${lesson.explanation}\n\nApplied to this scenario: ${q.logic}`,
    example:`Scenario: ${q.prompt}\n\nRelated topic example: ${lesson.workedExample}`,
    steps:[{title:'Understand the scenario',detail:q.prompt,state:`Topic: ${q.topic}`},{title:'Find the key idea',detail:q.logic,state:'Reasoning clue, not executed code'},{title:'Connect an example',detail:lesson.workedExample,state:`Topic flow: ${q.flow.join(' → ')}`},{title:'Check the boundaries',detail:lesson.pitfalls,state:q.rubric}],
    pitfall:lesson.pitfalls,interview:q.summary,recall:`Explain the reasoning for “${q.title}” in your own words. Which assumption would change your answer?`,answer:`Key point: ${q.logic}\n\nSelf-check: ${q.rubric}`,resource:q.resource,practiceId:q.id};
});
export const readingLibrary:ReadingLesson[]=[...commuteGuides,...scenarioNotes];
export const readingCategories=[...new Set(readingLibrary.map(l=>l.category))].sort();
export function lessonMarkdown(l:ReadingLesson){return `# ${l.title}\n\n${l.category} · ${l.format} · About ${l.minutes} minutes\n\n## Understand\n${l.explanation}\n\n## Example\n${l.example}\n${l.code?`\n\`\`\`\n${l.code}\n\`\`\`\n`:''}${l.output?`\nExpected result: ${l.output}\n`:''}\n## Follow the flow\n${l.steps.map((s,i)=>`${i+1}. **${s.title}**: ${s.detail}\n\n   ${s.state.replace(/\n/g,'; ')}`).join('\n\n')}\n\n## Common trap\n${l.pitfall}\n\n## Say it in an interview\n${l.interview}\n\n## Recall\n${l.recall}\n\n## Recall guide\n${l.answer}\n${l.resource?`\nReference: ${l.resource}\n`:''}`;}
