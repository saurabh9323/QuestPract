import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Worker} from 'node:worker_threads';
import {createRequire} from 'node:module';
import {sqlMissions,gameSeed,extraSeed,unlockedMission} from '../lib/sql-game';
import {parseWorkspacePath} from '../lib/workspace-routes';
const require=createRequire(import.meta.url),engine=require.resolve('sql.js'),wasm=require.resolve('sql.js/dist/sql-wasm.wasm');
const runtime=readFileSync(new URL('../public/sql-game-worker.js',import.meta.url),'utf8');
function run(query:string,index=0):Promise<any>{return new Promise((resolve,reject)=>{
 const worker=new Worker(`const {parentPort}=require('node:worker_threads');global.self=global;global.importScripts=()=>{};global.initSqlJs=()=>require(${JSON.stringify(engine)})({locateFile:()=>${JSON.stringify(wasm)}});self.postMessage=x=>parentPort.postMessage(x);${runtime};parentPort.on('message',data=>self.onmessage({data}));`,{eval:true});
 const timer=setTimeout(()=>{void worker.terminate();reject(new Error('SQL test timeout'))},10000);
 worker.once('message',result=>{clearTimeout(timer);void worker.terminate();resolve(result)});worker.once('error',e=>{clearTimeout(timer);void worker.terminate();reject(e)});
 worker.postMessage({query,seeds:[gameSeed,extraSeed],reference:sqlMissions[index].reference,ordered:sqlMissions[index].ordered});
})}
const expected=[
 [['Asha'],['Ravi'],['Mina'],['Leena']],
 [['Asha',70000],['Leena',60000]],
 [['Engineering'],['Support']],
 [['Mina']],
 [['Asha',70000],['Leena',60000]],
 [['Asha',40],['Asha',70],['Ravi',30]],
 [[1,110],[2,30]],[[1,110]],
 [['Asha',2],['Ravi',2],['Mina',0],['Leena',0]],
 [['Asha',1],['Leena',2],['Ravi',3]]
];
test('all ten missions execute in the real worker and match independently specified base rows',async()=>{
 for(let i=0;i<sqlMissions.length;i++){const r=await run(sqlMissions[i].reference,i);assert.equal(r.error,undefined);assert.equal(r.tests.length,2);assert.ok(r.tests.every((x:any)=>x.passed));assert.deepEqual(r.tests[0].actual.rows,expected[i]);}
});
test('extra dataset rejects a hardcoded answer that matches the station data',async()=>{const r=await run("SELECT 'Mina'",3);assert.equal(r.tests[0].passed,true);assert.equal(r.tests[1].passed,false)});
test('row ordering, duplicates and column counts are actually checked',async()=>{
 assert.equal((await run('SELECT department FROM employees',2)).tests[0].passed,false);
 assert.equal((await run('SELECT name,salary FROM employees',0)).tests[0].passed,false);
 assert.equal((await run('SELECT name,salary FROM employees WHERE salary IS NOT NULL ORDER BY salary ASC LIMIT 2',4)).tests[0].passed,false);
 assert.ok((await run('SELECT name AS alias FROM employees ORDER BY name DESC')).tests.every((x:any)=>x.passed));
});
test('SQL errors, writes, multiple statements and excessive output do not pass',async()=>{
 for(const query of ['SELECT missing FROM employees','DELETE FROM employees RETURNING name','SELECT name FROM employees; SELECT name FROM employees;','WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x<250) SELECT x FROM n'])assert.ok((await run(query)).error);
});
test('progress opens only the next contiguous mission and route is registered',()=>{
 assert.equal(unlockedMission([false,false,false]),0);assert.equal(unlockedMission([true,false,true]),1);assert.equal(unlockedMission([true,true,true]),2);assert.deepEqual(parseWorkspacePath('/sql-game/'),{view:'sqlGame'});
});
