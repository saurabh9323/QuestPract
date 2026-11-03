import {test} from 'node:test';
import assert from 'node:assert/strict';
import {frontendInterviewQuestions} from '../lib/frontend-interview';
import {frontendInterviewLessons} from '../lib/frontend-interview-lessons';
import {materialQuestions} from '../lib/interview-materials';
import {parseWorkspacePath,workspaceStaticPaths} from '../lib/workspace-routes';
import {readingLibrary} from '../lib/commute';
import {freshProgress,validateProgress} from '../lib/progress';

test('the 15 supplied frontend themes have complete structured interview explanations',()=>{
 const qs=materialQuestions('frontend-3plus');assert.equal(qs.length,15);assert.equal(new Set(qs.map(q=>q.id)).size,15);
 assert.deepEqual(qs,frontendInterviewQuestions);
 for(const q of frontendInterviewQuestions){assert.ok(q.answer.length>100);assert.ok(q.example.length>60);assert.ok(q.mistake.length>60);assert.ok(q.depth.code.length>50);assert.equal(q.depth.flow.length,4);assert.ok(q.depth.followUps.length>=2);assert.ok(q.depth.sources.length>0);q.depth.sources.forEach(s=>assert.equal(new URL(s[1]).protocol,'https:'));assert.ok(q.depth.hinglish);}
});
test('frontend lessons preserve the question-specific flow and the new route resolves',()=>{
 assert.deepEqual(parseWorkspacePath('/interview-materials/frontend-3plus/'),{view:'materials'});
 assert.ok(workspaceStaticPaths.some(p=>p.join('/')==='interview-materials/frontend-3plus'));
 for(const q of frontendInterviewQuestions){const l=frontendInterviewLessons.find(l=>l.id===`guide-${q.id}`)!;assert.ok(l);assert.deepEqual(l.steps,q.depth.flow);assert.equal(l.code,q.depth.code);assert.ok(readingLibrary.some(r=>r.id===l.id));}
 assert.equal(new Set(readingLibrary.map(l=>l.id)).size,readingLibrary.length);
 const p=freshProgress(),at='2026-11-03T08:00:00Z';
 p.reading=Object.fromEntries(frontendInterviewLessons.map(l=>[l.id,{bookmarked:true,notes:'My interview notes',visitedAt:at,updatedAt:at}]));
 assert.doesNotThrow(()=>validateProgress(p));
});
test('legacy React and Node question IDs continue to identify their original questions',()=>{
 assert.match(materialQuestions('react').find(q=>q.id==='react-01')!.question,/state|render/i);
 assert.equal(materialQuestions('nodejs').find(q=>q.id==='nodejs-01')!.question,'How does the Node.js event loop work?');
 assert.equal(materialQuestions('dotnet')[0].id,'dotnet-01');
});
