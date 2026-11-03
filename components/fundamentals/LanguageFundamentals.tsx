'use client';

import type {MouseEvent} from 'react';
import {ArrowUpRight, BookOpen, Network} from 'lucide-react';
import {fundamentalTracks} from '@/lib/fundamentals';
import {navigateWorkspace, useWorkspaceLocation} from '@/lib/workspace-location';
import FundamentalsHub from './FundamentalsHub';
import FundamentalTrackGuide from './FundamentalTrackGuide';
import CommonFoundations from './CommonFoundations';

function follow(event: MouseEvent<HTMLAnchorElement>, path: string) {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigateWorkspace(path);
  window.scrollTo({top: 0, behavior: 'auto'});
}

export default function LanguageFundamentals() {
  const location = useWorkspaceLocation();
  const url = new URL(location, 'https://quest90.local');
  const slug = url.pathname.split('/').filter(Boolean)[1];
  const track = fundamentalTracks.find(item => item.id === slug);
  const common = !track && url.searchParams.get('view') === 'common';

  return <section className="language-fundamentals">
    <nav className="fundamentals-nav" aria-label="Fundamentals navigation">
      <a href="/fundamentals/" onClick={event => follow(event, '/fundamentals/')} aria-current={!track && !common ? 'page' : undefined}><BookOpen size={16}/> Track library</a>
      <a href="/fundamentals/?view=common" onClick={event => follow(event, '/fundamentals/?view=common')} aria-current={common ? 'page' : undefined}><Network size={16}/> Connect the concepts</a>
      <a href="/interview-materials/frontend-3plus/" onClick={event => follow(event, '/interview-materials/frontend-3plus/')} className="fundamentals-nav-practice">Frontend scenario round <ArrowUpRight size={15}/></a>
    </nav>
    {track ? <FundamentalTrackGuide key={track.id} track={track} url={url}/> : common ? <CommonFoundations/> : <FundamentalsHub/>}
  </section>;
}
