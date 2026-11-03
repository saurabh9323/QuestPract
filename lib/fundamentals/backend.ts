import {flask} from './tracks/flask';
import {fastapi} from './tracks/fastapi';
import {django} from './tracks/django';
import {express} from './tracks/express';
import {sql} from './tracks/sql';
import {nosql} from './tracks/nosql';
import type {FundamentalTrack} from './types';
export const backendTracks:FundamentalTrack[]=[flask, fastapi, django, express, sql, nosql];
