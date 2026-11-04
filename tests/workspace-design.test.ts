import test from 'node:test';
import assert from 'node:assert/strict';
import {parseDesign,freshDesign,palette,designStyle,contrast,foreground,paths,pathPosition,suggestedActivity} from '../lib/workspace-design';
import {emptyDay} from '../lib/progress';
import {parseWorkspacePath,workspaceStaticPaths} from '../lib/workspace-routes';

test('section overrides inherit portal colors within the selected mode',()=>{
  const d=parseDesign(JSON.stringify({light:{Portal:{text:'#112233',navbar:'#abcdef'},Learn:{navbar:'#334455'},fundamentals:{text:'#112244'}},dark:{Portal:{text:'#ffffff'}}}));
  assert.deepEqual(palette(d,'light','Learn'),{text:'#112233',navbar:'#334455'});
  assert.deepEqual(palette(d,'light','Learn','fundamentals'),{text:'#112244',navbar:'#334455'});
  assert.deepEqual(palette(d,'light','Today'),{text:'#112233',navbar:'#abcdef'});
  assert.deepEqual(palette(d,'dark','Learn'),{text:'#ffffff'});
});

test('old, malformed and unsafe settings preserve ordinary workspace defaults',()=>{
  for(const raw of [undefined,'broken','null','{}']) assert.deepEqual(parseDesign(raw),freshDesign());
  const d=parseDesign('{"layout":"bad","path":"__proto__","light":{"Learn":{"text":"url(example)","unknown":"#ff0000"}}}');
  assert.deepEqual(d,freshDesign());
  assert.deepEqual(designStyle({}),{});
  assert.equal(foreground('#000000'),'#ffffff');
  assert.equal(contrast('#ffffff','#000000'),21);
});

test('all learning sequences reach registered pages and keep the cursor in bounds',()=>{
  assert.ok(workspaceStaticPaths.some(p=>p.join('/')==='workspace-studio'));
  for(const [id,path] of Object.entries(paths)) {
    for(const step of path.steps) assert.ok(parseWorkspacePath(step.href));
    assert.equal(pathPosition('999',id as keyof typeof paths),path.steps.length);
    assert.equal(pathPosition('-3',id as keyof typeof paths),0);
    assert.equal(pathPosition('NaN',id as keyof typeof paths),0);
  }
});

test('progress-guided path prioritizes recall and respects the course start and saved days',()=>{
  const now=new Date(2026,10,4,12);
  const startDate='2026-11-03';
  const done={...emptyDay(),completedAt:'2026-11-03T12:00:00Z'};
  assert.equal(suggestedActivity({startDate:'2026-12-01',days:{}},now).href,'/fundamentals/');
  assert.equal(suggestedActivity({startDate,days:{1:done}},now).href,'/day/2/');
  assert.equal(suggestedActivity({startDate,days:{1:{...done,reviewDue:'2026-11-04'}}},now).href,'/revision/');
  assert.equal(suggestedActivity({startDate,days:{1:done,2:done}},now).href,'/interview/');
});
