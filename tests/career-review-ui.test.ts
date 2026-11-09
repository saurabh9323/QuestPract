import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ReviewEvidenceList} from '../components/career/WeeklyReview';
import type {ReviewEvidence} from '../lib/career/review';

test('review evidence exposes dated items and empty categories without treating text as HTML',()=>{
 const evidence:ReviewEvidence={dsaSolved:[{id:'dsa-test',title:'<script>alert(1)</script>',at:'2026-11-08T18:29:59Z'}],questsCompleted:[],openSourceMoved:[],openSourceMerged:[],hackathonsProgressed:[]};
 const html=renderToStaticMarkup(createElement(ReviewEvidenceList,{evidence}));
 assert.equal((html.match(/<details/g)||[]).length,5);
 assert.equal((html.match(/<li>/g)||[]).length,1);
 assert.ok(html.includes('No dated activity in this period.'));
 assert.ok(html.includes('dateTime="2026-11-08T18:29:59Z"'));
 assert.ok(html.includes('&lt;script&gt;'));
 assert.ok(!html.includes('<script>'));
 assert.ok(html.includes('IST'));
});
