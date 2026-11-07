import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import MemoryPractice from '../components/oop/MemoryPractice';
import {foundationLessons} from '../lib/oop-foundations/lessons';
import {freshProgress,validateProgress,dayDate} from '../lib/progress';
test('memory practice exposes six exercises without saving on render',()=>{
 let writes=0;
 const html=renderToStaticMarkup(createElement(MemoryPractice,{lesson:foundationLessons[0],p:freshProgress(),commit:()=>{writes++}}));
 for(const name of ['Rebuild','Predict','Change a condition','Explain again','Different situations','Remember again'])assert.ok(html.includes(name));
 assert.ok(html.includes('nothing is sent automatically'));
 assert.equal(writes,0);
});
test('recall records preserve original explanations and review dates through export',()=>{
 const p=freshProgress(),at='2026-11-07T12:00:00.000Z';
 p.oop={'recall-generics':{draft:'original',updatedAt:at,reviewDue:dayDate('2026-11-07',3),attempts:[{id:'memory-1',text:JSON.stringify({original:'original',improved:'improved'}),feedback:'Sequence not checked.',confidence:'assisted',createdAt:at}]}};
 const restored=validateProgress(JSON.parse(JSON.stringify(p)));
 assert.deepEqual(restored.oop,p.oop);
 assert.equal(restored.oop!['recall-generics'].reviewDue,'2026-11-10');
});
