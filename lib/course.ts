import {questionBank,theory} from './bank';
import {quests} from './curriculum';
import {Progress,dateKey,dayDate,scheduledDay} from './progress';
import {managedTasks} from './planning';

// Stable question IDs: five foundations from each of the twenty DSA topic packs.
export const requiredDSA=theory.filter(t=>t.kind==='DSA').flatMap(t=>questionBank.filter(q=>q.lessonId===t.id).slice(0,5));
const courseLessons=['int-js','int-react','int-node','int-mongo','sql-select','int-next','int-python','int-pg','int-delivery','int-cloud','sd-product','int-behavior','int-testing'];
const communicationLadder=[
 ['Mirror explain','Record a 60-second explanation of today\'s concept in English. Use: "Today I learned..., the tricky part is..., one example is..."','Private','Fluency'],
 ['Rubber-duck debug','Explain one bug or edge case aloud as if guiding a junior developer. End with the next test you would run.','Private','Technical clarity'],
 ['Written standup','Write a three-line standup: yesterday, today, blocker. Keep each line under 18 words.','Private','Concise updates'],
 ['Voice note','Send or save a two-minute voice note explaining your solution approach. Listen once and write one improvement.','Private','Self-review'],
 ['Peer DM','Message one developer friend or classmate: "I am practicing interview communication. Can I explain one concept in 2 minutes and get one question?"','Known person','Initiating'],
 ['Ask for feedback','Share a short answer with a known person and ask: "Which part sounded unclear or too long?"','Known person','Feedback'],
 ['Small disagreement','Practice a respectful technical disagreement: "I see that point. My concern is..., because..."','Known person','Diplomacy'],
 ['Question-first habit','In one conversation, ask two follow-up questions before giving your own opinion.','Known person','Listening'],
 ['Public micro-post','Post or draft a short learning note: problem, insight, mistake, correction. Keep it honest and simple.','Public online','Public clarity'],
 ['Comment with value','Leave one helpful comment on a developer post: add an example, tradeoff, or question.','Public online','Contribution'],
 ['Stranger warm-up','Ask a shopkeeper, receptionist, or event attendee one simple English question and thank them clearly.','Public offline','Confidence'],
 ['Stranger tech intro','At a meetup, online community, or professional setting, introduce yourself: "I work in full stack. I am preparing for interviews and practicing clearer explanations."','Public/professional','Presence'],
 ['Mock interviewer','Ask someone to interrupt your answer once. Practice pausing, clarifying, and continuing calmly.','Known person','Interview control'],
 ['Story drill','Tell a STAR story from work: situation, task, action, result, what you learned.','Private or peer','Behavioral stories'],
 ['Role intro','Practice a confident role intro: experience, strengths, target role, current focus.','Private or peer','Professional intro']
] as const;

