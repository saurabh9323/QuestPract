import type { Metadata } from 'next';
import './globals.css';
import './workspace.css';
import './lab.css';
import './planner.css';
import './course.css';
import './oop.css';
import './theme.css';
import './visual.css';
import './study.css';
export const metadata: Metadata = { title: 'Quest90 — Your developer comeback', description: '90 days of practical full-stack quests, DSA, system design and interview practice.', icons: {icon:'/favicon.svg'} };
export default function RootLayout({children}: Readonly<{children:React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
