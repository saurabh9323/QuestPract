'use client';

import {useRef, useState, type KeyboardEvent, type MouseEvent} from 'react';
import {ArrowUpRight, BookOpen, Check, ChevronDown, Code2, Copy, GitBranch, MessageCircle, PencilLine, RotateCcw} from 'lucide-react';
import {fundamentalRecord} from '@/lib/fundamentals/progress';
import {fundamentalTutorContext} from '@/lib/fundamentals/tutor';
import type {FundamentalConcept, FundamentalQuestion, FundamentalTrack} from '@/lib/fundamentals/types';
import {navigateWorkspace} from '@/lib/workspace-location';
import {copyText, Field, useStudio} from '../studio/StudioContext';

const answerTabs = [
  {id: 'explanation', label: 'Explanation', Icon: BookOpen},
  {id: 'code', label: 'Code', Icon: Code2},
  {id: 'execution', label: 'Execution', Icon: GitBranch},
] as const;
type AnswerTab = typeof answerTabs[number]['id'];

export default function FundamentalQuestionCard({track, q, concept, number}: {
  track: FundamentalTrack;
  q: FundamentalQuestion;
  concept: FundamentalConcept;
  number: number;
}) {
  const {get, patch, notice} = useStudio();
  const id = fundamentalRecord(track.id, concept.id);
  const record = get(id);
  const rating = record.fields[`rating_${q.lens}`] || '';
  const [revealed, setRevealed] = useState(false);
  const [tab, setTab] = useState<AnswerTab>('explanation');
  const tabButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const context = fundamentalTutorContext(track, concept, q, record.fields[`answer_${q.lens}`] || '');
  const commuteUrl = `/commute/?lesson=guide-fundamentals-${track.id}-${concept.id}`;

  function askTutor() {
    window.dispatchEvent(new CustomEvent('quest90:question-help', {detail: {
      id: q.id,
      title: `${track.name}: ${concept.title}`,
      context: context.text,
      prompt: 'Ask me one follow-up about this concept. Wait for my answer. Help me improve clarity and correctness without inventing project experience. The example is illustrative, not a verified execution.',
    }}));
  }

  function changeTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % answerTabs.length;
    else if (event.key === 'ArrowLeft') next = (index + answerTabs.length - 1) % answerTabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = answerTabs.length - 1;
    else return;
    event.preventDefault();
    setTab(answerTabs[next].id);
    tabButtons.current[next]?.focus();
  }

  function openCommute(event: MouseEvent<HTMLAnchorElement>) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigateWorkspace(commuteUrl);
    window.scrollTo({top: 0, behavior: 'auto'});
  }

  return <article className="card ft-question" id={q.id} aria-labelledby={`question-${q.id}`}>
    <div className="ft-question-meta">
      <span className="eyebrow">{concept.category} <span aria-hidden="true">/</span> {concept.title}</span>
      <span className={`ft-status ${rating === 'ready' ? 'is-ready' : rating === 'revise' ? 'is-revise' : 'is-unrated'}`}>
        {rating === 'ready' ? 'Can explain' : rating === 'revise' ? 'Needs revision' : 'Not rated'}
      </span>
    </div>
    <div className="ft-question-heading">
      <span className="ft-question-number" aria-label={`Question ${number}`}>{String(number).padStart(2, '0')}</span>
      <div><span className="ft-lens">{q.lens}</span><h3 id={`question-${q.id}`}>{q.question}</h3></div>
    </div>

    <details className="ft-draft">
      <summary><PencilLine size={16} aria-hidden="true"/> Try my answer first <span>{record.fields[`answer_${q.lens}`]?.trim() ? 'Draft saved' : 'Use your own words'}</span></summary>
      <Field id={id} name={`answer_${q.lens}`} label={`My ${q.lens.toLowerCase()} answer: ${concept.title}`} placeholder="Definition → why it matters → a real example → one limitation. Use your own words." rows={4}/>
    </details>

    <button className="ft-reveal" aria-expanded={revealed} aria-controls={`answer-${q.id}`} onClick={() => setRevealed(value => !value)}>
      <BookOpen size={17} aria-hidden="true"/> {revealed ? 'Hide answer & example' : 'Reveal answer & example'} <ChevronDown size={17} aria-hidden="true"/>
    </button>

    {revealed && <div id={`answer-${q.id}`} className="ft-answer">
      <div className="ft-answer-tabs" role="tablist" aria-label={`Answer views for ${concept.title}: ${q.lens}`}>
        {answerTabs.map(({id: tabId, label, Icon}, index) => <button
          key={tabId}
          ref={element => { tabButtons.current[index] = element; }}
          role="tab"
          id={`${q.id}-tab-${tabId}`}
          aria-controls={`${q.id}-panel-${tabId}`}
          aria-selected={tab === tabId}
          tabIndex={tab === tabId ? 0 : -1}
          onKeyDown={event => changeTab(event, index)}
          onClick={() => setTab(tabId)}
        ><Icon size={15} aria-hidden="true"/>{label}</button>)}
      </div>

      <div className="ft-answer-panel" role="tabpanel" id={`${q.id}-panel-explanation`} aria-labelledby={`${q.id}-tab-explanation`} tabIndex={0} hidden={tab !== 'explanation'}>
        <p className="ft-direct-answer">{q.answer}</p>
        <h4>Make it concrete</h4><p>{concept.example}</p>
        <div className="ft-callout ft-callout-caution"><strong>Watch out</strong><p>{concept.pitfall}</p></div>
        <div className="ft-callout ft-callout-practice"><strong>Change one thing. Investigate.</strong><p>{concept.exercise}</p></div>
      </div>

      <div className="ft-answer-panel" role="tabpanel" id={`${q.id}-panel-code`} aria-labelledby={`${q.id}-tab-code`} tabIndex={0} hidden={tab !== 'code'}>
        <p>{concept.example}</p>
        <div className="ft-code-toolbar"><span><Code2 size={15} aria-hidden="true"/> {track.name} · illustrative example</span><button className="secondary" onClick={() => copyText(concept.code, notice)} aria-label={`Copy code example for ${concept.title}`}><Copy size={14} aria-hidden="true"/>Copy code</button></div>
        <pre className="ft-code-block" tabIndex={0} aria-label={`${concept.title} code example`}><code>{concept.code.split('\n').map((line, index) => <span className="ft-code-line" key={index}><span className="ft-line-number" aria-hidden="true">{index + 1}</span><span className="ft-code-source">{line || '\u00a0'}</span>{'\n'}</span>)}</code></pre>
        <div className="ft-expected-output"><strong>Expected behavior</strong><p>{concept.output}</p></div>
        <p className="ft-caption">Illustrative snippet; setup may be required. This guide does not run or judge code.</p>
      </div>

      <div className="ft-answer-panel" role="tabpanel" id={`${q.id}-panel-execution`} aria-labelledby={`${q.id}-tab-execution`} tabIndex={0} hidden={tab !== 'execution'}>
        <h4>Behind the example</h4><p>{concept.execution}</p>
        <div className="ft-callout"><strong>Concurrency in {track.name}</strong><p>{track.threading}</p></div>
        <p className="ft-caption">A conceptual explanation, not a live debugger or thread scheduler. Check implementation and version details in the official references.</p>
      </div>
    </div>}

    <div className="ft-rating-bar">
      <span>How well can you explain it?</span>
      <div className="fundamentals-actions">
        <button className={`secondary${rating === 'revise' ? ' is-revise' : ''}`} aria-pressed={rating === 'revise'} onClick={() => patch(id, {[`rating_${q.lens}`]: 'revise'})}><RotateCcw size={15} aria-hidden="true"/>Needs revision</button>
        <button className={rating === 'ready' ? 'primary' : 'secondary'} aria-pressed={rating === 'ready'} onClick={() => patch(id, {[`rating_${q.lens}`]: 'ready'})}><Check size={15} aria-hidden="true"/>I can explain this</button>
        {rating && <button className="ft-text-button" onClick={() => patch(id, {[`rating_${q.lens}`]: ''})}>Clear rating</button>}
      </div>
    </div>
    <div className="ft-question-tools">
      <button className="ft-text-button" onClick={askTutor}><MessageCircle size={16} aria-hidden="true"/>Practise with tutor</button>
      <a href={commuteUrl} onClick={openCommute}>Read in Commute <ArrowUpRight size={15} aria-hidden="true"/></a>
    </div>
    {context.trimmed && <p className="ft-caption">Tutor context trimmed to fit the existing 1,600-character topic limit. The draft excerpt includes up to 500 characters. Review the prepared message before sending.</p>}
    <details className="ft-notes"><summary>My notes for {concept.title}</summary><Field id={id} name="notes" label={`Notes: ${concept.title}`} rows={3}/></details>
  </article>;
}
