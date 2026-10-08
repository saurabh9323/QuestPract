import {interviewTopics} from './interview-topics';
export const workspacePaths={materials:'interview-materials',autoCoach:'auto-coach',dashboard:'today',challenges:'challenges',studio:'practice',commute:'commute',cartoons:'cartoons',visual:'visual-lab',profile:'profile',timeline:'timeline',planner:'schedule',bank:'questions',theory:'theory',brain:'brainstorm',interview:'interview',analytics:'analytics',oops:'oop',journey:'journey',quest:'day',recall:'revision',library:'skills',tasks:'tasks',settings:'settings',communication:'communication'} as const;
export type WorkspaceView=keyof typeof workspacePaths;
export function workspaceUrl(view:WorkspaceView,day=1){return `/${workspacePaths[view]}/${view==='quest'||view==='communication'?`${Math.max(1,Math.min(90,Math.trunc(day)))}/`:''}`}
export function parseWorkspacePath(path:string):{view:WorkspaceView;day?:number}|null{
 const parts=path.split('/').filter(Boolean);if(!parts.length)return {view:'dashboard'};
 const entry=Object.entries(workspacePaths).find(([,slug])=>slug===parts[0]);if(!entry)return null;
 const view=entry[0] as WorkspaceView;
 if(view==='materials')return parts.length===1||(parts.length===2&&interviewTopics.some(t=>t.slug===parts[1]))?{view}:null;
 if(view==='quest'||view==='communication'){if(parts.length===1)return {view,day:1};if(parts.length!==2||!/^\d+$/.test(parts[1]))return null;const day=Number(parts[1]);return day>=1&&day<=90?{view,day}:null;}
 return parts.length===1?{view}:null;
}
export const workspaceStaticPaths=Object.entries(workspacePaths).flatMap(([view,slug])=>view==='materials'?[[slug],...interviewTopics.map(t=>[slug,t.slug])]:view==='quest'||view==='communication'?[[slug],...Array.from({length:90},(_,i)=>[slug,String(i+1)])]:[[slug]]);
