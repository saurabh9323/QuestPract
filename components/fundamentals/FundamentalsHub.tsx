'use client';

import {useState, type MouseEvent} from 'react';
import {ArrowDown, ArrowRight, ArrowUpRight, Bookmark, Check, ChevronRight, Code2, Grid2X2, List, Search, X} from 'lucide-react';
import {fundamentalTracks} from '@/lib/fundamentals';
import {fundamentalProgress, fundamentalRecord} from '@/lib/fundamentals/progress';
import type {FundamentalConcept, FundamentalTrack} from '@/lib/fundamentals/types';
import type {StudioState} from '@/lib/studio-state';
import {navigateWorkspace} from '@/lib/workspace-location';
import {useStudio} from '../studio/StudioContext';

type Category = 'All' | 'Languages' | 'Frontend' | 'Backend' | 'Data';
type TrackPresentation = {initials:string; category:Exclude<Category, 'All'>; summary:string; stages:string[]};

const categories:Category[] = ['All', 'Languages', 'Frontend', 'Backend', 'Data'];
const presentation:Record<string, TrackPresentation> = {
  javascript: {initials:'JS', category:'Languages', summary:'Values, scope, and the asynchronous ideas behind everyday JavaScript.', stages:['Load', 'Parse', 'Execute', 'Schedule', 'Collect']},
  react: {initials:'Re', category:'Frontend', summary:'Components, state, and the journey from a render to a committed UI.', stages:['Transform', 'Trigger', 'Render', 'Commit', 'Effects']},
  vite: {initials:'Vi', category:'Frontend', summary:'Module graphs, fast development feedback, and production builds.', stages:['Configure', 'Transform', 'Update', 'Build', 'Run']},
  nextjs: {initials:'N', category:'Frontend', summary:'Routing, server and client boundaries, rendering, and data flow.', stages:['Build', 'Route', 'Render', 'Stream', 'Hydrate']},
  cpp: {initials:'C++', category:'Languages', summary:'Native execution, ownership, value semantics, and resource lifetimes.', stages:['Preprocess', 'Compile', 'Load', 'Execute']},
  java: {initials:'Ja', category:'Languages', summary:'Typed objects, collections, concurrency, and execution on the JVM.', stages:['Compile', 'Load', 'Optimize', 'Execute']},
  csharp: {initials:'C#', category:'Languages', summary:'Value and reference types, object design, queries, and async methods.', stages:['Compile', 'Emit IL', 'Load', 'Execute']},
  dotnet: {initials:'.N', category:'Backend', summary:'Managed execution, application hosting, services, and data access.', stages:['Build', 'Load', 'Compile', 'Serve', 'Manage']},
  python: {initials:'Py', category:'Languages', summary:'Names, objects, iteration, and the execution model behind Python.', stages:['Parse', 'Compile', 'Evaluate', 'Call', 'Release']},
  flask: {initials:'Fl', category:'Backend', summary:'Follow a request through routes, contexts, responses, and cleanup.', stages:['Configure', 'Accept', 'Dispatch', 'Respond', 'Clean up']},
  fastapi: {initials:'Fa', category:'Backend', summary:'Typed APIs, validation, dependencies, and asynchronous request handling.', stages:['Start', 'Accept', 'Validate', 'Execute', 'Respond']},
  django: {initials:'Dj', category:'Backend', summary:'URL dispatch, models, authentication, and transactional correctness.', stages:['Load', 'Middleware', 'Dispatch', 'Query', 'Respond']},
  express: {initials:'Ex', category:'Backend', summary:'Middleware, validation, error handling, and Node.js request boundaries.', stages:['Register', 'Accept', 'Dispatch', 'Await', 'Respond']},
  nodejs: {initials:'No', category:'Backend', summary:'The event loop, asynchronous I/O, modules, and process resources.', stages:['Resolve', 'Parse', 'Execute', 'Coordinate', 'Clean up']},
  bun: {initials:'Bu', category:'Backend', summary:'JavaScript execution, host APIs, and the boundaries of Bun’s tooling.', stages:['Resolve', 'Transform', 'Execute', 'Coordinate', 'Workers']},
  sql: {initials:'SQL', category:'Data', summary:'Query plans, joins, transactions, and how a database returns results.', stages:['Send', 'Parse', 'Plan', 'Execute', 'Return']},
  nosql: {initials:'NoS', category:'Data', summary:'Data models, access patterns, consistency, and failure trade-offs.', stages:['Choose', 'Connect', 'Locate', 'Execute', 'Persist']},
};
const knownTrackIds = new Set(fundamentalTracks.map(track => track.id));
const hubRecord = 'fundamentals-hub';

