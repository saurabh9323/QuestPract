import type {WorkspaceView} from '../workspace-routes';
export type NavigationSection={title:string;items:readonly (readonly [WorkspaceView,string,string])[]};
export const navigationCatalog:readonly {name:'Today'|'Learn'|'Practice'|'Progress'|'Profile';description:string;sections:readonly NavigationSection[]}[]=[
 {name:'Today',description:'Choose today’s work and manage your time.',sections:[{title:'Your daily plan',items:[['dashboard','Today overview','Your next action and daily progress'],['quest','Daily quest','Follow the current course day'],['planner','Schedule','Reschedule and prioritize your work'],['tasks','Tasks & notes','Keep actions and personal notes together']]}]},
 {name:'Learn',description:'Build understanding before solving a problem.',sections:[
 {title:'1 · Build the basics',items:[['fundamentals','Language fundamentals','Core concepts across languages and frameworks'],['oops','OOP & API basics','Objects, constructors, generics and reliability'],['patternLab','DSA patterns','Recognize patterns and compare approaches']]},
 {title:'2 · Read and explore',items:[['commute','Commute lessons','Short reading, recall and saved notes'],['theory','Topic deep dives','Structured theory with examples'],['library','Skill curriculum','Explore the full-stack learning chapters']]},
 {title:'3 · See how it works',items:[['visual','Visual lab','Step through interactive examples'],['cartoons','Cartoon lessons','Learn with illustrated stories'],['discovery','Discovery inbox','Review suggested learning updates']]}]},
 {name:'Practice',description:'Apply an idea, test your reasoning, then rehearse it.',sections:[
 {title:'1 · Solve and recall',items:[['studio','Practice studio','Small guided exercises and tools'],['bank','Question bank','Choose a question and save attempts'],['challenges','Personal challenges','Rounds based on submitted course days'],['brain','Daily brainstorm','A short reasoning challenge']]},
 {title:'2 · Code and experiment',items:[['playground','Code playground','Edit JavaScript and inspect execution traces'],['repairLab','Repair & recall','Fix incomplete code and revisit patterns'],['insideApp','Inside a real app','Follow how a working application fits together'],['sqlGame','SQL expedition','Solve query missions in a sample database']]},
 {title:'3 · Design systems',items:[['flows','Flow & system designer','Build your own diagrams and system flows'],['dojo','Dojo design labs','Practise architecture decisions and trade-offs']]},
 {title:'4 · Prepare for interviews',items:[['materials','Interview materials','Technology-specific questions and model explanations'],['interview','Mock interview','Rehearse technical and behavioral rounds'],['communication','Communication coach','Practise clear sentences and spoken answers'],['autoCoach','Personal tutor follow-ups','Revisit generated practice from your submissions']]}]},
 {name:'Progress',description:'Review evidence of practice and decide what to revisit.',sections:[{title:'Review and reflect',items:[['career','Career Tracker','Open-source contributions, hackathons, WIP limits and weekly reviews'],['recall','Recall room','Revisit due reviews without looking at answers'],['analytics','Learning analytics','Inspect your saved activity and study time'],['journey','90-day calendar','See your course completion by day'],['timeline','DSA learning path','Follow the scheduled coding progression']]}]},
 {name:'Profile',description:'Manage your account, appearance and saved data.',sections:[{title:'Your workspace',items:[['profile','My profile','Goals and account identity'],['designer','Appearance & layouts','Choose colors and saved layouts'],['settings','Settings & data','Sync, backup, import and account settings']]}]}
];
const aliases:Partial<Record<WorkspaceView,string>>={
 dashboard:'mission control overview',planner:'my schedule manage my schedule',
 oops:'OOP studio concept studio object oriented programming',
 commute:'commute library reading',theory:'theory studio',library:'skill library',
 cartoons:'cartoon classroom',playground:'module playground',
 autoCoach:'auto coach',designer:'workspace studio customization colours colors',
 analytics:'analytics dashboard',bank:'practice bank questions',
 journey:'course journey roadmap',timeline:'90 day timeline',
 materials:'interview preparation revision',interview:'ChatGPT interview',
};
export const navigationEntries=navigationCatalog.flatMap(group=>group.sections.flatMap(section=>section.items.map(([id,label,description])=>({id,label,description,group:group.name,section:section.title,keywords:aliases[id]||''}))));
export const navigationByView=Object.fromEntries(navigationEntries.map(e=>[e.id,e])) as Record<WorkspaceView,typeof navigationEntries[number]>;
export const navigationGroups=navigationCatalog.map(g=>({...g,items:g.sections.flatMap(s=>s.items.map(([id,label])=>[id,label] as const))}));
export const navigationLabels=Object.fromEntries(navigationEntries.map(e=>[e.id,e.label])) as Record<WorkspaceView,string>;
export function searchModules(query:string){const words=query.trim().toLowerCase().split(/\s+/);return navigationEntries.filter(e=>words.every(w=>(e.label+' '+e.description+' '+e.group+' '+e.id+' '+e.keywords).toLowerCase().includes(w)));}
// Keep previously saved Learn colors on the moved interview-materials page.
export function navigationThemeGroup(view:WorkspaceView){return view==='materials'?'Learn':navigationEntries.find(e=>e.id===view)?.group||'Portal';}

