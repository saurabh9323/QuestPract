import test from 'node:test';
import assert from 'node:assert/strict';
import {experiments,observe,readProbe} from '../lib/repair-lab/counterexamples';

test('every starter passes and a learner-designed witness exposes the failure',()=>{
  const witnesses=[[5],[1,2,1],[-4,-3,-2]];
  experiments.forEach((x,i)=>{
    assert.equal(observe(x,x.seed,x.bug.run).match,true);
    assert.equal(observe(x,witnesses[i],x.bug.run).match,false);
    assert.equal(x.patches.filter(p=>[witnesses[i],...x.checks].every(v=>observe(x,v,p.run).match)).length,1);
  });
});

test('passing a witness alone does not earn a passing repair',()=>{
  const retry=experiments[1];
  const sorted=retry.patches[1].run;
  assert.ok(observe(retry,[1,2,1],sorted).match);
  assert.equal(observe(retry,[2,1,2],sorted).match,false);
});

test('invalid probes are rejected before execution and empty input remains usable',()=>{
  for(const raw of ['','null','[1.1]','["5"]','[1001]',JSON.stringify(Array(21).fill(0))]) assert.throws(()=>readProbe(raw));
  assert.deepEqual(readProbe('[]'),[]);
});
