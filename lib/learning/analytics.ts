import type {StudioState} from '../studio-state';
import {readLearning} from './persistence';
export function learningCounts(state:StudioState={}){
  const {documents,invalid}=readLearning(state);
  const counts={flow:0,module:0,stroke:0,card:0,session:0,aiDrafts:0,invalid:invalid.length,total:documents.length};
  for(const {document:d} of documents){counts[d.kind]++;if(d.origin==='ai')counts.aiDrafts++}
  return counts;
}
