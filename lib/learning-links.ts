import {questionBank} from './bank';
import {patternCases,type Pattern} from './patterns';
import type {ReadingLesson} from './commute-guides';
const topics:Record<Pattern,string>={Map:'dsa-hash',Set:'dsa-arrays','Two pointers':'dsa-pointers','Sliding window':'dsa-window',Stack:'dsa-stack','Breadth-first search':'dsa-graphs','Binary search':'dsa-search','Prefix sums':'dsa-hash'};
export function patternPractice(pattern:Pattern){
 const title=pattern==='Map'?'Two Sum':pattern==='Set'?'Duplicate values':pattern==='Prefix sums'?'Subarray sum equals k':pattern==='Sliding window'?'Longest unique substring':pattern==='Two pointers'?'Sorted pair sum':pattern==='Breadth-first search'?'Word ladder length':'';
 return questionBank.find(q=>title&&q.title===title)||questionBank.find(q=>q.kind==='DSA'&&q.lessonId===topics[pattern]);
}
export function readingPractice(lesson:ReadingLesson){
 const direct=questionBank.find(q=>q.id===lesson.practiceId);if(direct)return direct;
 const pattern=patternCases.find(x=>lesson.id===`pattern-reading-${x.id}`);if(pattern)return patternPractice(pattern.pattern);
 if(lesson.id.startsWith('array-reading-')){
  const key=lesson.id.replace('array-reading-','');
  if(key.endsWith('two-sum')||key==='map-start'||key==='loop-start'||key==='compare')return patternPractice('Map');
  if(key.endsWith('duplicates')||key==='set-start')return patternPractice('Set');
  const titles:Record<string,string>={'map-first-unique':'First unique character','set-intersection':'Unique intersection','map-intersection-bag':'Multiset intersection','map-subarray-count':'Subarray sum equals k','set-consecutive':'Longest consecutive run','map-nearby':'Nearby duplicate'};
  return questionBank.find(q=>q.title===titles[key]);
 }
 if(/two-sum|map-/.test(lesson.id))return patternPractice('Map');
 if(/set-/.test(lesson.id))return patternPractice('Set');
 return questionBank.find(q=>q.title.toLowerCase()===lesson.title.toLowerCase());
}
