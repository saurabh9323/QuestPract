import {foundationLessons} from './lessons';
import type {ReadingLesson} from '../commute-guides';

/** Reuse authored definitions and traces so the reader and studio stay consistent. */
export const oopFoundationReadingLessons:ReadingLesson[]=foundationLessons.map(lesson=>({
  id:'guide-oop-basics-'+lesson.id,
  title:lesson.title,
  category:'OOP & API basics',
  topic:lesson.title,
  format:'Visual guide',
  minutes:5,
  explanation:lesson.definition+'\n\nWhy it matters: '+lesson.why,
  useWhen:lesson.when,
  example:lesson.analogy.story+' Analogy limit: '+lesson.analogy.limit,
  code:lesson.code.source,
  output:lesson.code.expected,
  steps:lesson.steps.map(step=>({
    title:step.title,
    detail:step.explanation,
    state:step.nodes.map(node=>node.label+': '+node.value).join(' → ')+'\n'+step.variables.map(value=>value.name+': '+value.before+' → '+value.after).join('\n'),
    line:step.line
  })),
  pitfall:lesson.pitfall,
  interview:lesson.interviewAnswer,
  recall:lesson.question.prompt,
  answer:lesson.question.options.find(option=>option.correct)!.feedback,
  resource:lesson.sources[0]?.url,
  questions:[{question:'What is '+lesson.title+'?',answer:lesson.definition},{question:'When would I use it?',answer:lesson.when},{question:lesson.question.prompt,answer:lesson.question.options.find(option=>option.correct)!.label+' '+lesson.question.options.find(option=>option.correct)!.feedback}]
}));
