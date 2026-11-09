import {webPathLessons} from './web-lessons';
import {backendPathLessons} from './backend-lessons';
import {fundamentalCatalog} from '../fundamentals/catalog';

export const learningPathLessons=[...webPathLessons,...backendPathLessons];
export const learningPathTracks=[...fundamentalCatalog.map(track=>({id:track.id,name:track.name})),{id:'dsa',name:'DSA'},{id:'system-design',name:'System design'}];
export const learningPhases=[
 {id:'understand',title:'Understand',action:'Name the problem and connect it to a real-life example.',anchor:'lesson-idea'},
 {id:'trace',title:'Trace execution',action:'Predict each state change, then step through the flow.',anchor:'lesson-walkthrough'},
 {id:'build',title:'Try it yourself',action:'Change one condition, test a boundary and explain the result.',anchor:'lesson-build'},
 {id:'explain',title:'Explain in interviews',action:'Give the mechanism, an example and a trade-off without reading.',anchor:'lesson-interview'},
] as const;
