import type {CSSProperties} from 'react';

import {workspacePaths, type WorkspaceView} from './workspace-routes';

import {dateKey, scheduledDay, type Progress} from './progress';

export const designRecord = 'workspace-design';
export const scopes = ['Portal', 'Today', 'Learn', 'Practice', 'Progress', 'Profile'] as const;
export type Scope = typeof scopes[number] | WorkspaceView;
const validScopes: Scope[] = [...scopes, ...Object.keys(workspacePaths) as WorkspaceView[]];
export type Mode = 'light' | 'dark';
export const colorNames = {
  navbar: 'Navigation', footer: 'Footer', text: 'Main text', page: 'Page background',
  surface: 'Cards and panels', accent: 'Accent and primary buttons',
};
export type ColorKey = keyof typeof colorNames;
type Palette = Partial<Record<ColorKey, string>>;
type Rules = Partial<Record<Scope, Palette>>;
export const defaults: Record<Mode, Required<Palette>> = {
  light: {navbar:'#ffffff',footer:'#f5f6f8',text:'#202c29',page:'#f5f6f8',surface:'#ffffff',accent:'#cafa7b'},
  dark: {navbar:'#17212b',footer:'#0e141b',text:'#edf3f8',page:'#0e141b',surface:'#17212b',accent:'#cafa7b'},
};
export const layouts = ['Standard','Compact','Reading'] as const;
export const marks = ['Letter','Orbit','Layers','Code'] as const;
export const paths = {
  foundations: {name:'Build from basics',steps:[
    {name:'Understand one concept',href:'/fundamentals/',hint:'Pick one concept and explain it without opening the answer.'},
    {name:'Trace an example',href:'/visual-lab/',hint:'Pause before each step and predict what changes.'},
    {name:'Try a question',href:'/questions/',hint:'Write a first attempt, then compare your reasoning.'},
  ]},
  practice: {name:'Learn by debugging',steps:[
    {name:'Repair a module',href:'/repair-lab/',hint:'Reproduce the failure before changing code.'},
    {name:'Inspect the execution',href:'/playground/',hint:'Trace the first step where your prediction differs.'},
    {name:'Recall the pattern',href:'/dsa-patterns/',hint:'Name the pattern and one case where it fails.'},
  ]},
  interview: {name:'Prepare for an interview',steps:[
    {name:'Choose an interview question',href:'/interview-materials/',hint:'Give a definition, example and trade-off.'},
    {name:'Rehearse your answer',href:'/interview/',hint:'Answer aloud and write down where you hesitated.'},
    {name:'Revisit a weak point',href:'/revision/',hint:'Try the explanation again without notes.'},
  ]},
} as const;
export type PathId = keyof typeof paths;
export type Design = {light:Rules;dark:Rules;layout:typeof layouts[number];mark:typeof marks[number];name:string;letter:string;path:PathId | 'adaptive' | ''};
export function freshDesign(): Design {
  return {light:{},dark:{},layout:'Standard',mark:'Letter',name:'',letter:'Q',path:''};
}
export function parseDesign(raw?:string):Design {
  const clean=freshDesign();
  if (!raw) return clean;
  try {
    const source=JSON.parse(raw);
    for (const mode of ['light','dark'] as const) {
      for (const scope of validScopes) {
        for (const key of Object.keys(colorNames) as ColorKey[]) {
          const value=source?.[mode]?.[scope]?.[key];
          if (typeof value==='string' && /^#[\da-f]{6}$/i.test(value)) {
            (clean[mode][scope]??={})[key]=value;
          }
        }
      }
    }
    if (layouts.includes(source?.layout)) clean.layout=source.layout;
    if (marks.includes(source?.mark)) clean.mark=source.mark;
    if (typeof source?.name==='string') clean.name=source.name.trim().slice(0,28);
    if (typeof source?.letter==='string') clean.letter=Array.from(source.letter.trim()).slice(0,2).join('') || 'Q';
    if (typeof source?.path==='string' && (source.path==='adaptive' || Object.hasOwn(paths,source.path))) clean.path=source.path;
  } catch { /* An older or malformed preference should never prevent opening a page. */ }
  return clean;
}
export function palette(design:Design, mode:Mode, scope:Scope, page?:Scope):Palette {
  return {...design[mode].Portal,...design[mode][scope],...(page?design[mode][page]:{})};
}
export function luminance(hex:string) {
  const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
  return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;
}
export function contrast(a:string,b:string) {
  const values=[luminance(a),luminance(b)].sort((x,y)=>y-x);
  return (values[0]+0.05)/(values[1]+0.05);
}
export function foreground(background:string) {
  return contrast(background,'#ffffff')>contrast(background,'#000000')?'#ffffff':'#000000';
}
export function designStyle(colors:Palette):CSSProperties {
  const style:Record<string,string>={};
  if(colors.page) style['--bg']=colors.page;
  if(colors.text) {
    style['--ink']=style['--text']=colors.text;
    style['--muted']=colors.text;
    style['--f-text']=colors.text;
  }
  if(colors.surface) {
    style['--surface']=colors.surface;
    style['--white']=style['--card']=colors.surface;
    style['--surface-raised']='color-mix(in srgb, var(--surface) 94%, var(--ink))';
  }
  if(colors.accent) {
    style['--green']=style['--accent']=colors.accent;
    style['--design-action-ink']=foreground(colors.accent);
  }
  for(const key of ['navbar','footer'] as const) {
    if(colors[key]) {
      style['--design-'+key]=colors[key]!;
      style['--design-'+key+'-ink']=foreground(colors[key]!);
    }
  }
  return style as CSSProperties;
}
export function pathPosition(raw:string|undefined,id:PathId) {
  const n=Number(raw);
  return Number.isInteger(n)?Math.max(0,Math.min(paths[id].steps.length,n)):0;
}

// Prefer due recall, then the earliest unfinished scheduled day. Never change course records here.
export function suggestedActivity(progress: Pick<Progress,'days'|'startDate'>, now = new Date()) {
  const today = dateKey(now);
  const due = Object.values(progress.days).filter(day =>
    day.completedAt && day.reviewDue && day.reviewDue <= today
  ).length;
  if (due) return {name:'Revisit what is due', reason:due+' completed course days have a review due.', href:'/revision/'};
  if (progress.startDate > today) return {name:'Explore a foundation', reason:'Your scheduled course begins on '+progress.startDate+'.', href:'/fundamentals/'};
  for (let day=1; day<=scheduledDay(progress.startDate,now); day++) {
    if (!progress.days[day]?.completedAt) return {
      name:'Continue day '+day,
      reason:'This is your earliest scheduled day still open.',
      href:'/day/'+day+'/',
    };
  }
  return {name:'Rehearse an interview answer', reason:'You have finished your scheduled days and have no course reviews due.', href:'/interview/'};
}
