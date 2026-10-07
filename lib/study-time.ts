export function formatStudyTime(minutes:number):string {
 const total=Number.isFinite(minutes)?Math.max(0,Math.round(minutes)):0;
 const hours=Math.floor(total/60),rest=total%60;
 return hours ? `${hours}h${rest?` ${rest}m`:''}` : `${rest}m`;
}
