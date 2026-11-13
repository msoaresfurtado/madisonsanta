(function(root){
'use strict';
const CURRENT_SEASON=2026, BASELINE=115;
function seasonOf(timestamp){
 const m=String(timestamp||'').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
 const iso=String(timestamp||'').match(/^(\d{4})-(\d{2})-(\d{2})/);
 if(!m&&!iso)return null;
 const y=Number(m?m[3]:iso[1]),month=Number(m?m[1]:iso[2]);
 if(month<1||month>12)return null;
 return month===1?y-1:y;
}
function normalize(rows){
 const seen=new Set(),items=[];let pending=0;
 for(const raw of rows){
  const row=Object.fromEntries(Object.entries(raw).map(([k,v])=>[k.trim(),String(v??'').trim()]));
  const season=seasonOf(row.Timestamp); if(![2025,2026].includes(season))continue;
  const answer=(row['What did you spot?']||'').toLowerCase();
  const type=answer.includes('snowman')?'snowman':(!answer||answer.includes('santa')?'santa':null);
  if(!type)continue;
  const lat=Number(row.Latitude),lng=Number(row.Longitude);
  if(!row.Latitude||!row.Longitude||!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180){if(season===CURRENT_SEASON)pending++;continue;}
  const key=[season,type,lat.toFixed(6),lng.toFixed(6)].join('|');
  if(seen.has(key))continue; seen.add(key);
  items.push({season,type,lat,lng,address:row.Address||row['Column 1']||'Reported display',name:row['Your name']||'Anonymous spotter',timestamp:row.Timestamp});
 }
 return {items,pending};
}
function compare(n){
 if(n>BASELINE)return {title:`${n-BASELINE} more Santas than last year!`,copy:`${n} reported this season · ${Math.round((n-BASELINE)/BASELINE*100)}% above 2025's final count.`};
 if(n===BASELINE)return {title:"We've matched last year's 115!",copy:'One more unique Santa location will set a new community record.'};
 return {title:`${BASELINE+1-n} more to set a new record`,copy:`${n} of last year's 115 reported so far. The season is still underway.`};
}
const api={normalize,seasonOf,compare,CURRENT_SEASON,BASELINE};
if(typeof module!=='undefined')module.exports=api;else root.Sightings=api;
})(typeof globalThis!=='undefined'?globalThis:this);
