export type ScenarioId = 'normal'|'double-click'|'competing'|'lost-response'|'offline'|'stale-cache'|'expired-session';
export type Lane = 'react'|'network'|'server'|'database'|'cache';
export type BookingOptions = {atomic:boolean;unique:boolean;idempotency:boolean};
export type RequestState = {id:string;customer:string;key:string;status:string;http:number|null;bookingId:number|null};
export type Table = {columns:string[];rows:(string|number|null)[][]};
export type BookingSnapshot = {
  ui:{status:string;message:string;bookingId:number|null};
  cache:string;requests:RequestState[];
  tables:{seats:Table;bookings:Table;request_keys:Table};
  counters:{sql:number;requests:number;commits:number;rollbacks:number};
};
export type BookingStep = {step:number;lane:Lane;title:string;detail:string;concept:string;requestId?:string;sql?:string;params?:unknown[];before:BookingSnapshot;after:BookingSnapshot};
export type BookingResult = {scenario:ScenarioId;options:BookingOptions;steps:BookingStep[];final:BookingSnapshot;checks:{name:string;passed:boolean;detail:string}[]};
export const defaultBookingOptions:BookingOptions={atomic:true,unique:true,idempotency:true};
