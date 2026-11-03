import {test,type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {runBooking} from '../lib/inside-app/client';
import {defaultBookingOptions} from '../lib/inside-app/types';
import InsideApp from '../components/inside-app/InsideApp';
import {StudioProvider} from '../components/studio/StudioContext';
import {freshProgress} from '../lib/progress';

class FakeWorker{
  static instances:FakeWorker[]=[];
  onmessage:((event:{data:unknown})=>void)|null=null;
  onerror:(()=>void)|null=null;
  terminated=0;sent:unknown;
  constructor(public url:string){FakeWorker.instances.push(this)}
  terminate(){this.terminated++}
  postMessage(message:unknown){this.sent=message}
}
function install(t:TestContext){
  const old=Object.getOwnPropertyDescriptor(globalThis,'Worker');FakeWorker.instances=[];
  Object.defineProperty(globalThis,'Worker',{configurable:true,writable:true,value:FakeWorker});
  t.after(()=>{if(old)Object.defineProperty(globalThis,'Worker',old);else Reflect.deleteProperty(globalThis,'Worker')});
}
test('cancelled runs terminate their worker and ignore late results',async t=>{
  install(t);const controller=new AbortController(),result=runBooking('normal',defaultBookingOptions,controller.signal);
  const rejection=assert.rejects(result,/cancelled/);const worker=FakeWorker.instances[0];
  assert.equal(worker.url,'/inside-app-worker.js');
  assert.deepEqual(worker.sent,{scenario:'normal',options:defaultBookingOptions});
  controller.abort();await rejection;worker.onmessage?.({data:null});assert.equal(worker.terminated,1);
});
test('an already-aborted request creates no worker',async t=>{
  install(t);const controller=new AbortController();controller.abort();
  await assert.rejects(runBooking('normal',defaultBookingOptions,controller.signal),/cancelled/);assert.equal(FakeWorker.instances.length,0);
});
test('worker load errors and malformed messages become clear failures',async t=>{
  install(t);
  for(const data of [null,{}, {scenario:'normal',steps:[],final:{},checks:[]},{error:'Invalid controls.'}]){
    const result=runBooking('normal',defaultBookingOptions,new AbortController().signal),rejected=assert.rejects(result,/incomplete|Invalid controls/);
    const worker=FakeWorker.instances.at(-1)!;worker.onmessage?.({data});await rejected;assert.equal(worker.terminated,1);
  }
  const result=runBooking('normal',defaultBookingOptions,new AbortController().signal),rejected=assert.rejects(result,/could not load/);
  FakeWorker.instances.at(-1)!.onerror?.();await rejected;assert.equal(FakeWorker.instances.at(-1)!.terminated,1);
});
test('the 15-second limit terminates a worker which never replies',async t=>{
  install(t);t.mock.timers.enable({apis:['setTimeout']});
  const result=runBooking('normal',defaultBookingOptions,new AbortController().signal),rejected=assert.rejects(result,/too long/);
  t.mock.timers.tick(15000);await rejected;assert.equal(FakeWorker.instances[0].terminated,1);
});
test('a dispatch error also cleans up the worker',async t=>{
  install(t);t.mock.method(FakeWorker.prototype,'postMessage',()=>{throw new Error('blocked')});
  await assert.rejects(runBooking('normal',defaultBookingOptions,new AbortController().signal),/Unable to start/);assert.equal(FakeWorker.instances[0].terminated,1);
});
test('the initial learning UI renders all seven scenarios and identifies the execution boundary',()=>{
  const html=renderToStaticMarkup(createElement(StudioProvider,{p:freshProgress(),commit:()=>{},notice:()=>{},userKey:'test',openDay:()=>{},practice:()=>{},read:()=>{},children:createElement(InsideApp)}));
  for(const label of ['The double click','The connection disappears','The outdated seat map','The expired login','Real SQLite execution','Modeled infrastructure','Predict before']){
    if(label==='Predict before')assert.ok(html.toLowerCase().includes(label.toLowerCase()));else assert.ok(html.includes(label),label);
  }
  assert.ok(html.includes('aria-label="Request trace player"'));
  assert.ok(html.includes('Your explanation'));assert.ok(html.includes('/practice/?tool=sql'));
});
