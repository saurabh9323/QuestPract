import type {Tracking,TrackingStatus} from './types';
import {RADAR_CHECKLIST_IDS,TRACKING_STATUSES} from './types';
import type {StudioState} from '../studio-state';

export const trackingStatuses:readonly TrackingStatus[]=TRACKING_STATUSES;
export const RADAR_LIMITS={records:100,notes:1000,id:160,namespace:2048} as const;
export type RadarTracking={
  id:string;namespace:string;status:TrackingStatus;notes:string;
  checked:string[];revision:string;pending:boolean;
};
const validObject=(v:unknown):v is Record<string,unknown>=>Boolean(v)&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown,max:number)=>typeof v==='string'&&v.length<=max;
function validIdentity(namespace:string,id:string){
  if(!namespace.trim()||namespace.length>RADAR_LIMITS.namespace||!id.trim()||id.length>RADAR_LIMITS.id)throw new Error('Radar opportunity identity is invalid.');
}
// Bounded record keys, not authentication hashes. The full identities are checked
// on every read/write so a collision cannot overwrite another opportunity.
function keyHash(value:string){
  let hash=14695981039346656037n;
  for(let i=0;i<value.length;i++)hash=BigInt.asUintN(64,(hash^BigInt(value.charCodeAt(i)))*1099511628211n);
  return hash.toString(36);
}
export function radarRecordId(namespace:string,id:string){
  validIdentity(namespace,id);
  return 'radar-'+keyHash(namespace)+'-'+keyHash(id);
}
export function readRadarTracking(fields:Record<string,string>,namespace:string,id:string):RadarTracking|null {
  validIdentity(namespace,id);
  if(Object.keys(fields).length===0)return null;
  if(fields.schemaVersion!=='1')throw new Error('This saved Radar record uses an unsupported format. Export your progress before changing it.');
  if(fields.opportunityId!==id||fields.namespace!==namespace)throw new Error('A conflicting Radar record was found. Your saved work has been kept intact.');
  let checked:unknown;
  try{checked=JSON.parse(fields.checked)}catch{throw new Error('The saved Radar checklist is unreadable. Your work has been kept intact.')}
  if(!trackingStatuses.includes(fields.status as TrackingStatus)||!text(fields.notes,RADAR_LIMITS.notes)||
    !Array.isArray(checked)||checked.length>6||!checked.every(v=>RADAR_CHECKLIST_IDS.includes(v))||
    new Set(checked).size!==checked.length||!text(fields.revision,120)||!fields.revision||
    !['yes','no'].includes(fields.pending))throw new Error('The saved Radar tracking is invalid. Export your progress before changing it.');
  return {id,namespace,status:fields.status as TrackingStatus,notes:fields.notes,checked:checked as string[],revision:fields.revision,pending:fields.pending==='yes'};
}
export function radarTrackingFields(previous:Record<string,string>,namespace:string,id:string,
  change:Partial<Pick<RadarTracking,'status'|'notes'|'checked'>>,revision:string,pending?:boolean) {
  const old=readRadarTracking(previous,namespace,id);
  const fields={...previous,schemaVersion:'1',opportunityId:id,namespace,
    status:change.status??old?.status??'new',notes:change.notes??old?.notes??'',
    checked:JSON.stringify(change.checked??old?.checked??[]),revision,
    pending:(pending??old?.pending??false)?'yes':'no'};
  readRadarTracking(fields,namespace,id);
  return fields;
}
export function acknowledgeRadarTracking(fields:Record<string,string>,namespace:string,id:string,revision:string,remote:Tracking) {
  const current=readRadarTracking(fields,namespace,id);
  if(!current||current.revision!==revision)return null;
  if(!validObject(remote)||!trackingStatuses.includes(remote.status as TrackingStatus)||(remote.notes!==undefined&&!text(remote.notes,RADAR_LIMITS.notes)))throw new Error('The Radar API returned invalid tracking.');
  return radarTrackingFields(fields,namespace,id,{status:remote.status,notes:remote.notes??current.notes},revision,false);
}
export function ensureRadarCapacity(studio:StudioState,recordId:string) {
  if(!studio[recordId]&&Object.keys(studio).filter(k=>k.startsWith('radar-')).length>=RADAR_LIMITS.records)
    throw new Error('Radar supports 100 saved opportunities. Existing tracking remains editable; export progress to keep a backup of your history.');
}