function trackHref(id:string, concept?:string) {
  return `/fundamentals/${id}/${concept ? `?concept=${encodeURIComponent(concept)}` : ''}`;
}

function follow(event:MouseEvent<HTMLAnchorElement>, href:string) {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigateWorkspace(href);
  window.scrollTo({top:0, behavior:'auto'});
}

function readFavorites(value:string | undefined):string[] {
  if (!value) return [];
  try {
    const parsed:unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((id):id is string => typeof id === 'string' && knownTrackIds.has(id)))].slice(0, 17);
  } catch {
    return [];
  }
}

function latestConcept(studio:StudioState = {}) {
  let latest:{track:FundamentalTrack; concept:FundamentalConcept; at:number} | null = null;
  for (const track of fundamentalTracks) {
    for (const concept of track.concepts) {
      const record = studio[fundamentalRecord(track.id, concept.id)];
      if (!record) continue;
      const hasWork = Object.entries(record.fields).some(([key, value]) =>
        (key.startsWith('answer_') && value.trim().length > 0) ||
        (key.startsWith('rating_') && (value === 'ready' || value === 'revise')),
      );
      const at = Date.parse(record.updatedAt);
      if ((hasWork || record.attempts.length > 0) && Number.isFinite(at) && (!latest || at > latest.at)) {
        latest = {track, concept, at};
      }
    }
  }
  return latest;
}

