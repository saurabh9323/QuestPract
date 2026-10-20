import {instrument} from './instrument';
import {validValue} from './schema';
import type {LabModule,LabRun,RunResult,Value} from './types';

const bootstrap=`let worker;
addEventListener('message',e=>{
 if(e.source!==parent)return;
 if(e.data.stop){worker?.terminate();return;}
 if(worker)return;
 const url=URL.createObjectURL(new Blob([e.data.worker],{type:'text/javascript'}));
 worker=new Worker(url);
 worker.onmessage=m=>{parent.postMessage({result:m.data},'*');worker.terminate();URL.revokeObjectURL(url);};
 worker.onerror=()=>{parent.postMessage({error:'Worker could not start or execute.'},'*');worker.terminate();};
 worker.postMessage({source:e.data.source,args:e.data.args,limit:5000,test:e.data.test,expected:e.data.expected});
});
parent.postMessage({ready:true},'*');`;

export function validateRunResult(value:unknown):RunResult {
  const r=value as RunResult;
  if(!r||!Array.isArray(r.trace)||r.trace.length>5000||JSON.stringify(r).length>5000000||
    !validValue(r.output)||(r.error!==undefined&&typeof r.error!=='string')||(r.passed!==undefined&&typeof r.passed!=='boolean'))throw new Error('Invalid worker response.');
  for(const [i,event] of r.trace.entries()){
    if(!event||event.step!==i||!Number.isInteger(event.line)||event.line<1||!Number.isInteger(event.frame)||!['read','write','compare','call','return','swap'].includes(event.kind)||typeof event.target!=='string'||event.target.length>120||!validValue(event.value)||!validValue(event.snapshot)||Array.isArray(event.snapshot)||!event.snapshot||typeof event.snapshot!=='object')throw new Error('Invalid trace event.');
  }
  return r;
}
export async function executeInSandbox(source:string,args:Value[],signal?:AbortSignal,expected?:Value):Promise<RunResult> {
  if(!validValue(args))throw new Error('Inputs exceed the size/type limits.');
  const response=await fetch('/playground-worker.js',{signal});
  if(!response.ok)throw new Error('Playground worker could not be loaded.');
  const worker=await response.text();
  return new Promise((resolve,reject)=>{
    const frame=document.createElement('iframe');
    frame.hidden=true;frame.title='Isolated JavaScript playground worker';
    frame.setAttribute('sandbox','allow-scripts');
    frame.srcdoc=`<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; worker-src blob:; connect-src 'none';"><script>${bootstrap}</script>`;
    let done=false;
    const finish=(error?:Error,result?:RunResult)=>{
      if(done)return;done=true;clearTimeout(timer);
      window.removeEventListener('message',receive);signal?.removeEventListener('abort',cancel);
      frame.contentWindow?.postMessage({stop:true},'*');frame.remove();
      if(error)reject(error);else resolve(result!);
    };
    const cancel=()=>finish(new Error('Run cancelled.'));
    const timer=setTimeout(()=>finish(new Error('Execution timed out after 3 seconds. Fix the loop or reduce the input.')),3000);
    const receive=(event:MessageEvent)=>{
      if(event.source!==frame.contentWindow)return;
      if(event.data?.ready){frame.contentWindow?.postMessage({worker,source,args,test:expected!==undefined,expected},'*');return;}
      if(event.data?.error){finish(new Error('Sandbox worker failed.'));return;}
      if(event.data?.result){try{finish(undefined,validateRunResult(event.data.result))}catch(error){finish(error as Error)}}
    };
    window.addEventListener('message',receive);
    signal?.addEventListener('abort',cancel,{once:true});
    document.body.append(frame);
    if(signal?.aborted)cancel();
  });
}
export async function runModule(code:string,args:Value[],module:LabModule,signal?:AbortSignal):Promise<LabRun>{
  const source=instrument(code);
  const selected=await executeInSandbox(source,args,signal);
  const tests=[];
  for(const test of module.tests){
    if(signal?.aborted)throw new Error('Run cancelled.');
    try{
      const actual=await executeInSandbox(source,test.args,signal,test.expected);
      tests.push({name:test.name,passed:!actual.error&&actual.passed===true,expected:test.expected,actual:actual.output,error:actual.error});
    }catch(error){
      if(signal?.aborted)throw error;
      tests.push({name:test.name,passed:false,expected:test.expected,actual:null,error:error instanceof Error?error.message:'Test failed.'});
    }
  }
  return {...selected,tests};
}
