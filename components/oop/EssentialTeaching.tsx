"use client";

import { useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { oopEssentials, oopMessageTraces, type OopEssential } from '@/lib/oop-essentials';
import { oopLessons } from '@/lib/oop';

export type OopKnowledgeChecks = Record<string, string>;

export function EssentialsPath({ selected, checks, onSelect }: {
  selected: string; checks: OopKnowledgeChecks; onSelect: (id: string) => void;
}) {
  const checked = oopEssentials.filter(lesson => checks[lesson.id]).length;
  const correct = oopEssentials.filter(lesson => lesson.quiz.options.some(option => option.correct && option.id === checks[lesson.id])).length;
  const groups = [
    { title: '1 · Understand an object', ids: ['objects', 'encapsulation', 'abstraction'] },
    { title: '2 · Choose relationships', ids: ['inheritance', 'polymorphism', 'composition', 'contracts'] },
    { title: '3 · Apply SOLID thoughtfully', ids: ['srp', 'ocp', 'lsp', 'isp', 'dip'] }
  ];
  return <section className="card oop-essentials-path" aria-labelledby="oop-essential-title">
    <div className="oop-essential-heading">
      <div><span className="eyebrow">A FOCUSED START · 12 ESSENTIALS</span><h3 id="oop-essential-title">Understand it. Compare designs. Explain the choice.</h3></div>
      <div className="oop-check-count"><strong>{correct}/12</strong><span>knowledge checks correct<br/>{checked} checked this session</span></div>
    </div>
    <p>Begin with state and contracts, then choose relationships and apply SOLID to real changes. Your existing patterns and design challenges are still available in the studio.</p>
    <details>
      <summary>Choose a step in the essentials path</summary>
      <div className="oop-path-groups">{groups.map(group => <div key={group.title}>
        <h4>{group.title}</h4>
        {group.ids.map(id => <button type="button" key={id} className={selected === id ? 'selected' : ''} aria-pressed={selected === id} onClick={() => onSelect(id)}>
          {oopLessons.find(lesson => lesson.id === id)?.title}
        </button>)}
      </div>)}</div>
    </details>
    <small>Checks are session-only practice, not a mastery or interview-readiness score. Save your own explanation in the answer workspace to keep a learning record.</small>
  </section>;
}

export function EssentialFocus({ essential }: { essential: OopEssential }) {
  return <div className="oop-essential-focus">
    <strong>The idea to keep</strong><p>{essential.takeaway}</p>
    <dl><div><dt>When it helps</dt><dd>{essential.useWhen}</dd></div><div><dt>What to weigh</dt><dd>{essential.tradeoff}</dd></div></dl>
  </div>;
}

export function EssentialComparison({ essential }: { essential: OopEssential }) {
  return <section className="oop-comparison" aria-labelledby={`oop-compare-${essential.id}`}>
    <h3 id={`oop-compare-${essential.id}`}>{essential.comparison.title}</h3>
    <div className="oop-comparison-grid">
      <div><h4>Starting design</h4><pre tabIndex={0} aria-label="Starting design code"><code>{essential.comparison.before}</code></pre></div>
      <div><h4>A more suitable boundary here</h4><pre tabIndex={0} aria-label="Revised design code"><code>{essential.comparison.after}</code></pre></div>
    </div>
    <p>{essential.comparison.explanation}</p>
    <small>Illustrative TypeScript fragments: read and reason about them. The app does not execute this code.</small>
  </section>;
}

export function EssentialQuiz({ essential, checkedChoice, onCheck }: {
  essential: OopEssential; checkedChoice?: string; onCheck: (choice: string) => void;
}) {
  const [choice, setChoice] = useState(checkedChoice || '');
  const [checked, setChecked] = useState(Boolean(checkedChoice));
  const option = essential.quiz.options.find(item => item.id === choice);
  const feedbackId = `oop-quiz-feedback-${essential.id}`;
  return <section className="oop-knowledge-check" aria-labelledby={`oop-quiz-${essential.id}`}>
    <span className="eyebrow">REASON ABOUT A SCENARIO</span>
    <h3 id={`oop-quiz-${essential.id}`}>Which choice keeps the promise?</h3>
    <fieldset aria-describedby={checked ? feedbackId : undefined}>
      <legend>{essential.quiz.scenario}</legend>
      {essential.quiz.options.map(item => <label key={item.id} className={choice === item.id ? 'selected' : ''}>
        <input type="radio" name={`oop-check-${essential.id}`} value={item.id} checked={choice === item.id} onChange={() => { setChoice(item.id); setChecked(false); }}/>
        <span>{item.text}</span>
      </label>)}
    </fieldset>
    <button type="button" className="primary" disabled={!choice} onClick={() => { onCheck(choice); setChecked(true); }}>Check reasoning</button>
    <div id={feedbackId} className="oop-quiz-feedback" role="status">{checked && option && <><strong>{option.correct ? 'Correct — explain why in your own words.' : 'Reconsider this choice.'}</strong><p>{option.feedback}</p></>}</div>
    <small>You can change your answer and check again. These checks do not submit an attempt or change your saved self-assessment.</small>
  </section>;
}

export function InterviewModel({ essential }: { essential: OopEssential }) {
  return <details className="oop-model-answer">
    <summary>Read a beginner-friendly interview answer</summary>
    <p>Use this structure, then replace the example with a design you have worked on.</p>
    <ol>
      <li><strong>Define:</strong> {essential.answer.define}</li>
      <li><strong>Give one example:</strong> {essential.answer.example}</li>
      <li><strong>Name the tradeoff:</strong> {essential.answer.tradeoff}</li>
    </ol>
    <p><strong>Close with:</strong> “Would you like me to sketch the contract or walk through a failing case?”</p>
  </details>;
}

export function ObjectMessageTrace({ initialScenario = 'withdraw-success' }: { initialScenario?: string }) {
  const [scenarioId, setScenarioId] = useState(initialScenario);
  const [index, setIndex] = useState(0);
  const scenario = oopMessageTraces.find(trace => trace.id === scenarioId) || oopMessageTraces[0];
  const step = scenario.steps[index];
  return <section className="oop-message-trace" aria-label="Object, message and state walkthrough">
    <span className="eyebrow">FOLLOW THE OBJECT · ONE STEP AT A TIME</span>
    <h3>Who receives the message? What changes?</h3>
    <p>A fixed walkthrough of object behavior. Each scenario starts fresh; it does not run code or change the wallet simulator.</p>
    <label className="field-label">Choose a scenario<select value={scenario.id} onChange={event => { setScenarioId(event.target.value); setIndex(0); }}>
      {oopMessageTraces.map(trace => <option key={trace.id} value={trace.id}>{trace.title}</option>)}
    </select></label>
    <p className="oop-trace-concept">{scenario.concept}</p>
    <ol className="oop-trace-step-picker" aria-label="Walkthrough steps">{scenario.steps.map((item, position) => <li key={item.label}>
      <button type="button" aria-current={position === index ? 'step' : undefined} onClick={() => setIndex(position)}>{position + 1}. {item.label}</button>
    </li>)}</ol>
    <div className="oop-message-diagram" aria-live="polite" aria-atomic="true">
      <p className="oop-current-step"><strong>Step {index + 1} of {scenario.steps.length}: {step.label}</strong></p>
      <div className="oop-message-route">
        <div><span>Caller</span><strong>{step.caller}</strong></div>
        <div className="oop-message-arrow"><span>Message / operation</span><code>{step.message}</code><ArrowRight aria-hidden="true" size={22}/></div>
        <div><span>Receiver / handler</span><strong>{step.receiver}</strong></div>
      </div>
      <dl className="oop-state-grid"><div><dt>State before this step</dt><dd>{step.before}</dd></div><div><dt>State after this step</dt><dd>{step.after}</dd></div></dl>
      <p><strong>Observable result:</strong> {step.result}</p><p>{step.explanation}</p>
    </div>
    <div className="oop-trace-controls">
      <button type="button" className="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}><ArrowLeft size={16}/>Previous step</button>
      <button type="button" className="primary" disabled={index === scenario.steps.length - 1} onClick={() => setIndex(index + 1)}>Next step<ArrowRight size={16}/></button>
      <button type="button" className="secondary" onClick={() => setIndex(0)}><RotateCcw size={16}/>Restart</button>
    </div>
  </section>;
}
