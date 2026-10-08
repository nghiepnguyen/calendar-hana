// NON_AUTHORITATIVE_ASTRONOMY_EVALUATION; no production imports.
import * as AE from 'astronomy-engine';
import earthData from '/tmp/zero342a-astronomia/package/data/vsop87Dearth.js';
import {Planet} from '/tmp/zero342a-astronomia/package/src/planetposition.js';
import {apparentVSOP87} from '/tmp/zero342a-astronomia/package/src/solar.js';
import {longitude as erfaLongitude} from './erfa-solar.mjs';
const earth=new Planet(earthData);
export const identities={AE:'astronomy-engine@2.1.19 / current SearchSunLongitude',FULL_VSOP87:'astronomia@4.2.0 / full VSOP87D Earth + Meeus apparentVSOP87',OPEN_HIGH_PRECISION:'hana-erfa-solar-eval@0.1.0 / ERFA2.0.1 EPV00 + IAU2006/2000B + relativistic aberration'};
const targets=Array.from({length:24},(_,i)=>(19+i)%24*15);
export const ttLongitude={FULL_VSOP87:jd=>apparentVSOP87(earth,jd).lon*180/Math.PI,OPEN_HIGH_PRECISION:erfaLongitude};
const residual=(v,a)=>((v-a+540)%360)-180;
// Integer TT-millisecond grid since J2000; first millisecond reaching target.
export function solveTT(fn,year,angle){let jan=(Date.UTC(year,0,1)/86400000+2440587.5-2451545)*86400000;let approx=jan+(5+((angle-285+360)%360)/360*365.2422)*86400000;let lo=Math.floor(approx-10*86400000),hi=Math.ceil(approx+10*86400000);let value=n=>residual(fn(2451545+n/86400000),angle);if(!(value(lo)<0&&value(hi)>=0))throw Error('Unbracketed TT root');while(hi-lo>1){let mid=Math.floor((lo+hi)/2);if(value(mid)>=0)hi=mid;else lo=mid;}return {tt:2451545+hi/86400000,ttOffsetMs:hi};}
export function yearRoots(key,year){if(key==='AE'){let start=new Date(Date.UTC(year,0,1));return targets.map(longitude=>{let t=AE.SearchSunLongitude(longitude,start,20);if(!t)throw Error('AE root missing');start=new Date(t.date.getTime()+1000);return {year,longitude,tt:t.tt+2451545,ownEpochMs:t.date.getTime(),ownInstantUtc:t.date.toISOString()};});}let fn=ttLongitude[key];return targets.map(longitude=>({year,longitude,...solveTT(fn,year,longitude)}));}
export function runAll(key,from=1900,to=2100){let start=performance.now();let rows=[];for(let year=from;year<=to;year++)rows.push(...yearRoots(key,year));return {identity:identities[key],elapsedMs:performance.now()-start,rows};}
// Research clock-v1: pre1972 Espenak/Meeus UT1 projection; >=1972 leap history;
// after last known leap freeze TAI-UTC37. Projected axis, not known future UTC.
const leapRows=[[1972,1,10],[1972,7,11],[1973,1,12],[1974,1,13],[1975,1,14],[1976,1,15],[1977,1,16],[1978,1,17],[1979,1,18],[1980,1,19],[1981,7,20],[1982,7,21],[1983,7,22],[1985,7,23],[1988,1,24],[1990,1,25],[1991,1,26],[1992,7,27],[1993,7,28],[1994,7,29],[1996,1,30],[1997,7,31],[1999,1,32],[2006,1,33],[2009,1,34],[2012,7,35],[2015,7,36],[2017,1,37]];
const leaps=leapRows.map(([y,m,n])=>({ut:Date.UTC(y,m-1,1)/86400000+2440587.5,n}));
export function clockTT(tt){if(tt<leaps[0].ut+42.184/86400){let ut=tt;for(let i=0;i<5;i++)ut=tt-AE.DeltaT_EspenakMeeus(ut-2451545)/86400;return {epochMs:Math.ceil((ut-2440587.5)*86400000),scale:'PRE1972_PROJECTED_UT1_ESPENAK_MEEUS'};}let tai=10;for(let x of leaps)if(tt>=x.ut+(x.n+32.184)/86400)tai=x.n;return {epochMs:Math.ceil((tt-2440587.5)*86400000-(tai+32.184)*1000),scale:tt>=leaps.at(-1).ut+69.184/86400?'POST2017_FROZEN_TAI_UTC37_PROJECTION':'KNOWN_LEAP_HISTORY_UTC'};}
export function quick(key){let start=performance.now(),first=yearRoots(key,2024),annual=performance.now()-start;start=performance.now();yearRoots(key,2024);return {annual24Ms:annual,warmAnnual24Ms:performance.now()-start,first:first[0]};}
