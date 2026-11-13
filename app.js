'use strict';
const FEED='https://docs.google.com/spreadsheets/d/e/2PACX-1vRdG78w6csiqzQtWUCGQGTCCaOSB_WDrVk2yGeITPcoXWi98jtQZmcU6WcIU_cQ5uxA0xCEcgUwdY5i/pub?output=csv';
const $=id=>document.getElementById(id);
let allSightings=[],map,markerLayer,filter='all',feedAvailable=false;
function setupMap(){
 if(!window.L){$('map').textContent='The map could not load. You can still browse the sightings list below or add a sighting.';return;}
 map=L.map('map',{scrollWheelZoom:false}).setView([43.0625,-89.418],11);
 markerLayer=L.layerGroup().addTo(map);
 const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',className:'vintage-tiles'}).addTo(map);
 let errors=0;
 tiles.on('tileerror',()=>{if(++errors>=2){$('tile-status').hidden=false;$('tile-status').textContent='Some map tiles could not load. The sightings list below is still available.';}});
 tiles.on('tileload',()=>{errors=0;$('tile-status').hidden=true;});
}
function showMarkers(){
 const season=2026;
 const data=allSightings.filter(s=>s.season===season&&(filter==='all'||s.type===filter));
 if(markerLayer)markerLayer.clearLayers();
 const list=document.createElement('ul');
 for(const s of data){
  const emoji=s.type==='santa'?'🎅':'⛄';
  const title=s.type==='santa'?'Giant inflatable Santa':'Giant inflatable snowman';
  const directions=`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`;
  if(map){
   const box=document.createElement('div');
   const heading=document.createElement('strong');heading.textContent=`${emoji} ${title}`;
   const address=document.createElement('p');address.textContent=s.address;
   const name=document.createElement('p');name.textContent=`Spotted by ${s.name} · ${s.season}`;
   const link=document.createElement('a');link.href=directions;link.target='_blank';link.rel='noopener';link.textContent='Get directions ↗';
   box.append(heading,address,name,link);
   L.marker([s.lat,s.lng],{title:`${title}: ${s.address}`,icon:L.divIcon({className:`sighting-marker ${s.type}`,html:emoji,iconSize:[36,42],iconAnchor:[18,36]})}).bindPopup(box).addTo(markerLayer);
  }
  const li=document.createElement('li'),link=document.createElement('a');link.href=directions;link.target='_blank';link.rel='noopener';link.textContent=`${emoji} ${s.address}`;li.append(link);list.append(li);
 }
 $('sightings-list').replaceChildren(list);
 const unavailable=season===2026&&!feedAvailable;
 $('map-count').textContent=unavailable?'Current season unavailable':`${data.length} ${data.length===1?'display':'displays'} · ${season}${season===2025?' archive':''}`;
 if(data.length===0){const p=document.createElement('p');p.textContent=unavailable?'The current feed is unavailable. Please try Refresh sightings.':season===2025?'No snowmen were tracked in the 2025 archive.':'No matching sightings yet. Be the first to add one!';$('sightings-list').append(p);}
}
async function fetchWithTimeout(url,timeout=16000){const c=new AbortController(),id=setTimeout(()=>c.abort(),timeout);try{const r=await fetch(url,{signal:c.signal});if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.text();}finally{clearTimeout(id);}}
async function loadSightings(){
 $('refresh').disabled=true;$('feed-status').textContent='Loading the latest sightings…';
 try{
  if(!window.Papa)throw new Error('CSV parser unavailable');
  const text=await fetchWithTimeout(FEED);const parsed=Papa.parse(text,{header:true,skipEmptyLines:true});
  if(!parsed.meta.fields?.includes('Timestamp')||!parsed.meta.fields?.includes('Latitude')||!parsed.meta.fields?.includes('Longitude'))throw new Error('Unexpected feed format');
  const result=Sightings.normalize(parsed.data);feedAvailable=true;
  // Only fresh reports for this season appear on the map.
  allSightings=result.items.filter(s=>s.season===2026);
  const current=allSightings.filter(s=>s.season===2026),santas=current.filter(s=>s.type==='santa').length,snowmen=current.filter(s=>s.type==='snowman').length;
  $('santa-count').textContent=santas;$('snowman-count').textContent=snowmen;
  const comparison=Sightings.compare(santas);$('comparison-title').textContent=comparison.title;$('comparison-copy').textContent=comparison.copy;$('season-progress').value=Math.min(santas,115);
  $('feed-status').textContent=`Updated ${new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',hour:'numeric',minute:'2-digit'}).format(new Date())} Central. ${result.pending?`${result.pending} new report(s) awaiting a mapped location. `:''}${current.length?'Choose a type to explore.':'2026 is open! No sightings yet—add the first giant Santa or snowman.'}`;
  $('trend-copy').textContent=santas>115?`The community has now reported ${santas} Santa locations in 2026, exceeding last year's 115. That's growth in reported sightings; more participation can contribute, too.`:"Will this season beat 115 Santas? We're counting together. An early-season total is still growing, so fewer sightings today does not mean fewer Santas this winter.";
 }catch(e){
  console.warn('Sightings feed unavailable:',e.message);
  if(!feedAvailable){allSightings=[];$('santa-count').textContent='—';$('snowman-count').textContent='—';$('comparison-copy').textContent='Current sightings unavailable. Last year’s final count was 115.';}
  $('feed-status').textContent=feedAvailable?'Refresh failed; showing the last successful counts from this visit. Try again shortly.':'The live feed could not load. The submission form is still available. Try Refresh sightings.';
 }finally{$('refresh').disabled=false;showMarkers();}
}
function setupMotion(){
 for(let i=0;i<16;i++){const snow=document.createElement('img');snow.src='watercolor-snowflake.png';snow.alt='';snow.className='snowflake';snow.style.left=`${(i*6.3+2)%100}%`;snow.style.width=`${18+i%4*7}px`;snow.style.animationDuration=`${18+i%7*3}s`;snow.style.animationDelay=`-${i*2.7}s`;$('snowfall').append(snow);}
}
function setupMusic(){
 const audio=$('holiday-audio'),button=$('music-toggle'),status=$('music-status');
 audio.volume=.20;
 button.addEventListener('click',async()=>{if(!audio.paused){audio.pause();return;}try{await audio.play();}catch(e){status.textContent='Tap the audio player to start the music.';}});
 audio.addEventListener('playing',()=>{button.textContent='Ⅱ Pause music';button.setAttribute('aria-pressed','true');status.textContent='Playing softly in the background. Adjust the volume or pause any time.';});
 audio.addEventListener('pause',()=>{button.textContent='♪ Play holiday music';button.setAttribute('aria-pressed','false');status.textContent='Music paused.';});
 audio.addEventListener('error',()=>{status.textContent='The music could not load. Please try refreshing the page.';});
 $('volume').addEventListener('input',()=>{audio.volume=Number($('volume').value)/100;});
 audio.addEventListener('volumechange',()=>{$('volume').value=Math.round(audio.volume*100);});
 let waitingForGesture=true;
 const tryStart=()=>{if(!waitingForGesture)return;audio.play().then(()=>{waitingForGesture=false;}).catch(()=>{});};
 audio.addEventListener('playing',()=>{waitingForGesture=false;});
 document.addEventListener('pointerdown',event=>{if(!event.target.closest('.music-section'))tryStart();});
 document.addEventListener('keydown',event=>{if(!event.target.closest('.music-section'))tryStart();});
 tryStart();
}
async function start(){
 setupMap();setupMotion();setupMusic();
 $('refresh').addEventListener('click',loadSightings);
 document.querySelectorAll('.filter').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.type;document.querySelectorAll('.filter').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});showMarkers();}));
 await loadSightings();
}
start();
