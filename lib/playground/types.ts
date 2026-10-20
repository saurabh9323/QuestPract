export type Value = null | boolean | number | string | Value[] | {[key:string]:Value};
export type TraceKind = 'read'|'write'|'compare'|'call'|'return'|'swap';
export type TraceEvent = {
  step:number; line:number; kind:TraceKind; target:string; value:Value;
  snapshot:Record<string,Value>; frame:number;
};
export type LabTest = {name:string; args:Value[]; expected:Value};
export type LabModule = {
  id:string; title:string; topic:string; starterCode:string; inputs:Value[];
  goal:string; hints:string[]; expectedPattern:string; tests:LabTest[]; renderers:string[];
};
export type RunResult = {trace:TraceEvent[]; output:Value; error?:string; passed?:boolean};
export type TestResult = {name:string; passed:boolean; expected:Value; actual:Value; error?:string};
export type LabRun = {trace:TraceEvent[]; output:Value; error?:string; tests:TestResult[]};
