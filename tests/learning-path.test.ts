import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {learningPathLessons,learningPathTracks} from '../lib/learning-path';
import {readingLibrary,lessonMarkdown} from '../lib/commute';
import {createReadingIndex} from '../lib/reading-index';
import {freshProgress,validateProgress} from '../lib/progress';
import ConceptVisual from '../components/ConceptVisual';

test('phased lessons cover each technology and retain stable, complete reading content',()=>{
 assert.equal(learningPathTracks.length,19);
 assert.equal(learningPathLessons.length,19);
 assert.equal(new Set(readingLibrary.map(lesson=>lesson.id)).size,readingLibrary.length);
 for(const track of learningPathTracks){
  const lesson=learningPathLessons.find(item=>item.id==='guide-path-'+track.id)!;
  assert.ok(lesson,track.id);
  assert.ok(readingLibrary.includes(lesson));
  assert.equal(lesson.category,'Learning path');
  assert.ok(lesson.steps.length>=4,lesson.id);
  for(const key of ['explanation','example','useWhen','code','output','pitfall','interview','recall','answer'] as const)assert.ok(lesson[key]?.trim(),`${lesson.id}: ${key}`);
  assert.ok(lesson.questions&&lesson.questions.length>=2);
  assert.ok(lesson.exercise?.acceptance.length&&lesson.exercise.acceptance.length>=3);
  assert.equal(new URL(lesson.resource!).protocol,'https:');
  assert.ok(lessonMarkdown(lesson).includes(lesson.resource!));
  for(const step of lesson.steps)assert.ok(step.title.trim()&&step.detail.trim()&&step.state.trim());
 }
});

test('new lesson reading records survive existing progress validation without marking quests complete',()=>{
 const p=freshProgress(),at='2026-11-09T12:00:00Z';
 p.reading=Object.fromEntries(learningPathLessons.map(lesson=>[lesson.id,{bookmarked:true,notes:'Explain the boundary next time.',visitedAt:at,updatedAt:at,readAt:at}]));
 const restored=validateProgress(JSON.parse(JSON.stringify(p)));
 assert.deepEqual(restored.reading,p.reading);assert.equal(Object.keys(restored.days).length,0);
});

test('indexed reading search keeps case, typo aliases and catalog order while looking up stable IDs',()=>{
 const index=createReadingIndex(readingLibrary);
 assert.ok(index.search('closer').some(lesson=>lesson.id==='guide-closures'));
 assert.deepEqual(index.search(' REACT '),index.search('react'));
 assert.deepEqual(index.search(''),readingLibrary);
 assert.deepEqual(index.search('xyz-no-topic-404'),[]);
 assert.equal(index.byId.get('guide-path-python')?.id,'guide-path-python');
 assert.equal(index.byId.get('unknown'),undefined);
});

test('all phased lessons render a selected flow state as an illustration',()=>{
 for(const lesson of learningPathLessons){
  const html=renderToStaticMarkup(createElement(ConceptVisual,{lesson,step:1}));
  assert.ok(html.includes('aria-current="step"'),lesson.id);
  assert.ok(html.includes('Illustration only'),lesson.id);
 }
});
