'use client';

import {useEffect, useState, useSyncExternalStore} from 'react';
import {ArrowRight, ChevronLeft, ChevronRight, GitBranch, Pause, Play} from 'lucide-react';
import type {FundamentalTrack} from '@/lib/fundamentals/types';

function subscribeMotion(onChange: () => void) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
const motionSnapshot = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function RuntimeWalkthrough({track}: {track: FundamentalTrack}) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeMotion, motionSnapshot, () => false);
  const lastStep = track.runtime.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (reducedMotion) { setPlaying(false); return; }
    const timer = window.setTimeout(() => {
      setStep(current => Math.min(current + 1, lastStep));
      if (step >= lastStep - 1) setPlaying(false);
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [playing, reducedMotion, step, lastStep]);

  function chooseStage(index: number) {
    setPlaying(false);
    setStep(index);
  }

  return <section className="ft-runtime" aria-labelledby={`runtime-${track.id}`}>
    <div className="ft-section-heading"><div><span className="eyebrow">UNDER THE HOOD</span><h2 id={`runtime-${track.id}`}>From source to running system.</h2><p>Follow the work through {track.name}. Select a stage to look closer.</p></div><span className="ft-section-count">{track.runtime.length} stages</span></div>
    <div className="card ft-runtime-layout">
      <ol className="ft-runtime-timeline" aria-label="Execution stages">
        {track.runtime.map((stage, index) => <li key={stage}>
          <button className={`ft-runtime-stage${index === step ? ' is-current' : ''}`} aria-current={index === step ? 'step' : undefined} onClick={() => chooseStage(index)}>
            <span className="ft-stage-number">{String(index + 1).padStart(2, '0')}</span><span>{stage}</span><ArrowRight size={17} aria-hidden="true"/>
          </button>
        </li>)}
      </ol>
      <div className="ft-runtime-current">
        <div className="ft-stage-display" role="status" aria-live="polite" aria-atomic="true"><span className="eyebrow">CURRENT STAGE · {String(step + 1).padStart(2, '0')} / {String(track.runtime.length).padStart(2, '0')}</span><span className="ft-stage-figure" aria-hidden="true">{String(step + 1).padStart(2, '0')}</span><h3>{track.runtime[step]}</h3></div>
        <div className="ft-runtime-controls">
          <button className="secondary" disabled={step === 0} onClick={() => chooseStage(step - 1)} aria-label="Previous stage"><ChevronLeft size={17} aria-hidden="true"/>Previous</button>
          <button className="primary" disabled={reducedMotion} onClick={() => {
            if (playing) setPlaying(false);
            else { if (step === lastStep) setStep(0); setPlaying(true); }
          }}>{playing && !reducedMotion ? <Pause size={16} aria-hidden="true"/> : <Play size={16} aria-hidden="true"/>}{playing && !reducedMotion ? 'Pause' : step === lastStep ? 'Replay' : 'Play walkthrough'}</button>
          <button className="secondary" disabled={step === lastStep} onClick={() => chooseStage(step + 1)} aria-label="Next stage">Next<ChevronRight size={17} aria-hidden="true"/></button>
        </div>
        <p className="ft-caption">{reducedMotion ? 'Automatic playback is disabled by your reduced-motion preference. Use the stage buttons to explore.' : 'Stages advance every 2.8 seconds during playback. You can pause or choose any stage.'}</p>
      </div>
    </div>
    <p className="ft-runtime-disclaimer">Conceptual model only. This is not a live compiler, debugger or thread scheduler; exact internals depend on the implementation and version.</p>
    <div className="card ft-concurrency"><span className="ft-concurrency-icon"><GitBranch size={24} aria-hidden="true"/></span><div><span className="eyebrow">THE CONCURRENCY QUESTION</span><h3>What about threads and async?</h3><p>{track.threading}</p></div></div>
  </section>;
}
