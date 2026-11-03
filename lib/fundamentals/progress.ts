import type {StudioState} from '../studio-state';
import type {FundamentalTrack} from './types';
import {conceptQuestions} from './index';
// One record per concept keeps 340 concepts well below the shared record limit.
export const fundamentalRecord=(track:string,concept:string)=>`fundamentals-${track}-${concept}`;
export type RecallRating='ready'|'revise'|'';
export function fundamentalProgress(track:FundamentalTrack,studio:StudioState={}){
  let ready=0,revise=0,attempted=0;
  for(const c of track.concepts){
    const fields=studio[fundamentalRecord(track.id,c.id)]?.fields||{};
    for(const q of conceptQuestions(track,c)){
      if(fields[`rating_${q.lens}`]==='ready')ready++;
      if(fields[`rating_${q.lens}`]==='revise')revise++;
      if(fields[`answer_${q.lens}`]?.trim())attempted++;
    }
  }
  return {ready,revise,attempted,total:track.concepts.length*5};
}
