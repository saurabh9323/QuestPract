'use client';
import {useSyncExternalStore} from 'react';
const event='quest90:navigation';
function subscribe(onChange:()=>void){window.addEventListener(event,onChange);window.addEventListener('popstate',onChange);window.addEventListener('hashchange',onChange);return()=>{window.removeEventListener(event,onChange);window.removeEventListener('popstate',onChange);window.removeEventListener('hashchange',onChange)}}
const snapshot=()=>window.location.pathname+window.location.search+window.location.hash;
export function useWorkspaceLocation(initialPath='/'){return useSyncExternalStore(subscribe,snapshot,()=>initialPath)}
export function navigateWorkspace(path:string,replace=false){const url=new URL(path,window.location.origin);if(url.origin!==window.location.origin)throw new Error('Workspace navigation must stay on this site.');const next=url.pathname+url.search+url.hash;if(next===snapshot())return;window.history[replace?'replaceState':'pushState'](null,'',next);window.dispatchEvent(new Event(event))}
export function useRouteQuery(){const location=useWorkspaceLocation();return new URL(location,'https://quest90.local').searchParams}
export function updateRouteQuery(values:Record<string,string|number|null>,replace=false){const url=new URL(window.location.href);for(const [key,value] of Object.entries(values)){if(value===null||value==='')url.searchParams.delete(key);else url.searchParams.set(key,String(value))}navigateWorkspace(url.pathname+url.search,replace)}
export function routePage(value:string|null){const n=Number(value);return Number.isSafeInteger(n)&&n>0?Math.min(n,100000):1}
