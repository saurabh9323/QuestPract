import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Worker} from 'node:worker_threads';
import {createRequire} from 'node:module';
import {sqlMissions,gameSeed,extraSeed,unlockedMission} from '../lib/sql-game';
import {parseWorkspacePath} from '../lib/workspace-routes';
const require=createRequire(import.meta.url),engine=require.resolve('sql.js'),wasm=require.resolve('sql.js/dist/sql-wasm.wasm');
const runtime=readFileSync(new URL('../public/sql-worker.js',import.meta.url),'utf8');
function run(query:string,index=0):Promise<any>{return new Promise((resolve,reject)=>{
 const worker=new Worker(`const {parentPort}=require('node:worker_threads');global.self=global;global.importScripts=()=>{};global.initSqlJs=()=>require(${JSON.stringify(engine)})({locateFile:()=>${JSON.stringify(wasm)}});self.postMessage=x=>parentPort.postMessage(x);${runtime};parentPort.on('message',data=>self.onmessage({data}));`,{eval:true});
 const timer=setTimeout(()=>{void worker.terminate();reject(new Error('SQL test timeout'))},10000);
 worker.once('message',result=>{clearTimeout(timer);void worker.terminate();resolve(result)});worker.once('error',e=>{clearTimeout(timer);void worker.terminate();reject(e)});
 worker.postMessage({sql:query,seed:gameSeed,inspect:true});
})}

test('SQL practice returns real plan and sample tables alongside query output',async()=>{
 const r=await run('SELECT name FROM employees WHERE id=1');
 assert.equal(r.error,undefined);assert.deepEqual(r.rows,[['Asha']]);
 assert.ok(r.plan.some((row:any[])=>String(row[3]).includes('SEARCH')));
 assert.equal(r.tables.length,2);assert.equal(r.tables[0].values.length,4);
 assert.equal(r.tables[1].name,'orders');
});
test('inspection retains worker rejection of invalid SQL and writes',async()=>{
 assert.ok((await run('SELECT missing FROM employees')).error);
 assert.ok((await run('DELETE FROM employees RETURNING name')).error);
});
