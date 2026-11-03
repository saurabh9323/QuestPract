'use client';

import {useState, type MouseEvent} from 'react';
import {ArrowUpRight, GitCompareArrows} from 'lucide-react';
import {fundamentalTracks} from '@/lib/fundamentals';
import {commonFoundations} from '@/lib/fundamentals/common';
import {navigateWorkspace} from '@/lib/workspace-location';

function follow(event: MouseEvent<HTMLAnchorElement>, path: string) {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigateWorkspace(path);
  window.scrollTo({top: 0, behavior: 'auto'});
}

export default function CommonFoundations() {
  const [left, setLeft] = useState('javascript');
  const [right, setRight] = useState('python');
  const choices = [{value: left, set: setLeft}, {value: right, set: setRight}];
  return <div className="fundamentals-common">
    <div className="fc-heading"><span className="eyebrow">LEARN ONCE · COMPARE CAREFULLY</span><h2>Different stacks.<br/><em>Connected ideas.</em></h2><p>Bring what you already know to your next language. Compare the execution models, then practise explaining what changes.</p></div>
    <section className="card fc-comparison" aria-label="Compare execution models">
      <div className="fc-comparison-heading"><GitCompareArrows size={23}/><div><h3>Put two technologies side by side</h3><p>Similar names can describe different behavior. Name the runtime and the boundary.</p></div></div>
      <div className="fundamentals-compare">{choices.map(({value, set}, index) => {
        const track = fundamentalTracks.find(item => item.id === value)!;
        return <article key={index}>
          <label>Technology {index + 1}<select value={value} onChange={event => set(event.target.value)}>{fundamentalTracks.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <p><strong>{track.kind}</strong> · {track.summary}</p>
          <ol className="fc-stage-list">{track.runtime.map((stage, i) => <li key={stage}><span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span><p>{stage}</p></li>)}</ol>
          <h4>Threads & concurrency</h4><p>{track.threading}</p>
          <a href={`/fundamentals/${track.id}/?section=runtime`} onClick={event => follow(event, `/fundamentals/${track.id}/?section=runtime`)}>Explore {track.name} <ArrowUpRight size={15}/></a>
        </article>;
      })}</div>
      <small>Explanatory models. These diagrams do not execute or measure code.</small>
    </section>
    <div className="fc-section-heading"><span className="eyebrow">THE IDEAS THAT TRAVEL WITH YOU</span><h3>Build connections, not isolated definitions.</h3></div>
    <div className="fundamentals-grid">{commonFoundations.map((concept, index) => <article className="card fc-concept" key={concept.title}>
      <span className="fc-concept-number">{String(index + 1).padStart(2, '0')}</span><h3>{concept.title}</h3><p>{concept.idea}</p><p>{concept.example}</p><blockquote>{concept.question}</blockquote>
      <div className="fundamentals-actions">{concept.tracks.map(id => {
        const track = fundamentalTracks.find(item => item.id === id)!;
        return <a key={id} href={`/fundamentals/${id}/`} onClick={event => follow(event, `/fundamentals/${id}/`)}>{track.name} <ArrowUpRight size={13}/></a>;
      })}</div>
    </article>)}</div>
  </div>;
}
