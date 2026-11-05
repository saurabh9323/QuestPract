import {genaiCases} from './dojo-cases/genai';
import {architectureCases} from './dojo-cases/architecture';
import {databaseCases} from './dojo-cases/database';
import {apiCases} from './dojo-cases/api';
import {algorithmCases} from './dojo-cases/algorithms';
import {lldCases} from './dojo-cases/lld';
import type {DojoChallenge} from './dojo-cases/types';

export type {DojoChallenge, DojoTrack, DojoLevel} from './dojo-cases/types';

// Challenge IDs and each existing checklist order are persisted in learner progress.
export const dojoChallenges: DojoChallenge[] = [
  ...genaiCases,
  ...architectureCases,
  ...databaseCases,
  ...apiCases,
  ...algorithmCases,
  ...lldCases,
];
