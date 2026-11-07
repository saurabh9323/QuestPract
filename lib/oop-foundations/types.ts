export type FoundationCategory = 'Object basics' | 'Types & contracts' | 'Reliable APIs';
export type FoundationFrame = {
  title: string;
  explanation: string;
  active: number;
  nodes: { label: string; value: string; icon: string }[];
  variables: { name: string; before: string; after: string }[];
  line?: number;
};
export type FoundationLesson = {
  id: string;
  title: string;
  category: FoundationCategory;
  definition: string;
  why: string;
  when: string;
  analogy: { story: string; limit: string };
  code: { language: string; source: string; expected: string };
  takeaway: string;
  pitfall: string;
  interviewAnswer: string;
  steps: FoundationFrame[];
  question: { prompt: string; options: { id: string; label: string; correct: boolean; feedback: string }[] };
  sources: { label: string; url: string }[];
};