export function dayAssignments(day:number){
 if(!Number.isInteger(day)||day<1||day>90)throw new Error('Choose day 1-90.');
 const offset=day-1+Math.floor((day-1)/9),count=day%9===0?2:1,q=quests[day-1],pool=questionBank.filter(x=>x.lessonId===courseLessons[q.chapter-1]);
 return {dsa:requiredDSA.slice(offset,offset+count),companion:pool[(day-1)%7%pool.length]};
}
export function communicationMission(day:number){
 if(!Number.isInteger(day)||day<1||day>90)throw new Error('Choose day 1-90.');
 const [title,prompt,audience,skill]=communicationLadder[(day-1)%communicationLadder.length];
 const phase=day<=15?'Foundation':day<=35?'Known people':day<=60?'Public practice':day<=75?'Interview simulation':'Polish and confidence';
 return {day,title,prompt,audience,skill,phase,script:'Hi, I am practicing my English communication for full-stack interviews. Can I explain one small idea in two minutes and get one honest question or suggestion?',reflection:'What did I say clearly? Where did I pause? What will I say shorter next time?'};
}
export function dsaDueDate(p:Progress,day:number){return p.planning?.items[`quest-${day}-practice`]?.dueDate||dayDate(p.startDate,day-1)}
export function courseStats(p:Progress,today=dateKey()){
 const end=dayDate(p.startDate,89),started=today>=p.startDate,day=scheduledDay(p.startDate,new Date(today+'T12:00:00'));
 const entries=quests.flatMap(q=>dayAssignments(q.day).dsa.map(question=>({question,day:q.day,dueDate:dsaDueDate(p,q.day),solved:!!p.practice?.[question.id]?.solvedAt})));
 const solved=entries.filter(x=>x.solved),due=entries.filter(x=>!x.solved&&x.dueDate<today),assigned=entries.filter(x=>x.dueDate<=today),remaining=100-solved.length,daysLeft=today>end?0:started?91-day:90;
 const weak=entries.filter(x=>!x.solved&&!!p.practice?.[x.question.id]?.attempts.length),next=due[0]||weak[0]||entries.find(x=>!x.solved);
 return {entries,solved:solved.length,due,assigned:assigned.length,remaining,daysLeft,end,day,started,next,pace:daysLeft?Number((remaining/daysLeft).toFixed(1)):remaining,extended:entries.filter(x=>x.dueDate>end&&!x.solved).length,completeDays:quests.filter(q=>p.days[q.day]?.completedAt&&dayAssignments(q.day).dsa.every(x=>p.practice?.[x.id]?.solvedAt)).length};
}
export function communicationStats(p:Progress,today=dateKey()){
 const entries=quests.map(q=>({day:q.day,date:dayDate(p.startDate,q.day-1),mission:communicationMission(q.day),log:p.communication?.[q.day]}));
 return {entries,done:entries.filter(x=>x.log?.status==='done').length,attempted:entries.filter(x=>x.log?.status==='attempted').length,overdue:entries.filter(x=>x.date<today&&x.log?.status!=='done'),today:entries.find(x=>x.date===today)||entries.find(x=>!x.log||x.log.status!=='done')};
}
export function courseSnapshot(p:Progress,today=dateKey()){
 const course=courseStats(p,today),communication=communicationStats(p,today),tasks=managedTasks(p),active=tasks.filter(t=>!t.done&&t.status!=='skipped'),todayTasks=active.filter(t=>t.dueDate===today),overdue=active.filter(t=>t.dueDate<today);
 const todayMinutes=Object.values(p.days).flatMap(d=>d.submissions||[]).filter(s=>dateKey(new Date(s.at))===today).reduce((n,s)=>n+s.minutes,0);
 const constraints=Object.values(p.days).flatMap(d=>d.submissions||[]).filter(s=>s.status!=='complete'&&s.reason.trim()).slice(-6).reverse();
 return {course,communication,tasks:{today:todayTasks,overdue,pending:active.length},todayMinutes,constraints,daysRemaining:Math.max(0,Math.ceil((Date.parse(course.end+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/86400000)+1)};
}
export function finalizeCourseStart(p:Progress,startDate:string,shiftOverrides=true):Progress{
 if(p.enrollment?.startFinal||p.enrollment?.startDateChangeUsed)throw new Error('Your course start date is already locked.');
 const next=changeCourseStart(p,startDate,shiftOverrides),at=new Date().toISOString();
 return {...next,updatedAt:at,enrollment:{startFinal:true,startDateChangeUsed:true,lockKey:'course_start_locked_v1',finalizedAt:at,startedAt:startDate}};
}
export function changeCourseStart(p:Progress,startDate:string,shiftOverrides=true):Progress{
 if(p.enrollment?.startFinal||p.enrollment?.startDateChangeUsed)throw new Error('Your course start date is locked. Export a backup before starting a new 90-day course.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(startDate)||dateKey(new Date(startDate+'T12:00:00'))!==startDate)throw new Error('Choose a valid course start date.');
 const difference=Math.round((Date.parse(startDate+'T00:00:00Z')-Date.parse(p.startDate+'T00:00:00Z'))/86400000),at=new Date().toISOString();
 if(!difference)return p;
 const items={...p.planning?.items};
 if(shiftOverrides&&p.planning){const tasks=managedTasks(p);for(const [id,item] of Object.entries(items)){if(tasks.find(t=>t.id===id)?.done)continue;const dueDate=dayDate(item.dueDate,difference),reason=`Course start changed from ${p.startDate} to ${startDate}`;items[id]={...item,dueDate,updatedAt:at,history:[...item.history,{at,dueDate,status:item.status,reason}]}}}
 return {...p,startDate,updatedAt:at,...(p.planning?{planning:{...p.planning,items}}:{})};
}
export function markQuestionSolved(p:Progress,id:string):Progress{
 const r=p.practice?.[id];
 if(!r?.attempts.length)throw new Error('Submit an answer before marking the question solved.');
 return {...p,updatedAt:new Date().toISOString(),practice:{...p.practice,[id]:{...r,solvedAt:r.solvedAt?undefined:new Date().toISOString(),updatedAt:new Date().toISOString()}}};
}
