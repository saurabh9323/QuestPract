import {fundamentalTracks,conceptQuestions} from './index';
import type {ReadingLesson} from '../commute-guides';
export const fundamentalLessons:ReadingLesson[]=fundamentalTracks.flatMap(t=>t.concepts.map(c=>({
 id:`guide-fundamentals-${t.id}-${c.id}`,title:`${t.name}: ${c.title}`,category:`Fundamentals · ${t.name}`,topic:c.category,
 format:'Question & answer',minutes:5,explanation:c.definition,example:c.example,code:c.code,output:c.output,
 useWhen:c.why,pitfall:c.pitfall,interview:`${c.definition} ${c.example}`,recall:`Explain ${c.title} and one mistake to avoid.`,answer:`${c.definition} ${c.pitfall}`,
 resource:t.sources[0]?.url,questions:conceptQuestions(t,c).map(q=>({question:q.question,answer:q.answer})),
 steps:[{title:'Understand the contract',detail:c.definition,state:c.title},{title:'Follow the example',detail:c.example,state:c.output},{title:'Explain the execution',detail:c.execution,state:'Conceptual explanation — not a recorded runtime trace'},{title:'Check the boundary',detail:c.pitfall,state:c.exercise}],
 exercise:{task:c.exercise,acceptance:['State your assumptions.','Explain the expected behavior.','Test a failure or edge case in your own environment.']},
} satisfies ReadingLesson)));
