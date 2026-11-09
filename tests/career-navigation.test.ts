import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {parseWorkspacePath,workspaceStaticPaths,workspaceUrl} from '../lib/workspace-routes';
import {searchModules} from '../lib/navigation/catalog';
import ReviewHistory from '../components/career/ReviewHistory';
import type {StudioRecord} from '../lib/studio-state';

test('career route is discoverable and statically exported without replacing Today',()=>{
 assert.equal(workspaceUrl('career'),'/career/');
 assert.equal(parseWorkspacePath('/career/')?.view,'career');
 assert.ok(workspaceStaticPaths.some(parts=>parts.join('/')==='career'));
 assert.equal(parseWorkspacePath('/today/')?.view,'dashboard');
 assert.ok(searchModules('weekly reviews').some(e=>e.id==='career'));
});
test('review history renders readable immutable snapshots five per page',()=>{
 const reviews:[string,StudioRecord][]=Array.from({length:6},(_,i)=>['career-review-'+i,{fields:{schemaVersion:'1',createdAt:'2026-11-08T12:00:00Z',shipped:'Shipped-'+i,stuck:'Testing',priority:'One fix',summary:JSON.stringify({start:'2026-11-02',end:'2026-11-08',dsaSolved:2,openSourceMoved:1,openSourceMerged:1,hackathonsProgressed:0,questsCompleted:3})},attempts:[],updatedAt:'2026-11-08T12:00:00Z'}]);
 const html=renderToStaticMarkup(createElement(ReviewHistory,{reviews}));
 assert.equal((html.match(/<article/g)||[]).length,5);
 assert.ok(html.includes('DSA solved'));assert.ok(html.includes('Shipped-4'));assert.ok(!html.includes('Shipped-5'));
 assert.ok(html.includes('Next reviews'));assert.ok(!html.includes('<textarea'));assert.ok(!html.includes('contenteditable'));
});
test('empty history explains how to start without presenting navigation pages',()=>{
 const html=renderToStaticMarkup(createElement(ReviewHistory,{reviews:[]}));
 assert.ok(html.includes('No reviews yet'));assert.ok(!html.includes('Next reviews'));
});
