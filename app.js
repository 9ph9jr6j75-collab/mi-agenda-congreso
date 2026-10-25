'use strict';
const $=s=>document.querySelector(s);
const icons={calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2"/>',star:'<path d="m12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3L3 9.6l6.2-.9Z"/>',molecule:'<circle cx="12" cy="12" r="3"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="m7 7 3 3m4 4 3 3m-7-3-3 3m7-7 3-3"/>',more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',file:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6M8 13h8m-8 4h6"/>',phone:'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/>',pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5"/>'};
const icon=n=>`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[n]||icons.calendar}</svg>`;
document.querySelectorAll('[data-icon]').forEach(e=>e.innerHTML=icon(e.dataset.icon));
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const norm=v=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const DAYS=[['2026-10-26','Lun','Lunes'],['2026-10-27','Mar','Martes'],['2026-10-28','Mié','Miércoles'],['2026-10-29','Jue','Jueves'],['2026-10-30','Vie','Viernes']];
const TOPICS=[['','Todos'],['glp','GLP-1 y obesidad'],['urgencias','Urgencias'],['pocus','POCUS'],['diabetes','Diabetes'],['gestion','Gestión e IA']];
const KEY='cmn2026-favorites-v1';
let stored=[];try{stored=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(stored))stored=[];}catch{}
const state={view:['agenda','topics','glp','favorites','more'].includes(location.hash.slice(1))?location.hash.slice(1):'agenda',day:'2026-10-26',query:'',room:'',period:'',kind:'',topic:'',track:'',allDays:false,favorites:new Set(stored),data:[],loaded:false};
const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Costa_Rica'}).format(new Date());if(DAYS.some(d=>d[0]===today))state.day=today;
let toastTimer,dialogTrigger,guideTrigger,installEvent;
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,3200);}
function fmtTime(value){let [h,m]=value.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h<12?'a. m.':'p. m.'}`;}
const range=t=>`${fmtTime(t.start)} a ${fmtTime(t.end)}`;
function dateName(date){const day=DAYS.find(d=>d[0]===date);return `${day?.[2]||''} ${Number(date.slice(-2))} de octubre`;}
function sameBlock(a,b){return a.grouped&&b.grouped&&a.room===b.room&&a.track===b.track&&a.start===b.start&&a.end===b.end;}
function overlaps(a,b){return a.id!==b.id&&a.date===b.date&&a.start<b.end&&b.start<a.end&&!sameBlock(a,b);}
function conflicts(t){return state.data.filter(b=>state.favorites.has(b.id)&&overlaps(t,b));}
function topicMatch(t,topic){const s=norm([t.title,t.track,t.description].join(' '));return !topic||(topic==='glp'?(t.glp||t.related):topic==='urgencias'?/urgenc|shock|sepsis|trauma|reanim|ictus|via aerea|paro card|inestable/.test(s):topic==='pocus'?/pocus|ultrasonido|ultrasonografia/.test(s):topic==='diabetes'?/diabet|glucosa|glicem|glucem|cardiorrenometabol/.test(s):/gerencia|gestion|seguridad social|sistema de salud|inteligencia artificial|\bia\b|consentimiento|derecho medico|peritaje|cendeisss|formacion medica/.test(s));}
function queryMatches(t,query){const q=norm(query.trim());if(!q)return true;if(/semaglut|tirzep|tiezep|mounjaro|ozempic|rybelsus|wegovy|glp[ -]?1/.test(q))return t.glp||t.related;const searchable=norm([t.title,t.speakers,t.track,t.description,t.room].join(' '));return q.split(/\s+/).every(term=>searchable.includes(term));}
function matches(t){
 if(state.view==='favorites'&&!state.favorites.has(t.id))return false;
 if(state.view==='glp'&&!t.glp&&!t.related)return false;
 if(state.view==='agenda'&&!state.query&&!state.track&&!state.allDays&&t.date!==state.day)return false;
 if(state.track&&t.track!==state.track)return false;
 if(state.room&&t.room!==state.room)return false;
 if(state.period==='am'&&t.start>='12:00')return false;
 if(state.period==='pm'&&t.start<'12:00')return false;
 if(state.kind&&t.kind!==state.kind)return false;
 if(!topicMatch(t,state.topic))return false;
 return queryMatches(t,state.query);
}
function saveButton(t,detail=false){const saved=state.favorites.has(t.id);return `<button class="${detail?'secondary-btn':'save-btn'} ${saved?'saved':''}" data-save="${esc(t.id)}" aria-pressed="${saved}" aria-label="${saved?'Quitar de mi agenda':'Agregar a mi agenda'}: ${esc(t.title)}">${icon('star')}${detail?`<span>${saved?'Guardada en mi agenda':'Agregar a mi agenda'}</span>`:''}</button>`;}
function card(t){
 const saved=state.favorites.has(t.id), clash=saved?conflicts(t):[];
 return `<article class="talk-card"><div class="card-top"><span class="time">${esc(range(t))}</span>${saveButton(t)}</div>${state.view!=='agenda'||state.query||state.track||state.allDays?`<span class="date-label">${esc(dateName(t.date))}</span>`:''}<button class="card-title" data-detail="${esc(t.id)}">${esc(t.title)}</button>${t.speakers?`<p class="card-speaker">${esc(t.speakers)}</p>`:''}<div class="card-bottom"><span class="room">${icon('pin')}${esc(t.room)}</span><span class="tag">${esc(t.related?'Tema relacionado':t.kind==='charla'?'Charla':t.kind.charAt(0).toUpperCase()+t.kind.slice(1))}</span></div>${t.grouped?'<p class="subtle grouped-label">Horario del bloque</p>':''}${clash.length?`<p class="overlap-note">Se cruza con ${clash.length} ${clash.length===1?'actividad guardada':'actividades guardadas'}</p>`:''}</article>`;
}
function renderCatalog(){
 $('#view-title').textContent='Todos los temas';$('#view-subtitle').textContent='Explorá los bloques de los cinco días. Podés buscar cualquier tema o expositor.';
 $('#context-note').hidden=true;$('#favorite-summary').hidden=true;
 const groups=new Map();for(const t of state.data){if(!groups.has(t.track))groups.set(t.track,[]);groups.get(t.track).push(t);}
 const entries=[...groups].filter(([,talks])=>talks.some(t=>queryMatches(t,state.query))).sort(([a],[b])=>a.localeCompare(b,'es'));
 $('#result-count').textContent=state.loaded?`${entries.length} bloques`:'';
 if(!state.loaded)return;
 $('#list').innerHTML=entries.length?entries.map(([title,talks])=>`<button class="track-card" data-track="${esc(title)}"><span class="track-card-title">${esc(title)}</span><span class="track-count">${talks.length} ${talks.length===1?'actividad':'actividades'} · ${[...new Set(talks.map(t=>Number(t.date.slice(-2))))].sort((a,b)=>a-b).join(', ')} de octubre</span></button>`).join(''):'<div class="empty-state"><h3>No hay temas con esa búsqueda</h3><p>Probá con otra palabra o buscá el nombre de un expositor.</p><button class="secondary-btn" id="empty-reset">Limpiar filtros</button></div>';
}
function render(){
 const more=state.view==='more';$('#more-view').hidden=!more;$('#content-view').hidden=more;$('#agenda-controls').hidden=more;
 $('.hero').hidden=state.view!=='agenda';
 document.querySelectorAll('.nav-btn').forEach(b=>{const active=b.dataset.view===state.view||(state.view==='glp'&&b.dataset.view==='topics');b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 $('#favorite-count').textContent=state.favorites.size?String(state.favorites.size):'';
 $('#days').hidden=state.view!=='agenda'||!!state.query||!!state.track||state.allDays;
 $('#topics').hidden=state.view==='glp'||state.view==='topics';
 $('.filter-row').hidden=state.view==='topics';
 $('#days').innerHTML=DAYS.map(d=>`<button class="day-btn ${state.day===d[0]?'active':''}" data-day="${d[0]}" aria-pressed="${state.day===d[0]}"><span class="day-name">${d[1]}</span><strong class="day-number">${Number(d[0].slice(-2))}</strong><small class="day-month">octubre</small></button>`).join('');
 $('#topics').innerHTML=TOPICS.map(([key,label])=>`<button class="chip ${state.topic===key?'active':''}" data-topic="${key}" aria-pressed="${state.topic===key}">${label}</button>`).join('');
 $('#clear-search').hidden=!state.query;$('#reset-filters').hidden=!(state.query||state.room||state.period||state.topic||state.kind||state.track||state.allDays);
 $('#search').value=state.query;$('#room-filter').value=state.room;$('#period-filter').value=state.period;$('#kind-filter').value=state.kind;
 $('#search').setAttribute('aria-label',state.view==='favorites'?'Buscar en mi agenda':state.view==='glp'?'Buscar en GLP-1':state.view==='topics'?'Buscar entre todos los temas':'Buscar en todo el congreso');
 if(more)return;
 if(state.view==='topics'){renderCatalog();return;}
 const list=state.data.filter(matches).sort((a,b)=>a.date.localeCompare(b.date)||a.start.localeCompare(b.start)||a.room.localeCompare(b.room,'es')||a.title.localeCompare(b.title,'es'));
 $('#view-title').textContent=state.view==='glp'?'GLP-1 y obesidad':state.view==='favorites'?'Mi agenda':state.track|| (state.query?'Resultados del congreso':state.allDays?'Agenda completa':dateName(state.day));
 $('#view-subtitle').textContent=state.view==='favorites'?'Tus actividades guardadas, en orden de horario.':state.view==='glp'?'Las charlas del programa sobre GLP-1 y temas relacionados.':state.track?'Todas las actividades de este bloque.':state.query||state.allDays?'Actividades de los cinco días del congreso.':'Tocá una charla para ver su detalle. Usá la estrella para guardarla.';
 $('#result-count').textContent=state.loaded?`${list.length} ${list.length===1?'actividad':'actividades'}`:'';
 const showNote=state.view==='glp'||state.topic==='glp'||/semaglut|tirzep|tiezep|mounjaro|ozempic|rybelsus|wegovy|glp[ -]?1/.test(norm(state.query));
 $('#context-note').hidden=!showNote;$('#context-note').textContent='El programa no nombra semaglutida ni tirzepatida en los títulos. Estas son las actividades sobre GLP-1 y obesidad; no todas anuncian medicamentos específicos.';
 $('#favorite-summary').hidden=state.view!=='favorites'||!state.favorites.size;
 if(state.view==='favorites'&&state.favorites.size){const clashes=state.data.filter(t=>state.favorites.has(t.id)&&conflicts(t).length).length;$('#favorite-summary').innerHTML=`<span class="badge">${state.favorites.size} guardadas</span>${clashes?`<p class="overlap-note">${clashes} actividades tienen cruces de horario.</p>`:'<p class="subtle">Sin cruces de horario entre tus actividades.</p>'}<button class="secondary-btn" id="export-calendar">${icon('download')} Exportar al calendario</button><p class="subtle">Los favoritos se guardan en este dispositivo.</p>`;}
 if(!state.loaded){return;}
 const newAgenda=state.view==='favorites'&&!state.favorites.size;
 $('#list').innerHTML=list.length?list.map(card).join(''):`<div class="empty-state">${icon(newAgenda?'star':'search')}<h3>${newAgenda?'Armá tu agenda':'No hay actividades con estos filtros'}</h3><p>${newAgenda?'Tocá la estrella de las charlas que querés escuchar.':'Probá con otro tema o quitá los filtros.'}</p><button class="secondary-btn" id="empty-reset">${newAgenda?'Explorar la agenda':'Limpiar filtros'}</button></div>`;
}
function clearFilters(){state.query='';state.room='';state.period='';state.kind='';state.topic='';state.track='';state.allDays=false;}
function setView(view){state.view=view;clearFilters();history.replaceState(null,'',`#${view}`);render();window.scrollTo({top:0,behavior:'smooth'});}
function toggleSave(id){const old=state.favorites.has(id);old?state.favorites.delete(id):state.favorites.add(id);let persisted=true;try{localStorage.setItem(KEY,JSON.stringify([...state.favorites]));}catch{persisted=false;}
 render();if(!$('#detail-overlay').hidden)openDetail(id,false);
 toast(persisted?(old?'Actividad quitada de tu agenda':'Actividad guardada en tu agenda'):'Guardada por esta sesión. El navegador no permite conservar favoritos.');
}
function openDetail(id,initial=true){
 const t=state.data.find(x=>x.id===id);if(!t)return;
 if(initial)dialogTrigger=document.activeElement;
 const clash=conflicts(t), speaker=t.speakers?`<p class="detail-speaker">${esc(t.speakers)}</p>`:'';
 $('#detail-body').innerHTML=`<p class="detail-meta">${esc(dateName(t.date))} · ${esc(range(t))}</p><h2 id="detail-title" class="detail-title">${esc(t.title)}</h2>${speaker}<p class="detail-meta">${icon('pin')} ${esc(t.room)}</p><div class="detail-section"><h3>Bloque</h3><p>${esc(t.track)}</p></div>${t.description?`<div class="detail-section"><h3>Contenido</h3><p class="detail-description">${esc(t.description).replace(/\n/g,'<br>')}</p></div>`:''}${t.grouped?'<p class="notice">El programa asigna este horario al bloque completo. No indica una hora individual para cada tema.</p>':''}${clash.length?`<div class="detail-section"><h3>Otras actividades guardadas en este horario</h3>${clash.map(x=>`<p class="overlap-note">${esc(fmtTime(x.start))} · ${esc(x.title)} · ${esc(x.room)}</p>`).join('')}</div>`:''}<div class="sheet-actions">${saveButton(t,true)}<button class="secondary-btn" data-calendar="${esc(t.id)}">${icon('calendar')} Descargar para calendario</button></div><a class="source-link" href="programa-cmn-2026.pdf#page=${Number(t.page)}" target="_blank" rel="noopener">Ver página ${Number(t.page)} del programa original ↗</a>`;
 $('#detail-overlay').hidden=false;document.body.style.overflow='hidden';if(initial)$('#close-detail').focus();
 $('#detail-body').insertAdjacentHTML('beforeend','<div class="creator-credit"><span>Una iniciativa de</span><button class="creator-link" type="button" data-creator>Dr. Luis Mauricio Solano Corella</button></div>');
}
function closeDetail(){$('#detail-overlay').hidden=true;document.body.style.overflow='';dialogTrigger?.focus();}
function openGuide(){guideTrigger=document.activeElement;$('#guide-overlay').hidden=false;document.body.style.overflow='hidden';$('#close-guide').focus();}
function closeGuide(restore=true){$('#guide-overlay').hidden=true;document.body.style.overflow='';if(restore)guideTrigger?.focus();}
function guideSearch(query){const value=query.trim();if(!value){$('#guide-query').focus();return;}closeGuide(false);setView('agenda');state.query=value;render();$('#view-title').setAttribute('tabindex','-1');$('#view-title').focus({preventScroll:true});window.scrollTo({top:0,behavior:'smooth'});}
function showCreator(){if(!$('#detail-overlay').hidden)closeDetail();if(!$('#guide-overlay').hidden)closeGuide(false);setView('more');$('#creator-profile').setAttribute('tabindex','-1');$('#creator-profile').focus({preventScroll:true});$('#creator-profile').scrollIntoView({behavior:'smooth',block:'start'});}
const icsEscape=s=>String(s).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
function icsDate(date,time){return new Date(`${date}T${time}:00-06:00`).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');}
function fold(line){let out='',part='',bytes=0;for(const ch of line){const n=new TextEncoder().encode(ch).length;if(bytes+n>73){out+=part+'\r\n ';part='';bytes=1;}part+=ch;bytes+=n;}return out+part;}
function exportCalendar(talks){
 const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Mi Congreso//CMN2026//ES','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Mi Congreso 2026'];
 for(const t of talks){lines.push('BEGIN:VEVENT',`UID:cmn2026-${t.id}@mi-congreso`,`DTSTAMP:${stamp}`,`DTSTART:${icsDate(t.date,t.start)}`,`DTEND:${icsDate(t.date,t.end)}`,`SUMMARY:${icsEscape(t.title)}`,`LOCATION:${icsEscape(t.room+' - Hotel Real InterContinental')}`,`DESCRIPTION:${icsEscape([t.speakers,t.track,t.description,`Programa CMN 2026, página ${t.page}.`,t.grouped?'Horario del bloque completo.':''].filter(Boolean).join('\n'))}`,'END:VEVENT');}
 lines.push('END:VCALENDAR');const url=URL.createObjectURL(new Blob([lines.map(fold).join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=talks.length===1?'charla-cmn-2026.ics':'mi-agenda-cmn-2026.ics';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);toast('Archivo de calendario preparado');
}
document.addEventListener('click',e=>{
 if(e.target.closest('[data-creator]')){showCreator();return;}
 const saved=e.target.closest('[data-save]');if(saved){toggleSave(saved.dataset.save);return;}
 const detail=e.target.closest('[data-detail]');if(detail){openDetail(detail.dataset.detail);return;}
 const cal=e.target.closest('[data-calendar]');if(cal){exportCalendar(state.data.filter(t=>t.id===cal.dataset.calendar));return;}
 const nav=e.target.closest('[data-view]');if(nav){setView(nav.dataset.view);return;}
 const guideAction=e.target.closest('[data-guide-action]');if(guideAction){const action=guideAction.dataset.guideAction;if(action==='speaker'){$('#guide-query').placeholder='Nombre o apellidos del expositor';$('#guide-query').focus();}else{closeGuide(false);setView(action);if(action==='agenda'){state.allDays=true;render();}}return;}
 const track=e.target.closest('[data-track]');if(track){setView('agenda');state.track=track.dataset.track;state.allDays=true;render();return;}
 const day=e.target.closest('[data-day]');if(day){state.day=day.dataset.day;render();return;}
 const topic=e.target.closest('[data-topic]');if(topic){if(topic.dataset.topic==='glp'){setView('glp');return;}state.topic=topic.dataset.topic;render();return;}
 if(e.target.closest('#export-calendar'))exportCalendar(state.data.filter(t=>state.favorites.has(t.id)).sort((a,b)=>a.date.localeCompare(b.date)||a.start.localeCompare(b.start)));
 if(e.target.closest('#empty-reset')){if(state.view==='favorites'&&!state.favorites.size)setView('agenda');else{clearFilters();render();}}
});
$('#search').addEventListener('input',e=>{state.query=e.target.value;render();});
$('#clear-search').addEventListener('click',()=>{state.query='';render();$('#search').focus();});
for(const [id,key] of [['room-filter','room'],['period-filter','period'],['kind-filter','kind']])$('#'+id).addEventListener('change',e=>{state[key]=e.target.value;render();});
$('#reset-filters').addEventListener('click',()=>{clearFilters();render();});
$('#help-button').addEventListener('click',()=>setView('more'));
$('#go-favorites').addEventListener('click',()=>setView('favorites'));
$('#close-detail').addEventListener('click',closeDetail);
$('#detail-overlay').addEventListener('click',e=>{if(e.target===e.currentTarget)closeDetail();});
$('#guide-button').addEventListener('click',openGuide);
$('#close-guide').addEventListener('click',()=>closeGuide());
$('#guide-overlay').addEventListener('click',e=>{if(e.target===e.currentTarget)closeGuide();});
$('#guide-form').addEventListener('submit',e=>{e.preventDefault();guideSearch($('#guide-query').value);});
document.addEventListener('keydown',e=>{const guideOpen=!$('#guide-overlay').hidden;const overlay=guideOpen?$('#guide-overlay'):$('#detail-overlay');if(overlay.hidden)return;if(e.key==='Escape'){guideOpen?closeGuide():closeDetail();return;}if(e.key==='Tab'){const f=[...overlay.querySelectorAll('button,a[href],input')].filter(el=>!el.hidden);const first=f[0],last=f.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e;$('#install-button').hidden=false;});
$('#install-button').addEventListener('click',async()=>{if(installEvent){await installEvent.prompt();installEvent=null;$('#install-button').hidden=true;}});
window.addEventListener('hashchange',()=>{const v=location.hash.slice(1);if(['agenda','topics','glp','favorites','more'].includes(v)&&v!==state.view)setView(v);});
render();
fetch('agenda.json').then(r=>{if(!r.ok)throw Error('agenda');return r.json();}).then(data=>{
 state.data=data;state.loaded=true;state.favorites=new Set([...state.favorites].filter(id=>data.some(t=>t.id===id)));
 const rooms=[...new Set(data.map(t=>t.room))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));$('#room-filter').innerHTML='<option value="">Todos los salones</option>'+rooms.map(r=>`<option value="${esc(r)}">${esc(r)}</option>`).join('');render();
}).catch(()=>{$('#list').innerHTML='<div class="empty-state"><h3>No se pudo cargar la agenda</h3><p>Revisá la conexión y volvé a abrir la app.</p><a class="secondary-btn" href="programa-cmn-2026.pdf">Abrir programa original</a></div>';});
if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{$('#offline-info').textContent='La agenda y la guía breve quedan disponibles sin conexión después de la primera carga. El PDF original requiere conexión la primera vez.';}).catch(()=>{});});}
