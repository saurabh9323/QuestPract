export type FundamentalConcept = {
  id: string;
  title: string;
  category: 'Core' | 'Execution' | 'Data' | 'Concurrency' | 'Design' | 'Reliability';
  definition: string;
  why: string;
  example: string;
  code: string;
  output: string;
  execution: string;
  pitfall: string;
  exercise: string;
};
export type FundamentalTrack = {
  id: string;
  name: string;
  kind: 'Language' | 'UI library' | 'Framework' | 'Runtime' | 'Build tool' | 'Data systems';
  summary: string;
  runtime: string[];
  threading: string;
  concepts: FundamentalConcept[];
  sources: {label: string; url: string}[];
};
export type FundamentalQuestion = {
  id: string;
  conceptId: string;
  lens: 'Explain' | 'Apply' | 'Demonstrate' | 'Trace' | 'Diagnose';
  question: string;
  answer: string;
};
