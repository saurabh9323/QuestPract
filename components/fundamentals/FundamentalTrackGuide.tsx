'use client';

import {type MouseEvent} from 'react';
import {ArrowRight, ArrowUpRight, BookOpen, Download, GitBranch, LayoutGrid, RotateCcw, Search, SlidersHorizontal} from 'lucide-react';
import {conceptQuestions, fundamentalsMarkdown, trackQuestions} from '@/lib/fundamentals';
import {fundamentalProgress, fundamentalRecord} from '@/lib/fundamentals/progress';
import type {FundamentalConcept, FundamentalTrack} from '@/lib/fundamentals/types';
import {navigateWorkspace, routePage, updateRouteQuery} from '@/lib/workspace-location';
import {saveFile, useStudio} from '../studio/StudioContext';
import Pagination from '../Pagination';
import FundamentalQuestionCard from './FundamentalQuestionCard';
import RuntimeWalkthrough from './RuntimeWalkthrough';

const monograms: Record<string, string> = {
  javascript: 'JS', react: 'Re', vite: 'Vi', nextjs: 'N', cpp: 'C++', java: 'Jv',
  csharp: 'C#', dotnet: '.N', python: 'Py', flask: 'Fl', fastapi: 'Fa', django: 'Dj',
  express: 'Ex', nodejs: 'No', bun: 'Bn', sql: 'SQL', nosql: 'NS',
};
const sections = [
  {id: 'study', label: 'Study', Icon: BookOpen},
  {id: 'runtime', label: 'Execution model', Icon: GitBranch},
  {id: 'concepts', label: 'Concept map', Icon: LayoutGrid},
] as const;

function follow(event: MouseEvent<HTMLAnchorElement>, path: string) {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigateWorkspace(path);
}

function RatingDots({track, concept}: {track: FundamentalTrack; concept: FundamentalConcept}) {
  const {get} = useStudio();
  const fields = get(fundamentalRecord(track.id, concept.id)).fields;
  return <span className="ft-rating-dots">{conceptQuestions(track, concept).map(question => {
    const rating = fields[`rating_${question.lens}`];
    const label = `${question.lens}: ${rating === 'ready' ? 'Can explain' : rating === 'revise' ? 'Needs revision' : 'Not rated'}`;
    return <span key={question.lens} className={rating === 'ready' ? 'is-ready' : rating === 'revise' ? 'is-revise' : 'is-unrated'} role="img" aria-label={label} title={label}/>;
  })}</span>;
}

