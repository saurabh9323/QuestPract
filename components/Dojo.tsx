'use client';
import {dojoChallenges} from '@/lib/dojo';
import {orderedCases,sections,type Section} from '@/lib/dojo-course';
import {useRouteQuery,updateRouteQuery} from '@/lib/workspace-location';
import DojoLibrary from './dojo/DojoLibrary';
import ChallengeRoom from './dojo/ChallengeRoom';

const slug=(section:Section)=>section.toLowerCase().replaceAll(' ','-');
export default function Dojo(){
  const query=useRouteQuery();
  const challenge=dojoChallenges.find(c=>c.id===query.get('challenge'));
  const track=query.get('track');
  const cases=orderedCases(dojoChallenges.filter(c=>!track||track==='All'||track!==challenge?.track||c.track===track));
  const section=sections.find(s=>slug(s)===query.get('section'))||'Lesson';
  function open(id:string,part:Section='Lesson'){
    updateRouteQuery({challenge:id,section:slug(part)});
    window.scrollTo({top:0,behavior:'auto'});
  }
  if(!challenge)return <DojoLibrary open={open}/>;
  const index=cases.indexOf(challenge);
  return <ChallengeRoom key={challenge.id} challenge={challenge} section={section}
    choose={part=>{updateRouteQuery({section:slug(part)});document.querySelector('.dojo-stages')?.scrollIntoView({block:'start'})}}
    previous={index>0?()=>open(cases[index-1].id):undefined}
    next={index<cases.length-1?()=>open(cases[index+1].id):undefined}
    back={()=>{updateRouteQuery({challenge:null,section:null});window.scrollTo({top:0,behavior:'auto'})}}/>;
}
