'use client';
import {useState,type ComponentProps} from 'react';
import {ArrowLeft} from 'lucide-react';
import {AssignedPractice} from './CourseTimeline';
import {AnswerWorkspace} from './TrainingLab';
import {questionBank} from '@/lib/bank';

export default function DailyPractice({day,...props}:Omit<ComponentProps<typeof AnswerWorkspace>,'q'>&{day:number}){
  const [selected,setSelected]=useState('');
  const question=questionBank.find(q=>q.id===selected);
  return <div className="daily-practice">{question?<><button className="secondary" onClick={()=>setSelected('')}><ArrowLeft size={16}/>Day {day} assignments</button><AnswerWorkspace key={question.id} {...props} q={question}/></>:<AssignedPractice p={props.p} day={day} practice={setSelected}/>}</div>;
}
