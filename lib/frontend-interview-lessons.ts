import {frontendInterviewQuestions} from './frontend-interview';
import type {ReadingLesson} from './commute-guides';
export const frontendInterviewLessons:ReadingLesson[]=frontendInterviewQuestions.map(q=>({
 id:`guide-${q.id}`,title:q.question,category:'Frontend interviews · 3+ years',topic:q.group,
 format:'Question & answer',minutes:6,explanation:q.answer,example:q.example,code:q.depth.code,
 steps:q.depth.flow,pitfall:q.mistake,interview:`${q.depth.opener}\n${q.answer}`,
 recall:q.question,answer:`${q.answer}\n${q.mistake}`,resource:q.depth.sources[0]?.[1],hinglish:q.depth.hinglish,
 exercise:{task:'Rehearse this answer aloud, then answer one follow-up without reading.',acceptance:q.depth.checklist},
}));
