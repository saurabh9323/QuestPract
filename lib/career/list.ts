import type {StudioState} from '../studio-state';
import {careerItems,osStatuses,staleOpenSource} from './logic';
export const statusLabels={new:'New',commented:'Commented',working:'Working',pr_open:'PR open',changes_requested:'Changes requested',merged:'Merged',dropped:'Dropped'};
export function contributionList(studio:StudioState,filters:{query:string;status:string;stale:boolean;page:number},now:Date){
 const words=filters.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
 const status=osStatuses.includes(filters.status as typeof osStatuses[number])?filters.status:'all';
 const matches=careerItems(studio,'opensource').filter(item=>
   (status==='all'||item.status===status)&&(!filters.stale||staleOpenSource(item.record,now))&&
   words.every(word=>(item.title+' '+(item.record.fields.notes||'')+' '+(item.record.fields.url||'')).toLowerCase().includes(word))
 ).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)||a.id.localeCompare(b.id));
 const pages=Math.max(1,Math.ceil(matches.length/10));
 const page=Math.min(pages,Number.isSafeInteger(filters.page)?Math.max(1,filters.page):1);
 return {items:matches.slice((page-1)*10,page*10),total:matches.length,pages,page};
}
