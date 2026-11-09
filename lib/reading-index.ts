import type {ReadingLesson} from './commute-guides';
export function normalizeReadingQuery(value:string){return value.toLowerCase().replace(/\bcloser\b/g,'closure').replace(/\bacidt\b/g,'acid').replace(/\boops\b/g,'oop').replace(/water fall/g,'waterfall').trim()}
/** Build once per catalog, not once per keystroke or progress update. */
export function createReadingIndex(lessons:readonly ReadingLesson[]){
 const byId=new Map(lessons.map(lesson=>[lesson.id,lesson]));
 const entries=lessons.map(lesson=>({lesson,text:normalizeReadingQuery(`${lesson.title} ${lesson.topic} ${lesson.category} ${lesson.explanation}`)}));
 return {byId,search:(query:string)=>{const text=normalizeReadingQuery(query);return text?entries.filter(entry=>entry.text.includes(text)).map(entry=>entry.lesson):lessons;}};
}
