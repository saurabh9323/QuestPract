import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {foundationLessons} from '../lib/oop-foundations/lessons';
import {oopFoundationReadingLessons} from '../lib/oop-foundations/commute';
import FoundationPlayer from '../components/oop/FoundationPlayer';
import FoundationsPath from '../components/oop/FoundationsPath';
import {freshProgress,validateProgress} from '../lib/progress';
import {readingLibrary,lessonMarkdown} from '../lib/commute';

test('new beginner attempts and reading records round-trip without changing existing OOP work',()=>{
  const at='2026-11-06T12:00:00.000Z';
  const progress={...freshProgress(),startDate:'2026-11-01',updatedAt:at};
  progress.oop={objects:{draft:'Existing object notes',attempts:[],updatedAt:at}};
  for(const lesson of foundationLessons){
    progress.oop['basics-'+lesson.id]={draft:'My explanation: '+lesson.title,attempts:[{id:'attempt-'+lesson.id,text:'An example and a limitation',feedback:'',confidence:'learning',createdAt:at}],updatedAt:at};
  }
  progress.reading=Object.fromEntries(oopFoundationReadingLessons.map(lesson=>[lesson.id,{bookmarked:true,notes:'Remember the state change',readAt:at,visitedAt:at,updatedAt:at}]));
  const restored=validateProgress(JSON.parse(JSON.stringify(progress)));
  assert.deepEqual(restored.oop,progress.oop);
  assert.deepEqual(restored.reading,progress.reading);
  assert.equal(restored.oop!.objects.draft,'Existing object notes');
  assert.equal(restored.version,1);
});

test('the commute reader uses the same definitions, code and frame states as the animated basics',()=>{
  assert.equal(oopFoundationReadingLessons.length,foundationLessons.length);
  for(const [index,lesson] of foundationLessons.entries()){
    const reading=oopFoundationReadingLessons[index];
    assert.equal(readingLibrary.filter(item=>item.id===reading.id).length,1);
    assert.equal(reading.code,lesson.code.source);
    assert.equal(reading.steps.length,lesson.steps.length);
    assert.ok(reading.explanation.startsWith(lesson.definition));
    const markdown=lessonMarkdown(reading);
    assert.ok(markdown.includes(lesson.interviewAnswer));
    assert.ok(markdown.includes(lesson.pitfall));
    assert.equal(reading.steps[0].line,lesson.steps[0].line);
  }
});

test('animation has accessible playback, source, before/after values and an explicit simulation boundary',()=>{
  for(const lesson of foundationLessons){
    const html=renderToStaticMarkup(createElement(FoundationPlayer,{lesson}));
    assert.match(html,/does not compile or execute/);
    assert.match(html,/type="range"/);
    assert.match(html,/Reduce motion/);
    assert.match(html,/What changed at this step/);
    assert.match(html,/scope="col">Before/);
    assert.match(html,/scope="col">After/);
    assert.match(html,/aria-current="step"/);
    assert.match(html,/Illustrative source code/);
    assert.match(html,/disabled="">.*?Back/);
    assert.doesNotMatch(html,/>Pause</);
  }
});

test('opening a beginner lesson does not automatically save an attempt or mark it learned',()=>{
  const progress={...freshProgress(),startDate:'2026-11-01',updatedAt:'2026-11-06T12:00:00.000Z'};
  const before=JSON.stringify(progress);
  let answerLesson='';
  const html=renderToStaticMarkup(createElement(FoundationsPath,{p:progress,renderAnswer:lesson=>{answerLesson=lesson.id;return createElement('div',null,'Existing answer workspace');}}));
  assert.equal(JSON.stringify(progress),before);
  assert.equal(answerLesson,foundationLessons[0].id);
  assert.match(html,/0\/10/);
  assert.match(html,/session-only/);
  assert.match(html,/Existing answer workspace/);
});
