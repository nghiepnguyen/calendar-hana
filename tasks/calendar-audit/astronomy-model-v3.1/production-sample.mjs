import { SearchSunLongitude } from 'astronomy-engine'
import { createServer } from 'vite'
import { writeFileSync, readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { gzipSync } from 'node:zlib'
const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' })
try {
 const api = await server.ssrLoadModule('/shared/lunar/solarTerms.ts')
 const group = await server.ssrLoadModule('/shared/lunar/groupB.ts')
 const rows=[]; const timings=[]
 for(let year=1899;year<=2101;year++) {
  const start=performance.now(); const terms=api.solarTermsForYear(year);timings.push(performance.now()-start)
  rows.push(...terms.map(t=>{const root=SearchSunLongitude(t.longitude,new Date(Date.parse(t.instantUtc)-86400000),2);return {year,...t,rootTT:root.tt+2451545,rootUT:root.ut+2451545,deltaTSeconds:(root.tt-root.ut)*86400}}))
 }
 const golden=[]
 for(const id of ['month-breaker','robbery-sha','disaster-sha','month-sha','month-virtue']){
  const file=JSON.parse(readFileSync(`golden-v3/group-b/${id}.json`))
  for(const f of file.fixtures)golden.push({id:f.id,ruleId:id,fixtureClass:f.fixtureClass,instant:f.instant,actual:group.evaluateGroupBAtInstant(f.instant,f.timezone,f.identityContract?.inputLabels)})
 }
 const b=readFileSync('node_modules/astronomy-engine/astronomy.min.js')
 writeFileSync('tasks/calendar-audit/astronomy-model-v3.1/production-sample.json',JSON.stringify({rows,golden,benchmark:{node:process.version,annualSolveMs:timings,minifiedLibraryBytes:b.length,gzipLibraryBytes:gzipSync(b).length,memory:process.memoryUsage(),note:'Node SSR harness; memory includes Vite; not browser or incremental library memory; cache misses across sequential years'}},null,2))
 console.log(JSON.stringify({crossings:rows.length,fixtures:golden.length,minMs:Math.min(...timings),maxMs:Math.max(...timings)}))
}finally{await server.close()}
