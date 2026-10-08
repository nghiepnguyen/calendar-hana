import fs from 'node:fs';import {runAll,quick} from './candidates.mjs';
let results={classification:'NON_AUTHORITATIVE_ASTRONOMY_EVALUATION',nodeVersion:process.version,candidates:{}};
for(let key of ['AE','FULL_VSOP87','OPEN_HIGH_PRECISION']){let before=process.memoryUsage();let perf=quick(key);let all=runAll(key,1900,2100);let padding=[...runAll(key,1899,1899).rows,...runAll(key,2101,2101).rows];all.rows=[...all.rows,...padding];results.candidates[key]={...all,perf,memoryBefore:before,memoryAfter:process.memoryUsage()};console.log(key,all.rows.length,all.elapsedMs);}
fs.writeFileSync('tasks/calendar-audit/zero-cost-astronomy-v3.2A/node-results.json',JSON.stringify(results,null,2));
