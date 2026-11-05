export type DojoTrack = 'GenAI' | 'Architecture' | 'Database' | 'API' | 'Algorithms' | 'LLD';
export type DojoLevel = 'Easy' | 'Medium' | 'Hard';

export type DojoChallenge = {
  id: string;
  track: DojoTrack;
  level: DojoLevel;
  title: string;
  brief: string;
  input: string;
  output: string;
  concept: string;
  components: string[];
  flow: string[];
  checks: string[];
  hint: string;
  solution: string;
  failure: string;
  tradeoff: string;
};
