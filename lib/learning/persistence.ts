import {validateStudio,type StudioState} from '../studio-state';
import {validateDocument,object,byteSize} from './validators';
import type {LearningDocument,LearningBackup} from './types';

export const LEARNING_PREFIX='learning-';
export const BACKUP_CAP=1000000;
export function documentKey(d:LearningDocument){
  if(!/^[a-z0-9-]{1,100}$/.test(d.data.id))throw new Error('Document IDs use lowercase letters, numbers and hyphens.');
  return `${LEARNING_PREFIX}${d.kind}-${d.data.id}`;
}
export function readLearning(state:StudioState={}){
  const documents:{key:string;document:LearningDocument}[]=[],invalid:string[]=[];
  for(const [key,r] of Object.entries(state)){
    if(!key.startsWith(LEARNING_PREFIX)||r.fields.deleted==='yes')continue;
    try{const document=validateDocument(JSON.parse(r.fields.document));if(documentKey(document)!==key)throw new Error('ID mismatch');documents.push({key,document})}catch{invalid.push(key)}
  }
  return {documents,invalid};
}
export function changeLearning(state:StudioState,change:{save?:LearningDocument[];remove?:string[]},at=new Date().toISOString()):StudioState{
  const next={...state};
  for(const key of change.remove||[]){
    if(!key.startsWith(LEARNING_PREFIX)||!next[key])throw new Error('Unknown learning record.');
    // No content or attempt history is retained in the live tombstone.
    next[key]={fields:{deleted:'yes',schemaVersion:'1'},attempts:[],updatedAt:at};
  }
  for(const input of change.save||[]){
    const doc=validateDocument(input),key=documentKey(doc);
    if(next[key]?.fields.deleted==='yes')throw new Error('This ID was deleted. Give the draft a new ID before importing.');
    next[key]={fields:{schemaVersion:'1',document:JSON.stringify(doc)},attempts:[],updatedAt:at};
  }
  const active=Object.entries(next).filter(([key,r])=>key.startsWith(LEARNING_PREFIX)&&r.fields.deleted!=='yes');
  if(active.length>100||byteSize(JSON.stringify(active))>BACKUP_CAP)throw new Error('Learning storage limit: 100 drafts / 1 MB. Export and remove unused drafts first.');
  validateStudio(next);return next;
}
export function exportLearning(state:StudioState,at=new Date().toISOString()):LearningBackup{
  return {format:'quest90-learning',schemaVersion:1,exportedAt:at,documents:readLearning(state).documents.map(x=>x.document)};
}
export function parseLearningBackup(text:string):LearningDocument[]{
  if(byteSize(text)>BACKUP_CAP)throw new Error('Backup exceeds 1 MB.');
  const x=object(JSON.parse(text));
  if(Object.keys(x).some(k=>!['format','schemaVersion','exportedAt','documents'].includes(k))||x.format!=='quest90-learning'||x.schemaVersion!==1||typeof x.exportedAt!=='string'||!Number.isFinite(Date.parse(x.exportedAt))||!Array.isArray(x.documents)||x.documents.length>100)throw new Error('Unsupported learning backup.');
  const docs=x.documents.map(validateDocument),ids=docs.map(documentKey);
  if(new Set(ids).size!==ids.length)throw new Error('Backup has duplicate document IDs.');
  return docs;
}
