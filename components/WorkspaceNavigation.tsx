'use client';
import {BookOpen,ChartNoAxesCombined,Code2,Sun,UserRound,ChevronRight} from 'lucide-react';

const groups = [
  {name:'Today',icon:Sun,items:[['dashboard','Overview'],['quest','Daily quest'],['planner','My schedule'],['tasks','Tasks & notes']]},
  {name:'Learn',icon:BookOpen,items:[['commute','Commute library'],['visual','Visual lab'],['theory','Theory studio'],['oops','OOP studio'],['library','Skill library']]},
  {name:'Practice',icon:Code2,items:[['studio','Practice studio'],['bank','Question bank'],['brain','Daily brainstorm'],['interview','Mock interview']]},
  {name:'Progress',icon:ChartNoAxesCombined,items:[['journey','90-day calendar'],['timeline','DSA learning path'],['analytics','Analytics'],['recall','Recall room']]},
  {name:'Profile',icon:UserRound,items:[['profile','My profile'],['settings','Settings & data']]},
] as const;
export type WorkspaceView = typeof groups[number]['items'][number][0];

export default function WorkspaceNavigation({view,go,due}:{view:WorkspaceView;go:(view:WorkspaceView)=>void;due:number}){
  const active = groups.find(g=>g.items.some(([id])=>id===view)) || groups[0];
  return <nav className="workspace-navigation" aria-label="Workspace navigation">
    <div className="navigation-groups">{groups.map(g=><button type="button" key={g.name} className={g===active?'active':''} aria-expanded={g===active} aria-controls="navigation-children" onClick={()=>go(g.items[0][0])}><g.icon size={19}/><span>{g.name}</span><ChevronRight size={14}/></button>)}</div>
    <div className="navigation-children" id="navigation-children"><span className="navigation-caption">{active.name}</span>{active.items.map(([id,label])=><button type="button" key={id} className={view===id?'active':''} aria-current={view===id?'page':undefined} onClick={()=>go(id)}><span>{label}</span>{id==='recall'&&due>0&&<span className="nav-count">{due}</span>}</button>)}</div>
  </nav>;
}
