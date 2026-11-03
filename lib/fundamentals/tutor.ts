import type {FundamentalConcept,FundamentalQuestion,FundamentalTrack} from './types';
// FloatingTutor pins at most 1,600 characters. Match that existing boundary.
export function fundamentalTutorContext(track:FundamentalTrack,concept:FundamentalConcept,q:FundamentalQuestion,draft:string){
 const source=[`${track.name}: ${concept.title}`,q.question,`My draft: ${draft.slice(0,500)||'(not written)'}`,`Reference: ${q.answer}`,`Illustrative code (not executed):\n${concept.code}`,`Expected behavior: ${concept.output}`].join('\n\n');
 const trimmed=source.length>1600||draft.length>500;
 return {text:source.slice(0,1600),trimmed};
}
