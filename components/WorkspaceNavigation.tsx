'use client';
import {useState,type MouseEvent} from 'react';
import {workspaceUrl,type WorkspaceView} from '@/lib/workspace-routes';
import {navigationGroups,searchModules} from '@/lib/navigation/catalog';
import {BookOpen,ChartNoAxesCombined,Code2,Sun,UserRound,ChevronRight} from 'lucide-react';
const icons={Today:Sun,Learn:BookOpen,Practice:Code2,Progress:ChartNoAxesCombined,Profile:UserRound};
export const workspaceGroups=navigationGroups.map(g=>({...g,icon:icons[g.name]}));
export type {WorkspaceView};
export default function WorkspaceNavigation({view,go,due,day=1}:{view:WorkspaceView;go:(view:WorkspaceView)=>void;due:number;day?:number}){
 const [query,setQuery]=useState('');
 const active=workspaceGroups.find(g=>g.items.some(([id])=>id===view))||workspaceGroups[0];
 function follow(e:MouseEvent<HTMLAnchorElement>,id:WorkspaceView){if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();setQuery('');go(id)}
 return <nav className="workspace-navigation" aria-label="Workspace navigation">
 <label className="module-search">Find a module<input type="search" placeholder="SQL, interview, generics…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
 {query.trim()?<div className="module-results"><span role="status">{searchModules(query).length} matching modules</span>{searchModules(query).map(item=><a key={item.id} href={workspaceUrl(item.id,day)} onClick={e=>follow(e,item.id)}><strong>{item.label}</strong><small>{item.group} · {item.description}</small></a>)}{!searchModules(query).length&&<p>Try “code”, “design” or “reading”.</p>}<button type="button" onClick={()=>setQuery('')}>Clear search</button></div>:<>
 <div className="navigation-groups">{workspaceGroups.map(g=><a href={workspaceUrl(g.items[0][0],day)} key={g.name} className={g===active?'active':''} onClick={e=>follow(e,g.items[0][0])}><g.icon size={19}/><span>{g.name}</span><ChevronRight size={14}/></a>)}</div>
 <div className="navigation-children" id="navigation-children"><p className="module-group-description">{active.description}</p>{active.sections.map(section=><details className="module-nav-section" key={view+section.title} open={section.items.some(([id])=>id===view)}><summary>{section.title}</summary>{section.items.map(([id,label,description])=><a href={workspaceUrl(id,day)} key={id} title={description} className={view===id?'active':''} aria-current={view===id?'page':undefined} onClick={e=>follow(e,id)}><span>{label}</span>{id==='recall'&&due>0&&<span className="nav-count">{due}</span>}</a>)}</details>)}</div></>}
 </nav>;
}