export default function FundamentalsHub() {
  const {p, get, patch} = useStudio();
  const [category, setCategory] = useState<Category>('All');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [savedOnly, setSavedOnly] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewStep, setPreviewStep] = useState(0);
  const recent = latestConcept(p.studio);
  const defaultTrack = fundamentalTracks.find(track => track.id === 'javascript') || fundamentalTracks[0];
  const resumeTrack = recent?.track || defaultTrack;
  const resumeHref = trackHref(resumeTrack.id, recent?.concept.id);
  const previewTrack = fundamentalTracks.find(track => track.id === (previewId || resumeTrack.id)) || defaultTrack;
  const previewMeta = presentation[previewTrack.id];
  const activeStep = Math.min(previewStep, previewTrack.runtime.length - 1);
  const favorites = readFavorites(get(hubRecord).fields.favorites);
  const stats = fundamentalTracks.map(track => ({track, ...fundamentalProgress(track, p.studio)}));
  const conceptCount = fundamentalTracks.reduce((total, track) => total + track.concepts.length, 0);
  const questionCount = stats.reduce((total, track) => total + track.total, 0);
  const readyCount = stats.reduce((total, track) => total + track.ready, 0);
  const reviseCount = stats.reduce((total, track) => total + track.revise, 0);
  const query = search.trim().toLowerCase();
  const visibleTracks = stats.filter(({track}) => {
    const meta = presentation[track.id];
    return (category === 'All' || meta.category === category) &&
      (!savedOnly || favorites.includes(track.id)) &&
      `${track.name} ${track.id} ${track.kind} ${track.summary} ${meta.summary} ${meta.category}`.toLowerCase().includes(query);
  });

  function toggleFavorite(id:string) {
    const current = readFavorites(get(hubRecord).fields.favorites);
    const next = current.includes(id) ? current.filter(value => value !== id) : [...current, id].slice(0, 17);
    patch(hubRecord, {favorites:JSON.stringify(next)});
  }

  function clearFilters() {
    setCategory('All');
    setSearch('');
    setSavedOnly(false);
  }

  return <div className="fh-hub">
    <header className="fh-hero">
      <div className="fh-hero-copy">
        <span className="fh-eyebrow"><span aria-hidden="true"/>YOUR INTERVIEW FOUNDATION</span>
        <h2>Understand the code.<br/><span>Explain the why.</span></h2>
        <p className="fh-lead">Go beyond the syntax. Build a clear mental model, follow what happens under the hood, and practise explaining it in your own words.</p>
        <div className="fh-stats" aria-label="Fundamentals library">
          <div><strong>{fundamentalTracks.length}</strong><span>technology tracks</span></div>
          <div><strong>{conceptCount.toLocaleString('en-US')}</strong><span>core concepts</span></div>
          <div><strong>{questionCount.toLocaleString('en-US')}</strong><span>interview questions</span></div>
        </div>
        <div className="fh-hero-actions">
          <a className="fh-primary" href={resumeHref} onClick={event => follow(event, resumeHref)}>{recent ? `Continue ${resumeTrack.name}` : 'Start with JavaScript'}<ArrowRight size={17} aria-hidden="true"/></a>
          <a className="fh-secondary" href="#fh-catalog">Explore all tracks<ArrowDown size={16} aria-hidden="true"/></a>
        </div>
        <p className="fh-resume-note">{recent ? <>Pick up with <strong>{recent.concept.title}</strong></> : <>One concept. Five ways to make it stick.</>}</p>
      </div>

      <section className="fh-model" aria-labelledby="fh-model-title">
        <div className="fh-model-top"><span><Code2 size={15} aria-hidden="true"/> UNDER THE HOOD</span><span className="fh-model-badge">EXPLANATORY MODEL</span></div>
        <div className="fh-model-heading">
          <div><h3 id="fh-model-title">Follow the execution.</h3><p>Choose a track. Explore each stage.</p></div>
          <label className="fh-model-select"><span className="fh-sr-only">Execution model track</span><select value={previewTrack.id} onChange={event => {setPreviewId(event.target.value); setPreviewStep(0);}}>{fundamentalTracks.map(track => <option key={track.id} value={track.id}>{track.name}</option>)}</select></label>
        </div>
        <div className="fh-model-visual" aria-hidden="true">
          <div className="fh-model-orbit"><span className="fh-orbit-ring"/><span className="fh-orbit-ring fh-orbit-ring-inner"/><span className="fh-model-core" data-track={previewTrack.id}>{previewMeta.initials}</span></div>
          <div className="fh-model-current"><span>STAGE {String(activeStep + 1).padStart(2, '0')} / {String(previewTrack.runtime.length).padStart(2, '0')}</span><strong>{previewMeta.stages[activeStep] || `Stage ${activeStep + 1}`}</strong><span>{previewTrack.name} execution model</span></div>
        </div>
        <div className="fh-model-stages" role="group" aria-label={`${previewTrack.name} execution stages`}>
          {previewTrack.runtime.map((_, index) => <button key={`${previewTrack.id}-${index}`} type="button" aria-pressed={activeStep === index} aria-label={`Stage ${index + 1}: ${previewMeta.stages[index] || 'Execution'}`} onClick={() => setPreviewStep(index)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{previewMeta.stages[index] || `Stage ${index + 1}`}</strong></button>)}
        </div>
        <div className="fh-model-detail" role="status" aria-live="polite" aria-atomic="true"><span className="fh-model-step">{String(activeStep + 1).padStart(2, '0')}</span><p>{previewTrack.runtime[activeStep]}</p></div>
        <div className="fh-model-footer"><span>A conceptual walkthrough; code is not running.</span><a href={trackHref(previewTrack.id)} onClick={event => follow(event, trackHref(previewTrack.id))} aria-label={`Explore ${previewTrack.name} fundamentals`}><ArrowUpRight size={17} aria-hidden="true"/></a></div>
      </section>
    </header>

    <section className="fh-catalog" id="fh-catalog" aria-labelledby="fh-catalog-title">
      <div className="fh-section-heading">
        <div><span className="fh-eyebrow">BUILD FROM THE BASICS</span><h2 id="fh-catalog-title">Choose your next foundation<span>.</span></h2><p>Languages, frameworks, and the systems that bring them to life.</p></div>
        <div className="fh-overall-progress"><span><Check size={14} aria-hidden="true"/>{readyCount} ready</span><span>{reviseCount} to revise</span><small>Your self-ratings</small></div>
      </div>
      <div className="fh-toolbar">
        <div className="fh-filters" role="group" aria-label="Filter tracks by category">{categories.map(value => <button type="button" key={value} aria-pressed={category === value} onClick={() => setCategory(value)}>{value}<span className="fh-filter-count">{value === 'All' ? fundamentalTracks.length : fundamentalTracks.filter(track => presentation[track.id].category === value).length}</span></button>)}</div>
        <div className="fh-tools">
          <label className="fh-search"><Search size={16} aria-hidden="true"/><span className="fh-sr-only">Search fundamentals tracks</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Find a track…"/></label>
          <button type="button" className="fh-saved-toggle" aria-pressed={savedOnly} aria-label={`Show saved tracks (${favorites.length})`} title="Show saved tracks" onClick={() => setSavedOnly(value => !value)}><Bookmark size={16} aria-hidden="true"/><span>Saved{favorites.length > 0 ? ` ${favorites.length}` : ''}</span></button>
          <div className="fh-view-toggle" role="group" aria-label="Track display"><button type="button" aria-label="Grid view" aria-pressed={view === 'grid'} title="Grid view" onClick={() => setView('grid')}><Grid2X2 size={17} aria-hidden="true"/></button><button type="button" aria-label="List view" aria-pressed={view === 'list'} title="List view" onClick={() => setView('list')}><List size={17} aria-hidden="true"/></button></div>
        </div>
      </div>
      <div className="fh-results-bar"><p className="fh-result-count" role="status" aria-live="polite">Showing <strong>{visibleTracks.length}</strong> of {fundamentalTracks.length} tracks{savedOnly ? ' · Saved tracks' : ''}</p>{(category !== 'All' || search || savedOnly) && <button type="button" className="fh-clear" onClick={clearFilters}>Clear filters<X size={13} aria-hidden="true"/></button>}<span className="fh-results-note">Five interview angles per concept</span></div>
      <div className={view === 'grid' ? 'fh-track-grid' : 'fh-track-list'}>
        {visibleTracks.map(({track, ready, revise, total}) => {
          const meta = presentation[track.id];
          const saved = favorites.includes(track.id);
          const href = trackHref(track.id);
          return <article className="fh-track-card" data-track={track.id} key={track.id} aria-labelledby={`fh-track-${track.id}`}>
            <div className="fh-card-top"><span className="fh-track-icon" data-track={track.id} aria-hidden="true">{meta.initials}</span><button type="button" className="fh-bookmark" aria-label={`${saved ? 'Unsave' : 'Save'} ${track.name} track`} aria-pressed={saved} title={`${saved ? 'Unsave' : 'Save'} ${track.name}`} onClick={() => toggleFavorite(track.id)}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} aria-hidden="true"/></button></div>
            <div className="fh-card-copy"><span className="fh-kind">{track.kind}</span><h3 id={`fh-track-${track.id}`}>{track.name}</h3><p className="fh-summary">{meta.summary}</p></div>
            <div className="fh-card-counts"><span>{track.concepts.length} concepts</span><span aria-hidden="true">·</span><span>{total} questions</span></div>
            <div className="fh-card-progress"><progress value={ready} max={total} aria-label={`${track.name}: ${ready} of ${total} questions self-rated ready`}/><div className="fh-card-status"><span><strong>{ready}</strong> / {total} ready</span><span>{revise} to revise</span></div></div>
            <footer className="fh-card-footer"><a className="fh-track-link" href={href} onClick={event => follow(event, href)}>Explore {track.name}<ChevronRight size={16} aria-hidden="true"/></a></footer>
          </article>;
        })}
      </div>
      {visibleTracks.length === 0 && <div className="fh-empty"><Search size={28} aria-hidden="true"/><h3>{savedOnly && favorites.length === 0 ? 'Your saved tracks start here.' : 'No tracks match just yet.'}</h3><p>{savedOnly && favorites.length === 0 ? 'Use the bookmark on any track to keep it close for your next session.' : 'Try another technology name or clear a filter to explore the full library.'}</p><button type="button" className="fh-secondary" onClick={clearFilters}>Show all {fundamentalTracks.length} tracks<ArrowRight size={16} aria-hidden="true"/></button></div>}
      <p className="fh-catalog-note">Ready and revision counts reflect your self-assessments, separate from tested solutions or course completion.</p>
    </section>
  </div>;
}
