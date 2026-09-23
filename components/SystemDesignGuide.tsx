'use client';

import {useState} from 'react';
import {ArrowDown, Copy, Download, FilePenLine} from 'lucide-react';
import {questionBank, type Question} from '@/lib/bank';
import {designBrief, designGuide, designLevels, designSections, designTemplate, workedDesigns} from '@/lib/system-design';

type Props={q:Question;appendTemplate:(text:string)=>void;notice:(text:string)=>void};

function download(name:string,text:string){
 const url=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download=name;link.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export function SystemDesignPath({difficulty,choose,open}:{difficulty:string;choose:(level:string)=>void;open:(id:string)=>void}){
 const questions=questionBank.filter(q=>q.kind==='System design');
 return <section className="card design-path">
  <span className="eyebrow">SYSTEM-DESIGN LEARNING PATH</span>
  <h2>Start simple. Add constraints as you improve.</h2>
  <p>100 questions across high-level architecture, OOP low-level design and functional design. Levels describe learning difficulty, not a universal interview standard.</p>
  <div className="design-levels">{(['Easy','Medium','Hard'] as const).map(level=><button className="secondary" key={level} aria-pressed={difficulty===level} onClick={()=>choose(level)}>
   <strong>{level} · {questions.filter(q=>q.difficulty===level).length}</strong><span>{designLevels[level].focus}</span><small>Suggested practice: {designLevels[level].minutes} min</small>
  </button>)}</div>
  <button className="text-btn" onClick={()=>choose('All')}>Show every difficulty</button>
  <details><summary>Begin with a worked design</summary><div className="design-examples">{Object.keys(workedDesigns).map(id=>{
   const q=questions.find(q=>q.id===id);return q?<button className="secondary" key={id} onClick={()=>open(id)}><small>{q.difficulty} · {designGuide(q).mode}</small><span>{workedDesigns[id].name}</span></button>:null;
  })}</div></details>
 </section>;
}

export default function SystemDesignGuide({q,appendTemplate,notice}:Props){
 const [step,setStep]=useState(0);
 const g=designGuide(q),b=g.blueprint;
 const diagram=`flowchart LR\n${b.nodes.map((n,i)=>`  n${i}[${JSON.stringify(n)}]`).join('\n')}\n${b.flows.map((f,i)=>`  n${i} -->|${JSON.stringify(f)}| n${i+1}`).join('\n')}`;
 const workedMarkdown=`# ${b.name}\n\n${g.example?'Worked design for this question':'Scenario-specific starting design'}\n\n${g.example?`Scope: ${g.example.scope}\n\nRequirements:\n${g.example.requirements.map(x=>'- '+x).join('\n')}\n\nEstimate / invariant: ${g.example.estimate}\n\n`:''}\`\`\`mermaid\n${diagram}\n\`\`\`\n\n## Contract\n${b.contract}\n\n## Data model\n${b.data}\n\n## Failure\n${b.failure}\n\n## Tradeoff\n${b.tradeoff}${g.example?`\n\n## Main flow\n${g.example.walkthrough.map((x,i)=>`${i+1}. ${x}`).join('\n')}\n\n## Implementation\n${g.example.implementation.map((x,i)=>`${i+1}. ${x}`).join('\n')}`:''}`;
 async function copy(){try{await navigator.clipboard.writeText(`${designBrief(q)}\n\n${designTemplate(q)}`);notice('Design brief and blank answer template copied.')}catch{notice('Clipboard unavailable. Download the template instead.')}}
 return <section className="design-guide" aria-label="Structured system design guide">
  <div className="design-guide-heading"><span className="mini-tag">{g.mode}</span><span>{q.difficulty} · suggested {g.minutes} min</span></div>
  <p>{g.focus} You can take longer; this is a practice budget.</p>
  <h3>1. Clarify before drawing</h3>
  <ul>{b.clarify.map(x=><li key={x}>{x}</li>)}</ul>
  <p className="design-focus"><strong>This question’s key constraint:</strong> {q.logic}</p>
  <h3>2. Use the same answer structure</h3>
  <ol className="design-answer-format">{designSections.map(([title,prompt])=><li key={title}><strong>{title}</strong><p>{prompt}</p></li>)}</ol>
  <div className="button-row">
   <button className="primary" onClick={()=>appendTemplate(designTemplate(q))}><FilePenLine size={16}/> Add template to my answer</button>
   <button className="secondary" onClick={()=>void copy()}><Copy size={16}/> Copy brief + template</button>
   <button className="secondary" onClick={()=>download(`${q.id}-template.md`,`${designBrief(q)}\n\n${designTemplate(q)}`)}><Download size={16}/> Template .md</button>
  </div>
  <small>The template is appended to your draft. Submit answer below to preserve a version.</small>
  <details className="design-reference">
   <summary>{g.example?'3. Reveal worked design, diagram and implementation':'3. Reveal this scenario’s diagram and contracts'}</summary>
   <h3>{b.name}</h3>{g.scenario&&<p className="design-focus"><strong>Concrete scenario:</strong> {g.scenario.example}</p>}
   <p>{g.example?'One defensible starting design, not the only correct answer. State and adjust the assumptions in an interview.':'This starting design is specific to the question. Expand its assumptions, estimates and recovery paths for your chosen interview scope.'}</p>
   {g.example&&<><h4>Scope</h4><p>{g.example.scope}</p><h4>Requirements</h4><ul>{g.example.requirements.map(x=><li key={x}>{x}</li>)}</ul><h4>Estimate or invariant</h4><p>{g.example.estimate}</p></>}
   <h4>{g.mode.startsWith('Low-level')?'Collaboration diagram':'Architecture / data-flow diagram'}</h4>
   <p className="muted">Select a box to follow the illustrated forward path. Replies and recovery paths are explained separately below.</p>
   <ol className="design-flow-diagram" aria-label={`${b.name} forward flow`}>{b.nodes.map((node,i)=><li key={node}>
    <button aria-pressed={step===i} onClick={()=>setStep(i)}><small>STEP {i+1}</small><strong>{node}</strong></button>
    {i<b.flows.length&&<span className="design-connector"><ArrowDown size={21} aria-hidden="true"/>{b.flows[i]}</span>}
   </li>)}</ol>
   <p className="design-focus" role="status"><strong>{b.nodes[step]}:</strong> {step===0?'Start the use case here and identify the caller or source of the command.':`Reached through “${b.flows[step-1]}”. Explain ownership and what happens if this boundary fails.`}</p>
   <h4>API or method contract</h4><pre>{b.contract}</pre>
   <h4>Data model & constraints</h4><pre>{b.data}</pre>
   {g.example&&<><h4>Concrete happy path</h4><ol>{g.example.walkthrough.map(x=><li key={x}>{x}</li>)}</ol></>}
   <h4>Failure and recovery</h4><p>{b.failure}</p>
   <h4>Tradeoff</h4><p>{b.tradeoff}</p>
   {g.example&&<><h4>Implementation order</h4><ol>{g.example.implementation.map(x=><li key={x}>{x}</li>)}</ol></>}
   <details><summary>Diagram as Mermaid text</summary><pre>{diagram}</pre></details>
   <button className="secondary" onClick={()=>download(`${q.id}-design-guide.md`,`${designBrief(q)}\n\n${workedMarkdown}`)}><Download size={16}/> Download design + diagram</button>
  </details>
  <details><summary>4. Explain your design in the interview</summary><p>“The main requirement is ___. I chose ___ because ___. Here is the request path. If ___ fails, we ___. The tradeoff is ___. I would change this design when ___.”</p><p>Self-check: can you trace a normal request, a duplicate request, and one failure? Can you justify every box and name an alternative?</p></details>
 </section>;
}
