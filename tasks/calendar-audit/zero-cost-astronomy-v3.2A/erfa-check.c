/* NON_AUTHORITATIVE_ASTRONOMY_EVALUATION. Research comparison against upstream ERFA. */
#include <stdio.h>
#include <math.h>
#include "erfa.h"
#include "erfam.h"
int main(void){double jd;while(scanf("%lf",&jd)==1){double h[2][3],b[2][3],sh[2][3],sb[2][3],v[3],p[3],a[3],e[3],r[3][3],dp,de,g,phi,psi,eps,distance=0;eraEpv00(2451545,jd-2451545,h,b);for(int i=0;i<3;i++)distance+=h[0][i]*h[0][i];distance=sqrt(distance);eraEpv00(2451545,jd-2451545-distance/ERFA_DC,sh,sb);double norm=0,v2=0;for(int i=0;i<3;i++){p[i]=sb[0][i]-sh[0][i]-b[0][i];norm+=p[i]*p[i];v[i]=b[1][i]/ERFA_DC;v2+=v[i]*v[i];}norm=sqrt(norm);for(int i=0;i<3;i++)p[i]/=norm;eraAb(p,v,distance,sqrt(1-v2),a);eraPfw06(2451545,jd-2451545,&g,&phi,&psi,&eps);eraNut00b(2451545,jd-2451545,&dp,&de);eraFw2m(g,phi,psi+dp,eps+de,r);eraRxp(r,a,e);double y=cos(eps+de)*e[1]+sin(eps+de)*e[2];double lon=atan2(y,e[0])*180/ERFA_DPI;if(lon<0)lon+=360;printf("%.17g %.17g %.17g %.17g %.17g %.17g\n",jd,lon,h[0][0],h[0][1],h[0][2],dp);}}
