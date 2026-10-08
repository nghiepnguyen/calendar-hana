/* Phase 3B.4.3 independent port review: UNMODIFIED upstream ERFA 2.0.1 C.
 *
 * This harness only composes upstream library calls. It deliberately uses a
 * DIFFERENT composition route from the TypeScript port where ERFA offers one:
 *   - eraApcs supplies Sun-Earth distance, velocity in c and 1/Lorentz factor;
 *   - eraFw2m builds the full NPB matrix to the TRUE EQUATOR of date, then
 *     eraRx(eps + deps) rotates to the true ecliptic (TS rotates directly);
 *   - roots use plain integer bisection on its own bracket (TS uses Illinois).
 *
 * stdin commands (one per line):
 *   E <ttMs>                      intermediates at integer TT ms since J2000
 *                                 (days = ttMs / 86400000.0, exactly as the TS port)
 *   R <year> <termIndex>          canonical integer-ms root by bisection
 *   V <ttMs>                      residual sign data at integer ms
 * All numbers printed with %.17g (round-trip exact).
 */
#include <stdio.h>
#include <math.h>
#include <string.h>
#include "erfa.h"
#include "erfam.h"

static double apparent_longitude(double d, double out[32])
{
   double pvh[2][3], pvb[2][3], sh[2][3], sb[2][3], z[2][3] = {{0}};
   double e2s[3], r, pnat[3], ppr[3], gamb, phib, psib, epsa, dp, de;
   double rnpb[3][3], req[3], recl[3], r1[3][3];
   eraASTROM astrom;
   int i, st1, st2;

   st1 = eraEpv00(ERFA_DJ00, d, pvh, pvb);
   eraApcs(ERFA_DJ00, d, z, pvb, pvh[0], &astrom);
   st2 = eraEpv00(ERFA_DJ00, d - astrom.em / ERFA_DC, sh, sb);
   for (i = 0; i < 3; i++) e2s[i] = (sb[0][i] - sh[0][i]) - pvb[0][i];
   eraPn(e2s, &r, pnat);
   eraAb(pnat, astrom.v, astrom.em, astrom.bm1, ppr);
   eraPfw06(ERFA_DJ00, d, &gamb, &phib, &psib, &epsa);
   eraNut00b(ERFA_DJ00, d, &dp, &de);
   eraFw2m(gamb, phib, psib + dp, epsa + de, rnpb);
   eraRxp(rnpb, ppr, req);
   eraIr(r1);
   eraRx(epsa + de, r1);
   eraRxp(r1, req, recl);
   double lon = atan2(recl[1], recl[0]) * ERFA_DR2D;
   if (lon < 0) lon += 360.0;
   if (lon >= 360.0) lon -= 360.0;
   if (out) {
      for (i = 0; i < 3; i++) {
         out[i] = pvh[0][i]; out[3 + i] = pvh[1][i];
         out[6 + i] = pvb[0][i]; out[9 + i] = pvb[1][i];
      }
      out[12] = dp; out[13] = de; out[14] = gamb; out[15] = phib; out[16] = psib;
      out[17] = epsa; out[18] = lon; out[19] = astrom.em; out[20] = astrom.bm1;
      out[21] = astrom.v[0]; out[22] = astrom.v[1]; out[23] = astrom.v[2];
      out[24] = (double)(st1 | st2);
      out[25] = atan2(recl[2], sqrt(recl[0]*recl[0] + recl[1]*recl[1])) * ERFA_DR2D;
   }
   return lon;
}

static double residual(long long ms, double target)
{
   double r = apparent_longitude((double)ms / 86400000.0, NULL) - target;
   if (r >= 180.0) r -= 360.0; else if (r < -180.0) r += 360.0;
   return r;
}

/* Days from 1970-01-01 to y-m-d (proleptic Gregorian), Howard Hinnant's algorithm. */
static long long days_from_civil(long long y, unsigned m, unsigned d)
{
   y -= m <= 2;
   const long long era = (y >= 0 ? y : y - 399) / 400;
   const unsigned yoe = (unsigned)(y - era * 400);
   const unsigned doy = (153 * (m + (m > 2 ? -3 : 9)) + 2) / 5 + d - 1;
   const unsigned doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
   return era * 146097 + (long long)doe - 719468;
}

int main(void)
{
   char cmd[8];
   setvbuf(stdout, NULL, _IOFBF, 1 << 20);
   while (scanf("%7s", cmd) == 1) {
      if (!strcmp(cmd, "E")) {
         long long ms;
         double o[32];
         if (scanf("%lld", &ms) != 1) return 2;
         double d = (double)ms / 86400000.0;
         apparent_longitude(d, o);
         printf("E %.17g", d);
         for (int i = 0; i < 26; i++) printf(" %.17g", o[i]);
         printf("\n");
      } else if (!strcmp(cmd, "R")) {
         int year, term;
         if (scanf("%d %d", &year, &term) != 2) return 2;
         double target = term * 15.0;
         /* Own bracket: TT Jan 1 + 4 days + mean motion from 285 deg, +-12 days. */
         long long jan1 = (days_from_civil(year, 1, 1) - 10957) * 86400000LL - 43200000LL;
         double off = 4.0 + fmod(target - 285.0 + 360.0, 360.0) / 360.0 * 365.2422;
         long long mid = jan1 + (long long)floor(off * 86400000.0);
         long long lo = mid - 12LL * 86400000LL, hi = mid + 12LL * 86400000LL;
         if (!(residual(lo, target) < 0 && residual(hi, target) >= 0)) {
            printf("R %d %d UNBRACKETED\n", year, term);
            continue;
         }
         int it = 0;
         while (hi - lo > 1) {
            long long m = lo + (hi - lo) / 2;
            if (residual(m, target) >= 0) hi = m; else lo = m;
            it++;
         }
         printf("R %d %d %lld %d %.17g %.17g\n", year, term, hi, it,
                residual(hi - 1, target), residual(hi, target));
      } else if (!strcmp(cmd, "V")) {
         long long ms;
         double target;
         if (scanf("%lld %lf", &ms, &target) != 2) return 2;
         printf("V %lld %.17g\n", ms, residual(ms, target));
      } else return 3;
   }
   return 0;
}
