import {webTracks} from './web';
import {languageTracks} from './languages';
import {backendTracks} from './backend';
import {fundamentalCatalog} from './catalog';
import type {FundamentalConcept,FundamentalQuestion,FundamentalTrack} from './types';
export const fundamentalTracks:FundamentalTrack[]=fundamentalCatalog.map(meta=>{
  const track=[...webTracks,...languageTracks,...backendTracks].find(t=>t.id===meta.id);
  if(!track)throw new Error(`Missing fundamentals track: ${meta.id}`);
  return track;
});
export function conceptQuestions(track:FundamentalTrack,c:FundamentalConcept):FundamentalQuestion[]{
  const id=`${track.id}-${c.id}`;
  return [
    {id:`${id}-explain`,conceptId:c.id,lens:'Explain',question:`What is ${c.title} in ${track.name}? Explain it without relying on jargon.`,answer:c.definition},
    {id:`${id}-apply`,conceptId:c.id,lens:'Apply',question:`When would you use ${c.title}, and what problem does it solve?`,answer:c.why},
    {id:`${id}-demonstrate`,conceptId:c.id,lens:'Demonstrate',question:`Can you demonstrate ${c.title} with a concrete example and its expected behavior?`,answer:`${c.example}\n\nExpected behavior: ${c.output}`},
    {id:`${id}-trace`,conceptId:c.id,lens:'Trace',question:`For the ${c.title} example, what happens during execution or processing?`,answer:c.execution},
    {id:`${id}-diagnose`,conceptId:c.id,lens:'Diagnose',question:`What mistake would you look for when reviewing code involving ${c.title}?`,answer:c.pitfall},
  ];
}
export function trackQuestions(track:FundamentalTrack){return track.concepts.flatMap(c=>conceptQuestions(track,c))}
export function fundamentalsMarkdown(track:FundamentalTrack){return `# ${track.name} fundamentals\n\n${track.kind} · 20 concepts × 5 interview angles\n\n${track.summary}\n\n## Execution model\n${track.runtime.map((s,i)=>`${i+1}. ${s}`).join('\n')}\n\n## Concurrency and threads\n${track.threading}\n\nExamples are illustrative, not executed or judged by this guide. Verify version-specific behavior in the references.\n\n${track.concepts.map(c=>`## ${c.title}\n\n${conceptQuestions(track,c).map(q=>`### ${q.question}\n${q.answer}`).join('\n\n')}\n\n### Example code\n\n\`\`\`\n${c.code}\n\`\`\`\n\n### Try it yourself\n${c.exercise}`).join('\n\n')}\n\n## References\n${track.sources.map(s=>`- [${s.label}](${s.url})`).join('\n')}`}