export default function FundamentalTrackGuide({track, url}: {track: FundamentalTrack; url: URL}) {
  const {p, get} = useStudio();
  const stats = fundamentalProgress(track, p.studio);
  const params = url.searchParams;
  const search = params.get('q') || '';
  const concept = params.get('concept') || '';
  const filter = params.get('filter') || 'all';
  const lens = params.get('lens') || 'all';
  const section = params.get('section') === 'runtime' ? 'runtime' : params.get('section') === 'concepts' ? 'concepts' : 'study';
  const allQuestions = trackQuestions(track);
  const questions = allQuestions.filter(question => {
    const item = track.concepts.find(item => item.id === question.conceptId)!;
    const rating = get(fundamentalRecord(track.id, item.id)).fields[`rating_${question.lens}`];
    return (!concept || item.id === concept)
      && (lens === 'all' || question.lens === lens)
      && (filter === 'all' || rating === filter)
      && `${question.question} ${question.answer} ${item.title} ${item.category}`.toLowerCase().includes(search.toLowerCase());
  });
  const pageSize = 5;
  const page = Math.min(routePage(params.get('page')), Math.max(1, Math.ceil(questions.length / pageSize)));
  const selectedConcept = track.concepts.find(item => item.id === concept);
  const filtered = Boolean(search || concept || filter !== 'all' || lens !== 'all');

  function choose(values: Record<string, string | null>) {
    updateRouteQuery({...values, page: null});
  }
  function chooseConcept(id: string | null) {
    choose({concept: id, filter: null, q: null, lens: null, section: null});
  }
  function resetFilters() {
    choose({q: null, concept: null, filter: null, lens: null});
  }
  function sectionUrl(id: string) {
    const next = new URL(url);
    if (id === 'study') next.searchParams.delete('section');
    else next.searchParams.set('section', id);
    return next.pathname + next.search;
  }

  return <div className="ft-guide" data-track={track.id}>
    <header className="ft-hero">
      <div className="ft-hero-main">
        <span className="ft-monogram" aria-hidden="true" data-track={track.id}>{monograms[track.id] || track.name.slice(0, 2)}</span>
        <div className="ft-hero-copy"><span className="eyebrow">{track.kind} · FUNDAMENTALS</span><h2>{track.name}, understood.</h2><p>{track.summary}</p><span className="ft-hero-equation">{track.concepts.length} concepts <span aria-hidden="true">×</span> 5 interview angles <span aria-hidden="true">=</span> {stats.total} questions</span></div>
        <div className="ft-hero-actions"><button className="secondary" onClick={() => saveFile(`${track.id}-fundamentals.md`, fundamentalsMarkdown(track))}><Download size={16} aria-hidden="true"/>Download study guide</button><button className="ft-text-button" onClick={() => choose({filter: 'revise', concept: null, q: null, lens: null, section: null})}><RotateCcw size={15} aria-hidden="true"/>Review my weak areas</button></div>
      </div>
      <div className="ft-progress-panel">
        <div className="ft-progress-heading"><span>Your self-assessment</span><strong>{stats.ready}<span> / {stats.total}</span></strong></div>
        <progress aria-label={`${track.name} self-rated readiness`} value={stats.ready} max={stats.total}/>
        <div className="ft-progress-stats"><div className="ft-progress-stat is-ready"><strong>{stats.ready}</strong><span>can explain</span></div><div className="ft-progress-stat is-revise"><strong>{stats.revise}</strong><span>need revision</span></div><div className="ft-progress-stat"><strong>{stats.attempted}</strong><span>written answers</span></div></div>
        <p className="ft-caption">Your ratings and drafts, not tested mastery or completed course days.</p>
      </div>
    </header>

    <nav className="ft-tabs" aria-label={`${track.name} guide sections`}>
      {sections.map(({id, label, Icon}) => <a key={id} href={sectionUrl(id)} onClick={event => follow(event, sectionUrl(id))} aria-current={section === id ? 'page' : undefined}><Icon size={17} aria-hidden="true"/>{label}<span>{id === 'study' ? stats.total : id === 'concepts' ? track.concepts.length : track.runtime.length}</span></a>)}
    </nav>

    {section === 'runtime' && <RuntimeWalkthrough key={track.id} track={track}/>}

    {section === 'concepts' && <section className="ft-concept-map" aria-labelledby={`concept-map-${track.id}`}>
      <div className="ft-section-heading"><div><span className="eyebrow">THE BIG PICTURE</span><h2 id={`concept-map-${track.id}`}>One concept. Five ways to know it.</h2><p>Explain, Apply, Demonstrate, Trace, Diagnose. Each dot shows your rating for one angle.</p></div></div>
      <div className="ft-rating-legend" aria-label="Rating colors"><span><i className="is-ready" aria-hidden="true"/>Can explain</span><span><i className="is-revise" aria-hidden="true"/>Needs revision</span><span><i className="is-unrated" aria-hidden="true"/>Not rated</span></div>
      <div className="ft-concept-grid">{track.concepts.map((item, index) => {
        const fields = get(fundamentalRecord(track.id, item.id)).fields;
        const ready = conceptQuestions(track, item).filter(question => fields[`rating_${question.lens}`] === 'ready').length;
        return <button className="ft-concept-tile" key={item.id} onClick={() => chooseConcept(item.id)}>
          <span className="ft-concept-meta"><span>{String(index + 1).padStart(2, '0')}</span><span>{item.category}</span></span>
          <strong>{item.title}</strong><span className="ft-concept-description">{item.definition}</span>
          <span className="ft-concept-footer"><RatingDots track={track} concept={item}/><span>{ready}/5 can explain</span><ArrowUpRight size={17} aria-hidden="true"/></span>
        </button>;
      })}</div>
    </section>}

    {section === 'study' && <div className="ft-study-layout">
      <aside className="ft-concept-sidebar" aria-label="Choose a core concept">
        <div className="ft-sidebar-heading"><span className="eyebrow">CORE CONCEPTS</span><span>{track.concepts.length}</span></div>
        <button className="ft-all-concepts" aria-pressed={!concept} onClick={() => chooseConcept(null)}><LayoutGrid size={15} aria-hidden="true"/>All concepts<span>{stats.total}</span></button>
        <div className="ft-concept-index">{track.concepts.map((item, index) => <button key={item.id} className="ft-concept-link" aria-pressed={concept === item.id} onClick={() => chooseConcept(item.id)}><span className="ft-concept-index-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{item.title}</strong><RatingDots track={track} concept={item}/></span></button>)}</div>
        <p className="ft-caption">Five dots per concept. Your ratings fill in as you practise.</p>
      </aside>

      <section className="ft-study-content" aria-labelledby={`study-${track.id}`}>
        <div className="ft-section-heading"><div><span className="eyebrow">BUILD YOUR INTERVIEW BASE</span><h2 id={`study-${track.id}`}>{selectedConcept ? selectedConcept.title : 'Understand it. Then explain it.'}</h2><p>Start with Explain, then work towards tracing execution and diagnosing mistakes.</p></div></div>
        <div className="ft-filter-bar">
          <label className="ft-search">Search this track<span><Search size={17} aria-hidden="true"/><input type="search" value={search} placeholder="Search concepts or questions…" onChange={event => updateRouteQuery({q: event.target.value, page: null}, true)}/></span></label>
          <div className="ft-filter-selects">
            <label>Concept<select value={concept} onChange={event => choose({concept: event.target.value || null})}><option value="">All {track.concepts.length} concepts</option>{track.concepts.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
            <label>Interview angle<select value={lens} onChange={event => choose({lens: event.target.value})}>{['all', 'Explain', 'Apply', 'Demonstrate', 'Trace', 'Diagnose'].map(value => <option key={value} value={value}>{value === 'all' ? 'All five angles' : value}</option>)}</select></label>
            <label>Revision status<select value={filter} onChange={event => choose({filter: event.target.value})}><option value="all">All questions</option><option value="revise">Needs revision</option><option value="ready">Can explain</option></select></label>
            <button className="ft-text-button" onClick={resetFilters}><SlidersHorizontal size={15} aria-hidden="true"/>Reset filters</button>
          </div>
        </div>
        <div className="ft-answer-frame"><span className="ft-answer-time">60<span>seconds</span></span><div><strong>A simple frame for a clear answer</strong><span>Define it <ArrowRight size={13} aria-hidden="true"/> Explain why <ArrowRight size={13} aria-hidden="true"/> Give an example <ArrowRight size={13} aria-hidden="true"/> Mention a trade-off</span></div></div>
        <div className="ft-results-heading"><strong>{questions.length} {questions.length === 1 ? 'question' : 'questions'}{filtered ? ' matching your filters' : ' to work through'}</strong><span>Page {page} of {Math.max(1, Math.ceil(questions.length / pageSize))}</span></div>
        {!questions.length && <div className="card ft-empty"><Search size={28} aria-hidden="true"/><h3>No questions match these filters.</h3><p>Try a broader search or reset your filters. Mark an answer “Needs revision” to build your review list.</p><button className="secondary" onClick={resetFilters}>Show all questions</button></div>}
        <div className="ft-question-list">{questions.slice((page - 1) * pageSize, page * pageSize).map(question => <FundamentalQuestionCard key={question.id} track={track} q={question} concept={track.concepts.find(item => item.id === question.conceptId)!} number={allQuestions.findIndex(item => item.id === question.id) + 1}/>)}</div>
        <Pagination page={page} pageSize={pageSize} total={questions.length} label={`${track.name} fundamentals`} onChange={next => { updateRouteQuery({page: next}); document.getElementById(`study-${track.id}`)?.scrollIntoView({block: 'start', behavior: 'auto'}); }}/>
      </section>
    </div>}

    <footer className="ft-sources"><div><BookOpen size={20} aria-hidden="true"/><div><h3>Go deeper at the source.</h3><p>Check the version used by your project before relying on a framework default.</p></div></div><ul>{track.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}<ArrowUpRight size={14} aria-hidden="true"/></a></li>)}</ul></footer>
  </div>;
}
