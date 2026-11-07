import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {navigationEntries,navigationThemeGroup,searchModules} from '../lib/navigation/catalog';
import {workspacePaths,workspaceUrl,parseWorkspacePath} from '../lib/workspace-routes';
import WorkspaceNavigation from '../components/WorkspaceNavigation';
test('navigation catalog owns every route once and preserves existing URLs',()=>{
 assert.deepEqual(navigationEntries.map(e=>e.id).sort(),Object.keys(workspacePaths).sort());
 for(const e of navigationEntries){assert.equal(parseWorkspacePath(workspaceUrl(e.id,20))?.view,e.id);assert.ok(e.description.length>10)}
});
test('module search uses purpose and topic with all query words',()=>{
 assert.ok(searchModules('generics').some(e=>e.id==='oops'));
 assert.ok(searchModules('query').some(e=>e.id==='sqlGame'));
 assert.equal(searchModules('not-a-real-module').length,0);
 assert.ok(searchModules('interview materials').some(e=>e.id==='materials'));
});
test('sidebar exposes nested sections, active page and real current-day links',()=>{
 const html=renderToStaticMarkup(createElement(WorkspaceNavigation,{view:'materials',go:()=>{},due:3,day:20}));
 assert.ok(html.includes('Prepare for interviews'));
 assert.ok(html.includes('aria-current="page"'));
 assert.ok(html.includes('/interview-materials/'));
 const today=renderToStaticMarkup(createElement(WorkspaceNavigation,{view:'quest',go:()=>{},due:3,day:20}));
 assert.ok(today.includes('/day/20/'));
});
test('saved theme inheritance stays compatible for moved modules',()=>{
 assert.equal(navigationThemeGroup('materials'),'Learn');
 assert.equal(navigationThemeGroup('playground'),'Practice');
});

