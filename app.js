
/* =========================================================
   RESIDENT RUN. Focus blocks are patients, exams are bosses.
   Data lives in this browser (localStorage); use Backup in Today.
   ========================================================= */
const KEY='residentRun.v1';
const RANKS=[[0,'Med Student'],[200,'Intern'],[600,'Resident'],[1400,'Senior Resident'],[2800,'Fellow'],[5000,'Attending']];
const FINAL_ID='b-bmse';
const EXTRA_ZONES=[
  {id:'z-filters',name:'FILTERS'},
  {id:'z-german',name:'German'},
  {id:'z-uni',name:'Uni self-study'},
  {id:'z-other',name:'Other'},
];
const WARD_VAR={'b-endo':'--r1','b-research':'--r2','z-german':'--r3','z-filters':'--r4'};
const wardColor=id=>`var(${WARD_VAR[id]||'--r5'})`;
const isDE=z=>z==='z-german';
const BREAK_IDEAS=['Drink a full glass of water','Stand up and stretch for 60 seconds','Look out of a window, far away, for 20 seconds',
  '10 push-ups or squats','Listen to one song, no scrolling','Walk to another room and back','Five slow breaths','Grab a snack','Wash your face','Shoulder rolls and a neck stretch'];
const PATIENT_LINES=['Vitals stable. Keep going, Doctor.','The nurse is watching. In a good way.','Your future patients are rooting for you.','Pager silenced. Just you and the case.','This is where Residents are made.','Past the hardest part: the middle.','Brain warming up. Distractions not invited.'];
const TRAIN_LINES=['Einsteigen bitte! Zug fährt ab.','Nächster Halt: Konzentration.','Volle Fahrt voraus, Doktor!','Ablenkungen bleiben am Gleis.','Heute pünktlicher als die Bahn.','Strecke frei. Weiter geht\'s!','Gleich erreichst du die Station.'];

/* ---------- icons (drawn, not emoji) ---------- */
const ICON={
 today:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/>',
 focus:'<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M9.5 2.5h5"/>',
 exams:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
 wallet:'<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10.5h18M16 15h2"/>',
 flame:'<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4 .3 1.2 1 2 2 2 0-3-.5-5.5 1-8z"/>',
 shield:'<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/>',
 heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
 train:'<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M8 21l2-4M16 21l-2-4"/><circle cx="9" cy="14" r=".7"/><circle cx="15" cy="14" r=".7"/>',
 check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
 lock:'<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
 star:'<path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z"/>',
 doc:'<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
 bolt:'<path d="M13 2L5 13h6l-1 9 8-11h-6z"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
};
const ic=(n,s=22)=>`<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[n]||''}</svg>`;

/* ---------- date helpers ---------- */
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parse=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d,12)};
const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return ymd(d)};
const today=()=>ymd(new Date());
const mondayOf=s=>{const d=parse(s);d.setDate(d.getDate()-((d.getDay()+6)%7));return ymd(d)};
const daysBetween=(a,b)=>Math.round((parse(b)-parse(a))/864e5);
const fmtDate=s=>parse(s).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const fmt=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return `${pad(Math.floor(s/60))}:${pad(s%60)}`};
const hrs=min=>(min/60).toFixed(1);
const short=n=>String(n).replace(/ (Quiz|Submission)$/,'').replace(/ — .*/,'');

/* ---------- state ---------- */
function seed(){
  const mk=(id,name,icon,date,targetHrs,targetScore)=>({id,name,icon,date,targetHrs,targetScore,min:0,score:null,defeated:false});
  return {v:1,xp:0,hp:100,streak:0,best:0,shields:1,shieldWeek:null,checked:null,rest:[],perfect:0,awards:[],stops:[],
    dailyGoal:12,blockMin:25,blocksSinceLong:0,abandons:0,tab:'ward',
    bosses:[mk('b-endo','Endocrine Quiz','','2026-11-10',21,80),mk('b-research','Research Submission','','2026-11-11',16,100),
      mk('b-renal','Urinary Quiz','','2026-12-19',20,80),mk('b-rps','Reproductive Quiz','','2027-01-26',20,80),mk(FINAL_ID,'BMSE — FINAL BOSS','','2027-02-12',166,70)],
    rewards:[
      {id:'r-vpn',icon:'',name:'The VPN',tier:'rare',bossId:'b-endo',hrs:18,score:80,weekly:0,daily:0,claimed:null},
      {id:'r-atv',icon:'',name:'Apple TV box',tier:'legendary',bossId:FINAL_ID,hrs:150,score:70,weekly:0,daily:0,claimed:null},
      {id:'r-coffee',icon:'',name:'Favourite coffee trip',tier:'common',bossId:null,hrs:0,score:0,weekly:10,daily:0,claimed:null},
      {id:'r-night',icon:'',name:'Guilt-free show or game night',tier:'common',bossId:null,hrs:0,score:0,weekly:0,daily:5,claimed:null}],
    cards:[],log:[],active:null,recall:null,result:null,brk:null,notices:[]};
}
let S;
function load(){try{const raw=localStorage.getItem(KEY);if(raw){const o=JSON.parse(raw);if(o&&o.v===1)return o}}catch(e){}return seed()}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
S=load();
S.perfect=S.perfect||0; S.awards=S.awards||[]; S.stops=S.stops||[];

const zones=()=>[...S.bosses.map(b=>({id:b.id,name:b.name})),...EXTRA_ZONES];
const zoneOf=id=>zones().find(z=>z.id===id)||EXTRA_ZONES[3];
const rankIdx=xp=>{let i=0;RANKS.forEach((r,k)=>{if(xp>=r[0])i=k});return i};

/* ---------- feedback: haptics, sound, confetti ---------- */
function tap(){ try{ if(navigator.vibrate) navigator.vibrate(8);
  const l=document.createElement('label'); l.style.cssText='position:fixed;opacity:0;pointer-events:none;left:-99px';
  l.innerHTML='<input type="checkbox" switch>'; document.body.appendChild(l); l.click(); setTimeout(()=>l.remove(),60);}catch(e){} }
let actx=null;
function beep(){try{actx=actx||new(window.AudioContext||window.webkitAudioContext)();
  [0,.18,.36].forEach((t,i)=>{const o=actx.createOscillator(),g=actx.createGain();o.type='sine';o.frequency.value=[784,988,1319][i];
    g.gain.setValueAtTime(.0001,actx.currentTime+t);g.gain.exponentialRampToValueAtTime(.16,actx.currentTime+t+.02);g.gain.exponentialRampToValueAtTime(.0001,actx.currentTime+t+.34);
    o.connect(g);g.connect(actx.destination);o.start(actx.currentTime+t);o.stop(actx.currentTime+t+.36)})}catch(e){}}
let wake=null;
async function keepAwake(on){try{if(on&&'wakeLock' in navigator){wake=await navigator.wakeLock.request('screen')}else if(wake){await wake.release();wake=null}}catch(e){}}
function notify(msg){try{if('Notification' in window&&Notification.permission==='granted')new Notification('Resident Run',{body:msg})}catch(e){}}
function toast(msg){document.querySelectorAll('.toast').forEach(t=>t.remove());const el=document.createElement('div');el.className='toast';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),3300)}
function confetti(n=44){const cols=['--r1','--r2','--r3','--r4','--r5'];
  for(let i=0;i<n;i++){const e=document.createElement('i');e.className='conf';e.style.background=`var(${cols[i%5]})`;
    e.style.width=(6+Math.random()*7)+'px';e.style.height=(8+Math.random()*9)+'px';e.style.left=Math.random()*100+'vw';
    e.style.animationDuration=(2.2+Math.random()*2.4)+'s';e.style.animationDelay=(Math.random()*.5)+'s';e.style.transform=`rotate(${Math.random()*360}deg)`;
    document.body.appendChild(e);setTimeout(()=>e.remove(),5600)}}
function celebrate(title,sub){
  const el=document.createElement('div');el.className='cel';
  el.innerHTML=`<div class="cel-card">${ringsHTML(activeTargets().map((x,i)=>({zone:'cel'+i,color:wardColor(x.zone),p:1})),132,11,3,'celrings')}<h2>${esc(title)}</h2><p class="soft">${esc(sub)}</p><button class="cta" data-act="closecel">Nice</button></div>`;
  document.body.appendChild(el);confetti(70);animateRings();}

function addXp(n){
  if(S.hp<=0)n=Math.round(n/2);
  const before=rankIdx(S.xp);S.xp+=n;const after=rankIdx(S.xp);
  if(after>before){toast(`Promoted to ${RANKS[after][1]}`);confetti(40)}
  return n;
}

/* ---------- daily rollover: streak, shields, health ---------- */
function rollDays(){
  const t=today(),notes=[];const wk=mondayOf(t);
  if(S.shieldWeek!==wk){S.shieldWeek=wk;if(S.shields<1){S.shields=1;notes.push('New week, new free shield.')}}
  if(!S.checked)S.checked=addDays(t,-1);
  const had=new Set(S.log.map(l=>l.day));
  for(let d=addDays(S.checked,1);d<t;d=addDays(d,1)){
    if(had.has(d))continue;
    if(parse(d).getDay()===0||S.rest.includes(d))continue;
    if(S.shields>0){S.shields--;notes.push(`You missed ${fmtDate(d)}. A shield saved your streak.`)}
    else if(S.streak>0){notes.push(`You missed ${fmtDate(d)}. Streak of ${S.streak} lost, health −10. Fresh start today.`);S.streak=0;S.hp=Math.max(0,S.hp-10)}
    else S.hp=Math.max(0,S.hp-10);
  }
  S.checked=addDays(t,-1);if(notes.length)S.notices.push(...notes);save();
}
rollDays();

/* ---------- stats ---------- */
const blocksOn=d=>S.log.filter(l=>l.day===d).length;
const blocksWeek=()=>{const m=mondayOf(today());return S.log.filter(l=>l.day>=m).length};
function rank(){const i=rankIdx(S.xp),nx=RANKS[i+1];return{i,name:RANKS[i][1],cur:RANKS[i][0],next:nx?nx[0]:null}}
function nextBoss(){const t=today();return S.bosses.filter(b=>!b.defeated&&b.date>=t).sort((a,b)=>a.date<b.date?-1:1)[0]||null}
const bossPct=b=>clamp(b.min/60/b.targetHrs*100,0,100);
let DATA={rotations:[],dailyTargets:[],journey:null};
const journeyMin=()=>DATA.journey?S.log.filter(l=>l.zone===DATA.journey.zone).reduce((a,l)=>a+l.min,0):0;
const minToday=z=>S.log.filter(l=>l.day===today()&&l.zone===z).reduce((a,l)=>a+l.min,0);
const activeTargets=()=>{const t=today();return(DATA.dailyTargets||[]).map(x=>{if(x.dates){const h=x.dates[t];return h>0?{...x,hrs:h}:null}return(t<=x.until&&(!x.from||t>=x.from))?x:null}).filter(Boolean)};
const targetsMet=()=>{const ts=activeTargets();return ts.length>0&&ts.every(x=>minToday(x.zone)>=x.hrs*60)};
const currentRotation=()=>{const t=today();return(DATA.rotations||[]).find(r=>r.start<=t&&t<=r.end)||null};

/* ---------- awards ---------- */
const bossDone=id=>!!(S.bosses.find(b=>b.id===id)||{}).defeated;
const AWARDS=[
 {id:'first',name:'First Patient',ok:()=>S.log.length>=1,c:'--r1',ic:'check'},
 {id:'streak7',name:'Seven Days',ok:()=>S.best>=7,c:'--r5',ic:'flame'},
 {id:'close1',name:'Rings Closed',ok:()=>S.perfect>=1,c:'--r2',ic:'today'},
 {id:'close5',name:'Five Perfect Days',ok:()=>S.perfect>=5,c:'--r4',ic:'star'},
 {id:'endo',name:'Endocrine Passed',ok:()=>bossDone('b-endo'),c:'--r1',ic:'exams'},
 {id:'submit',name:'Submitted',ok:()=>bossDone('b-research'),c:'--r2',ic:'doc'},
 {id:'stop1',name:'Erster Halt',ok:()=>S.stops.length>=1,c:'--r3',ic:'train'},
 {id:'h100',name:'100 Hours',ok:()=>S.log.reduce((a,l)=>a+l.min,0)>=6000,c:'--r4',ic:'bolt'},
];
function checkAwards(silent){
  const fresh=[];AWARDS.forEach(a=>{if(a.ok()&&!S.awards.includes(a.id)){S.awards.push(a.id);fresh.push(a.name)}});
  if(fresh.length){save();if(!silent){toast('Award earned: '+fresh.join(', '));confetti(30)}}
}

/* ---------- rings ---------- */
const RING_PREV={};
function ringsHTML(items,size=156,stroke=13,gap=4,id='rings'){
  const cx=size/2;let h=`<svg id="${id}" class="rings" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Daily progress rings">`;
  items.forEach((it,i)=>{const r=cx-stroke/2-i*(stroke+gap)-1,c=2*Math.PI*r,from=clamp(RING_PREV[it.zone]??0,0,1),to=clamp(it.p,0,1);
    h+=`<g transform="rotate(-90 ${cx} ${cx})"><circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke-width="${stroke}" style="stroke:${it.color};stroke-opacity:.2"/>
      <circle class="rp${to>=1?' full':''}" data-to="${c*(1-to)}" cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-from)}" style="stroke:${it.color};color:${it.color}"/></g>`});
  return h+'</svg>';
}
function animateRings(){requestAnimationFrame(()=>requestAnimationFrame(()=>document.querySelectorAll('.rp').forEach(e=>e.style.strokeDashoffset=e.dataset.to)))}

/* =========================================================
   VIEWS
   ========================================================= */
let pickedZone=null,draftRating=0;
function render(){
  const a=S.tab;
  renderNav();
  const app=$('#app');app.innerHTML={ward:vToday,shift:vFocus,boss:vExams,vault:vWallet}[a]();
  pageEnter(app,a);
  if(a==='ward')animateRings();
  if(a==='shift')tick();
}

function vToday(){
  const t=today(),r=rank(),tg=activeTargets(),nb=nextBoss(),J=DATA.journey,rot=currentRotation();
  const items=tg.map(x=>({zone:x.zone,color:wardColor(x.zone),p:minToday(x.zone)/(x.hrs*60),m:minToday(x.zone),hrs:x.hrs}));
  const dateStr=new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'});
  const week=[...Array(7)].map((_,i)=>{const d=addDays(t,i-6);return{d,n:blocksOn(d),lab:['S','M','T','W','T','F','S'][parse(d).getDay()]}});
  const mx=Math.max(4,...week.map(w=>w.n));
  const restUsed=S.rest.filter(d=>d>=mondayOf(t)).length;
  const xpPct=r.next?(S.xp-r.cur)/(r.next-r.cur)*100:100;
  let h=`<div class="view"><header class="lt"><div class="eyebrow">${esc(dateStr)}</div><h1>Today</h1></header>`;
  S.notices.forEach(n=>h+=`<div class="banner">${esc(n)}</div>`);
  if(S.notices.length)h+=`<div class="row" style="justify-content:flex-end"><button class="tb" data-act="clearnotes">Dismiss</button></div>`;
  if(S.hp<=0)h+=`<div class="banner">Burnout. You earn half XP until you recover. Finish a session for +10 health.</div>`;
  h+=`<section class="list"><div class="hero">${items.length?ringsHTML(items):''}
    <div class="legend">${items.length?items.map(it=>`<div class="lg"><div class="ln" style="color:${it.color}">${esc(short(zoneOf(it.zone).name))}</div><div class="lv"><b>${hrs(it.m)}</b>/${it.hrs} h</div></div>`).join(''):'<p class="soft">No daily targets set. Ask Claude to add some.</p>'}</div></div></section>`;
  h+=`<button class="cta" data-act="tab" data-v="shift">${targetsMet()?'Keep going':'Start focus'}</button>`;
  h+=`<div class="eyebrow-s">Status</div><section class="list">
    <div class="stats"><div><b style="color:var(--r5)">${ic('flame',22)}${S.streak}</b><span>day streak</span></div>
      <div><b style="color:var(--accent)">${ic('shield',22)}${S.shields}</b><span>shield${S.shields===1?'':'s'}</span></div>
      <div><b style="color:var(--r3)">${ic('heart',22)}${S.hp}</b><span>health</span></div></div>
    <div class="item"><div class="row sp"><b style="font-family:var(--round)">${r.name}</b><span class="soft small">${S.xp} XP${r.next?` · ${r.next-S.xp} to ${RANKS[r.i+1][1]}`:''}</span></div>
      <div class="cap" style="--c:var(--r4);margin-top:9px"><i style="width:${xpPct}%"></i></div></div></section>`;
  if(rot)h+=`<div class="eyebrow-s">Rotation</div><section class="list"><div class="item row sp"><b style="font-family:var(--round)">${esc(rot.name)}</b><span class="pill">${Math.max(0,daysBetween(t,rot.end))} days left</span></div></section>`;
  if(nb){const dl=daysBetween(t,nb.date),col=wardColor(nb.id);
    h+=`<div class="eyebrow-s">Next exam</div><section class="list"><div class="item"><div class="row sp"><div><h3>${esc(nb.name)}</h3><div class="soft small">${fmtDate(nb.date)}</div></div><span class="pill ${dl<=3?'hot':''}">${dl===0?'Today':dl+' days'}</span></div>
      <div class="cap" style="--c:${col};margin-top:12px"><i style="width:${bossPct(nb)}%"></i></div><div class="soft small" style="margin-top:6px">${hrs(nb.min)} of ${nb.targetHrs} h prepared</div></div></section>`}
  if(J&&J.stops.length){const jm=journeyMin()/60,last=J.stops[J.stops.length-1].hrs||1,nxt=J.stops.find(x=>x.hrs>jm);
    h+=`<div class="eyebrow-s">${esc(J.name)}</div><section class="list"><div class="item"><div class="row sp"><div class="row" style="color:var(--r3)">${ic('train',24)}<h3 style="color:var(--ink)">${nxt?esc(nxt.name):'Endstation'}</h3></div><span class="pill">${jm.toFixed(1)} h</span></div>
      <div class="cap" style="--c:var(--db);margin-top:12px"><i style="width:${clamp(jm/last*100,0,100)}%"></i></div>
      <div class="soft small" style="margin-top:6px">${nxt?`Nächster Halt in ${(nxt.hrs-jm).toFixed(1)} h of German`:'Willkommen in München'}</div></div></section>`}
  h+=`<div class="eyebrow-s">Last 7 days</div><section class="list"><div class="bars">${week.map((w,i)=>`<div class="${i===6?'td':''}"><i style="height:${Math.max(4,w.n/mx*56)}px"></i>${w.lab}</div>`).join('')}</div><div style="height:12px"></div></section>`;
  h+=`<button class="rcard" data-act="replay"><span>Replay</span><b>Your study story so far</b><i>Open</i></button>`;
  h+=`<div class="eyebrow-s">Connected to Claude</div><section class="list">
    <div class="item"><div class="row sp"><div class="row"><span class="dot"></span><div><div>Linked to GitHub</div><div class="soft small">gams-hub/resident-run</div></div></div><a class="tb" href="https://github.com/gams-hub/resident-run" target="_blank" rel="noopener noreferrer">Open</a></div></div>
    <div class="item row sp"><div><div>App version</div><div class="soft small">${esc(APP_VERSION)} · ${SYNC_AT?'synced '+esc(new Date(SYNC_AT).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})):'not synced yet'}</div></div><button class="tb" data-act="checkupdate">Check for updates</button></div>
    <div class="item soft small">Ask Claude to change exams, rewards, your schedule or the app's own code. Changes ship through GitHub, and this app picks them up automatically whenever you open it. Your progress stays on this phone.</div></section>
  <div class="eyebrow-s">Settings</div><section class="list">
    <div class="item row sp"><div><div>Rest day</div><div class="soft small">${S.rest.includes(t)?'Today is a rest day. Streak is safe.':'One per week. Sundays are always free.'}</div></div><button class="tb" data-act="rest" ${restUsed>=1||S.rest.includes(t)?'disabled':''}>Take today</button></div>
    <div class="item row sp"><div><div>Backup</div><div class="soft small">Your progress lives on this phone.</div></div><div class="row"><button class="tb" data-act="export">Copy</button><button class="tb" data-act="import">Restore</button></div></div>
    <div class="item"><a href="planner.html">Open the old FILTERS planner</a></div>
    <div class="item"><button class="tb danger" data-act="reset">Reset everything</button></div></section></div>`;
  items.forEach(it=>RING_PREV[it.zone]=it.p);
  return h;
}

function defaultZone(){const open=activeTargets().find(x=>minToday(x.zone)<x.hrs*60),last=S.log[S.log.length-1];return(open&&open.zone)||(last&&last.zone)||'z-filters'}
function vFocus(){
  if(S.result)return vResult();if(S.recall)return vRecall();if(S.brk)return vBreak();if(S.active)return vTimer();
  const t=today(),pick=pickedZone||defaultZone(),tg=activeTargets();
  const list=[...S.bosses.filter(b=>!b.defeated&&b.date>=t).map(b=>({id:b.id,name:b.name})),...EXTRA_ZONES];
  return `<div class="view"><header class="lt"><div class="eyebrow">Focus</div><h1>New session</h1></header>
  <div class="eyebrow-s" style="margin-top:14px">Ward</div>
  <div class="chips" id="chips">${list.map(z=>{const x=tg.find(q=>q.zone===z.id),left=x?Math.max(0,x.hrs*60-minToday(z.id)):null;
    return `<button class="chip ${z.id===pick?'on':''}" data-act="pickzone" data-v="${z.id}" style="--c:${wardColor(z.id)}"><i></i><span>${esc(short(z.name))}${left!==null?`<small>${left>0?hrs(left)+' h left':'target met'}</small>`:''}</span></button>`}).join('')}</div>
  <label class="fl">What are you studying?</label><input id="topic" placeholder="e.g. Thyroid pathology, videos 1 to 3" maxlength="120" autocomplete="off">
  <label class="fl">Length</label><div class="seg" id="seg">${[15,25,45].map(m=>`<button class="${S.blockMin===m?'on':''}" data-act="blockmin" data-v="${m}">${m} min</button>`).join('')}</div>
  <p class="soft small" style="margin:14px 4px 0">Survive the first 2 minutes and you earn the scrub-in bonus. Starting is the hard part.</p>
  <button class="cta" data-act="start">Start</button></div>`;
}

const RING_BIG=779.1;
function vTimer(){
  const a=S.active,z=zoneOf(a.zone);
  return `<div class="focus" style="--wc:${wardColor(a.zone)}"><div class="wash"></div>
   <div class="eyebrow" style="color:var(--wc)">${isDE(a.zone)?'Zug unterwegs':'In session'} · ${esc(short(z.name))}</div>
   <h2 class="topic">${esc(a.topic||'Untitled session')}</h2>
   <div class="bigring"><svg width="272" height="272" viewBox="0 0 272 272"><g transform="rotate(-90 136 136)">
     <circle cx="136" cy="136" r="124" fill="none" stroke-width="16" style="stroke:var(--wc);stroke-opacity:.2"/>
     <circle id="ring" cx="136" cy="136" r="124" fill="none" stroke-width="16" stroke-linecap="round" stroke-dasharray="${RING_BIG}" stroke-dashoffset="0" style="stroke:var(--wc)"/></g></svg>
     <div class="bigclock"><div id="clock">--:--</div><div id="line"></div></div></div>
   <div class="row" style="justify-content:center"><span class="pill" id="dist">Distractions: ${a.distractions}</span><span class="pill">${a.dur/60000} min</span></div>
   <p class="soft small" style="margin:14px 20px 0">Leave this tab for more than 15 seconds and the session loses XP.</p>
   <button class="tb danger" data-act="abandon" style="margin-top:8px">Abandon session (−15 health)</button></div>`;
}

function vRecall(){
  const r=S.recall,z=zoneOf(r.zone),de=isDE(r.zone);
  return `<div class="view" style="--wc:${wardColor(r.zone)}"><header class="lt"><div class="eyebrow" style="color:var(--wc)">${de?'Fahrkartenkontrolle':'Diagnosis'} · ${esc(short(z.name))}</div><h1>How did it go?</h1></header>
  <p class="soft small" style="margin:0 4px 6px">${r.min} minutes${r.dist?`, ${r.dist} distraction${r.dist>1?'s':''}`:', zero distractions'}.</p>
  <label class="fl">${de?'Schreib 2 bis 3 Sätze auf Deutsch: Was hast du gelernt? (min. 8 words)':'Write what you remember, no peeking (min. 8 words)'}</label>
  <textarea id="dump" placeholder="${de?'Heute habe ich … gelernt.':'The mechanism is … the key points are …'}"></textarea>
  <div class="soft small" id="wc" style="margin:6px 4px 0">0 words</div>
  <label class="fl">How well did it stick?</label>
  <div class="seg" id="rate">${[1,2,3,4,5].map(n=>`<button class="${draftRating===n?'on':''}" data-act="rate" data-v="${n}">${n}</button>`).join('')}</div>
  <div class="row sp soft small" style="margin:6px 4px 0"><span>Foggy</span><span>Locked in</span></div>
  <button class="cta" id="discharge" data-act="discharge" disabled>Done</button>
  <div style="text-align:center"><button class="tb" data-act="skiprecall">Skip recall (half XP)</button></div></div>`;
}

function vResult(){
  const r=S.result;
  return `<div class="view"><header class="lt"><div class="eyebrow">${r.de?'Station erreicht':'Session complete'}</div><h1 style="color:var(--r4)">+${r.xp} XP</h1></header>
  <section class="list">${r.lines.map(l=>`<div class="item">${esc(l)}</div>`).join('')}</section>
  ${r.chest.opened?`<div class="drop open"><span class="drop-ic">${ic(r.chest.ic,36)}</span><b>${esc(r.chest.label)}</b></div>`
    :`<button class="drop" data-act="chest"><span class="drop-ic">${ic('star',36)}</span><b>Reward drop</b><small>Tap to open</small></button>`}
  <button class="cta" data-act="gobreak" ${r.chest.opened?'':'disabled'}>${r.long?'Start long break':'Start break'}</button></div>`;
}

function vBreak(){
  const b=S.brk;if(!b.ideas)b.ideas=[...BREAK_IDEAS].sort(()=>Math.random()-.5).slice(0,5);
  return `<div class="focus" style="--wc:var(--r2)"><div class="wash"></div><div class="eyebrow">${b.long?'Long break':'Short break'}</div>
   <div id="clock" style="margin:18px 0 6px;font-size:84px">--:--</div><p class="soft small">Breaks are part of the plan. Pick one.</p>
   <section class="list" style="text-align:left;margin-top:18px">${b.ideas.map(i=>`<div class="item">${esc(i)}</div>`).join('')}</section>
   <button class="cta" data-act="endbreak">Ready for the next one</button></div>`;
}

function vExams(){
  const t=today(),list=[...S.bosses].sort((a,b)=>a.date<b.date?-1:1);
  return `<div class="view"><header class="lt"><div class="eyebrow">Countdown</div><h1>Exams</h1><button class="tb add" data-act="addboss">${ic('plus',18)}Add</button></header>`+
  list.map(b=>{const dl=daysBetween(t,b.date),past=dl<0,col=wardColor(b.id),sub=b.kind==='submit';
    return `<section class="list" style="margin-top:12px"><div class="item"><div class="row sp"><div><div class="eyebrow">${fmtDate(b.date)}</div><h3 style="margin-top:2px">${esc(b.name)}</h3></div>
      <span class="pill ${dl<=3&&!b.defeated&&!past?'hot':''}">${b.defeated?(sub?'Submitted':'Passed'):past?'Passed':dl===0?'Today':dl+' days'}</span></div>
      <div class="cap" style="--c:${col};margin-top:14px"><i style="width:${bossPct(b)}%"></i></div>
      <div class="soft small" style="margin-top:7px">${hrs(b.min)} of ${b.targetHrs} h${sub?'':` · need ${b.targetScore}%`}${!sub&&b.score!==null?` · <b style="color:${b.score>=b.targetScore?'var(--r2)':'var(--danger)'}">you scored ${b.score}%</b>`:''}</div>
      <div class="acts">${sub?`<button class="tb" data-act="submitted" data-v="${b.id}" ${b.defeated?'disabled':''}>Mark as submitted</button>`:`<button class="tb" data-act="score" data-v="${b.id}">Log my score</button>`}
        <button class="tb" data-act="editboss" data-v="${b.id}">Edit</button><button class="tb danger" data-act="delboss" data-v="${b.id}">Delete</button></div></div></section>`}).join('')+`</div>`;
}

function rewardState(r){
  const t=today(),wk=mondayOf(t),parts=[];
  if(r.bossId){const b=S.bosses.find(x=>x.id===r.bossId);
    if(b){parts.push({ok:b.min/60>=r.hrs,txt:`${hrs(b.min)} of ${r.hrs} h on ${short(b.name)}`});
      if(b.kind!=='submit')parts.push({ok:b.score!==null&&b.score>=r.score,txt:`Score of ${r.score}% or more${b.score!==null?` (you: ${b.score}%)`:''}`});
      else parts.push({ok:!!b.defeated,txt:'Submitted'})}}
  if(r.weekly)parts.push({ok:blocksWeek()>=r.weekly,txt:`${blocksWeek()} of ${r.weekly} sessions this week`});
  if(r.daily)parts.push({ok:blocksOn(t)>=r.daily,txt:`${blocksOn(t)} of ${r.daily} sessions today`});
  const unlocked=parts.length>0&&parts.every(p=>p.ok),repeat=r.weekly||r.daily,period=r.weekly?wk:r.daily?t:'once';
  return{parts,unlocked,claimed:repeat?r.claimedKey===period:!!r.claimed,period};
}
function vWallet(){
  const J=DATA.journey,jm=journeyMin()/60;
  let h=`<div class="view"><header class="lt"><div class="eyebrow">Earned, not given</div><h1>Wallet</h1><button class="tb add" data-act="addreward">${ic('plus',18)}Add</button></header><div class="passes">`;
  S.rewards.forEach(r=>{const st=rewardState(r),cls=st.claimed?'claimed':st.unlocked?'ready':'locked';
    h+=`<article class="pass ${r.tier} ${cls}"><div class="pass-top"><div class="pass-kicker">${r.tier.toUpperCase()} REWARD</div><h3>${esc(r.name)}</h3>
      <span class="pass-state">${st.claimed?ic('check',16)+'Claimed':st.unlocked?ic('star',16)+'Unlocked':ic('lock',16)+'Locked'}</span></div>
      <div class="pass-cut"><i></i><span></span><i></i></div><div class="pass-body">
      ${st.parts.map(p=>`<div class="req ${p.ok?'ok':''}">${p.ok?ic('check',16):'<span class="o"></span>'}<span>${esc(p.txt)}</span></div>`).join('')||'<div class="soft small">No requirements set yet.</div>'}
      <div class="barcode"></div>
      <div class="acts"><button class="tb" data-act="claim" data-v="${r.id}" ${st.unlocked&&!st.claimed?'':'disabled'}>Claim</button><button class="tb" data-act="editreward" data-v="${r.id}">Edit</button><button class="tb danger" data-act="delreward" data-v="${r.id}">Delete</button></div></div></article>`});
  h+=`</div>`;
  if(J&&J.stops.length>1){h+=`<div class="eyebrow-s">Fahrkarten · ${esc(J.name)}</div><div class="fks">`;
    for(let i=1;i<J.stops.length;i++){const a=J.stops[i-1],b=J.stops[i],got=jm>=b.hrs;
      h+=`<article class="fk ${got?'got':''}"><div class="fk-top"><span>FAHRKARTE</span><span>${got?'GÜLTIG':'GESPERRT'}</span></div>
        <div class="fk-route"><div><small>VON</small><b>${esc(a.name)}</b></div>${ic('train',22)}<div style="text-align:right"><small>NACH</small><b>${esc(b.name)}</b></div></div>
        <div class="fk-bot"><span>${b.hrs} h gesamt</span><span>${got?'erreicht':`noch ${(b.hrs-jm).toFixed(1)} h`}</span></div></article>`}
    h+=`</div>`}
  h+=`<div class="eyebrow-s">Awards</div><section class="list"><div class="medals">${AWARDS.map(a=>{const on=S.awards.includes(a.id);
    return `<div class="medal ${on?'':'off'}" style="--mc:var(${a.c})"><div class="m">${ic(on?a.ic:'lock',28)}</div><span>${esc(a.name)}</span></div>`}).join('')}</div></section></div>`;
  return h;
}

/* =========================================================
   TIMER ENGINE (timestamp based: survives refresh and sleep)
   ========================================================= */
function tick(){
  const now=Date.now();
  if(S.active){const a=S.active,left=a.start+a.dur-now;
    if(left<=0){completeBlock();return}
    const clock=$('#clock');if(clock)clock.textContent=fmt(left);
    const ring=$('#ring');if(ring)ring.setAttribute('stroke-dashoffset',(RING_BIG*(1-(a.dur-left)/a.dur)).toFixed(1));
    const line=$('#line');if(line){const L=isDE(a.zone)?TRAIN_LINES:PATIENT_LINES,i=Math.floor((a.dur-left)/60000)%L.length;line.textContent=L[i]}
    document.title=`${fmt(left)} · Resident Run`;
    if(!a.scrubbed&&now-a.start>=120000){a.scrubbed=true;const g=addXp(5);save();toast(`Scrubbed in. +${g} XP. You're officially doing it.`)}
  }else if(S.brk){const left=S.brk.end-now;
    if(left<=0&&S.tab==='shift'&&!S.brk.done){S.brk.done=true;save();beep();notify('Break over. Next session?');toast('Break over')}
    const clock=$('#clock');if(clock)clock.textContent=fmt(left);document.title=`${fmt(left)} break · Resident Run`;
  }else document.title='Resident Run';
}
setInterval(()=>{if(S.active||S.brk)tick()},500);
document.addEventListener('visibilitychange',()=>{
  const a=S.active;if(!a)return;
  if(document.hidden){a.awaySince=Date.now();save()}
  else if(a.awaySince){const away=Date.now()-a.awaySince;a.awaySince=null;
    if(away>15000&&Date.now()<a.start+a.dur+60000){a.distractions++;toast(`Session left alone for ${Math.round(away/1000)}s`)}
    save();const d=$('#dist');if(d)d.textContent=`Distractions: ${a.distractions}`;tick();keepAwake(true)}
});
function completeBlock(){
  const a=S.active;if(!a)return;beep();notify('Session done. Time for the check-in.');
  S.recall={zone:a.zone,topic:a.topic,min:a.dur/60000,dist:a.distractions,start:a.start};
  S.active=null;draftRating=0;keepAwake(false);save();S.tab='shift';render();
}

/* =========================================================
   ACTIONS
   ========================================================= */
function discharge(skip){
  const r=S.recall;if(!r)return;const t=today(),rating=skip?0:(draftRating||3);
  const firstToday=blocksOn(t)===0;if(firstToday){S.streak++;S.best=Math.max(S.best,S.streak)}
  const base=r.min*2,dm=Math.max(.4,1-.15*Math.min(r.dist,4)),sm=1+Math.min(.5,S.streak*.05);
  let raw=(base*dm+rating*4)*sm;if(skip)raw*=.5;
  const gained=addXp(Math.round(raw));S.hp=Math.min(100,S.hp+10);
  const credit=new Set();if(S.bosses.some(b=>b.id===r.zone))credit.add(r.zone);if(r.zone==='z-filters')credit.add(FINAL_ID);
  S.bosses.forEach(b=>{if(credit.has(b.id))b.min+=r.min});
  S.log.push({t:Date.now(),day:t,zone:r.zone,topic:r.topic,min:r.min,xp:gained,dist:r.dist,rating});
  const stopLines=[];
  if(DATA.journey&&r.zone===DATA.journey.zone){const tot=journeyMin()/60;
    DATA.journey.stops.forEach(st=>{if(st.hrs>0&&tot>=st.hrs&&!S.stops.includes(st.name)){S.stops.push(st.name);addXp(40);stopLines.push(`Ankunft in ${st.name}. +40 XP`)}})}
  S.blocksSinceLong++;const long=S.blocksSinceLong>=4;
  const lines=[`${r.min} minutes of focus${r.dist?`, −${Math.round((1-dm)*100)}% for distractions`:', zero distractions'}`];
  if(firstToday)lines.push(`Streak: ${S.streak} day${S.streak>1?'s':''}${sm>1?` (+${Math.round((sm-1)*100)}% bonus)`:''}`);
  if(S.hp<100)lines.push('Health +10');
  lines.push(...stopLines);
  let cel=null;
  if(S.bonusDay!==t&&targetsMet()){S.bonusDay=t;S.perfect++;addXp(50);lines.push('Every daily target hit. +50 XP');cel=['All rings closed','Every target hit today. +50 XP.']}
  S.result={xp:gained,lines,long,de:isDE(r.zone),chest:{opened:false}};
  S.recall=null;save();render();checkAwards();
  if(cel)setTimeout(()=>celebrate(cel[0],cel[1]),350);
}
function openChest(){
  const roll=Math.random();let c;
  if(roll<.40)c={ic:'bolt',label:'+10 bonus XP',fn:()=>addXp(10)};
  else if(roll<.68)c={ic:'bolt',label:'+25 bonus XP',fn:()=>addXp(25)};
  else if(roll<.82)c={ic:'shield',label:S.shields<2?'Shield. Streak insurance +1':'Shield maxed. +25 XP instead',fn:()=>S.shields<2?S.shields++:addXp(25)};
  else if(roll<.92)c={ic:'heart',label:'+15 health',fn:()=>S.hp=Math.min(100,S.hp+15)};
  else if(roll<.98)c={ic:'star',label:'Rare. +100 XP',fn:()=>addXp(100)};
  else c={ic:'star',label:'Jackpot. +250 XP',fn:()=>addXp(250)};
  c.fn();S.result.chest={opened:true,ic:c.ic,label:c.label};if(roll>=.92)confetti(60);save();render();
}
function startBlock(){
  const zone=pickedZone||defaultZone(),topic=($('#topic').value||'').trim();
  try{if('Notification' in window&&Notification.permission==='default')Notification.requestPermission()}catch(e){}
  try{actx=actx||new(window.AudioContext||window.webkitAudioContext)();actx.resume()}catch(e){}
  S.active={start:Date.now(),dur:S.blockMin*60000,zone,topic,distractions:0,awaySince:null,scrubbed:false};
  keepAwake(true);save();render();
}
function endBreak(){if(S.brk&&S.brk.long)S.blocksSinceLong=0;S.brk=null;save();render()}

/* ---- in-page confirm / number prompt (browser pop-ups are blocked inside artifacts) ---- */
function ask(msg,{ok='OK',input=false,val=''}={}){
  return new Promise(res=>{const d=$('#dlg2');let fin=false;
    const done=v=>{if(fin)return;fin=true;if(d.open)d.close();res(v)};
    d.innerHTML=`<h3>${esc(msg)}</h3>${input?`<input id="ask-in" type="number" inputmode="decimal" value="${esc(val)}" style="margin-top:12px">`:''}
      <button class="cta" id="ask-ok">${esc(ok)}</button><div style="text-align:center"><button class="tb" id="ask-no">Cancel</button></div>`;
    $('#ask-ok').onclick=()=>done(input?$('#ask-in').value:true);$('#ask-no').onclick=()=>done(input?null:false);
    d.oncancel=()=>done(input?null:false);d.showModal();if(input)$('#ask-in').focus()});
}
function openDlg(html){const d=$('#dlg');d.innerHTML=html;d.showModal()}
function closeDlg(){$('#dlg').close()}
function bossForm(b){
  b=b||{id:'',name:'',date:today(),targetHrs:8,targetScore:80};
  openDlg(`<h3>${b.id?'Edit exam':'New exam'}</h3><label class="fl">Name</label><input id="f-name" value="${esc(b.name)}">
    <label class="fl">Date</label><input id="f-date" type="date" value="${b.date}">
    <div class="grid2"><div><label class="fl">Prep hours</label><input id="f-hrs" type="number" step="0.5" value="${b.targetHrs}"></div><div><label class="fl">Target score %</label><input id="f-score" type="number" value="${b.targetScore}"></div></div>
    <button class="cta" data-act="savedboss" data-v="${b.id}">Save</button><div style="text-align:center"><button class="tb" data-act="closedlg">Cancel</button></div>`);
}
function rewardForm(r){
  r=r||{id:'',name:'',tier:'common',bossId:'',hrs:0,score:0,weekly:0,daily:0};
  openDlg(`<h3>${r.id?'Edit reward':'New reward'}</h3><label class="fl">What do you get?</label><input id="f-name" value="${esc(r.name)}">
    <label class="fl">Tier</label><div class="seg" id="f-tier">${['common','rare','legendary'].map(t=>`<button class="${r.tier===t?'on':''}" data-act="pickier" data-v="${t}">${t}</button>`).join('')}</div>
    <label class="fl">Unlocks after this exam (optional)</label>
    <div class="chips" id="f-boss" style="margin:0 -18px;padding-left:18px"><button class="chip ${!r.bossId?'on':''}" data-act="pickboss" data-v="" style="--c:var(--soft)"><i></i>None</button>${S.bosses.map(b=>`<button class="chip ${r.bossId===b.id?'on':''}" data-act="pickboss" data-v="${b.id}" style="--c:${wardColor(b.id)}"><i></i>${esc(short(b.name))}</button>`).join('')}</div>
    <div class="grid2"><div><label class="fl">Prep hours</label><input id="f-hrs" type="number" step="0.5" value="${r.hrs}"></div><div><label class="fl">Score %</label><input id="f-score" type="number" value="${r.score}"></div></div>
    <div class="grid2"><div><label class="fl">Sessions per week</label><input id="f-weekly" type="number" value="${r.weekly}"></div><div><label class="fl">Sessions per day</label><input id="f-daily" type="number" value="${r.daily}"></div></div>
    <button class="cta" data-act="savedreward" data-v="${r.id}">Save</button><div style="text-align:center"><button class="tb" data-act="closedlg">Cancel</button></div>`);
}

/* ---- click delegation ---- */
document.addEventListener('click',async e=>{
  const cl=e.target.closest('[data-act]');if(!cl)return;
  const act=cl.dataset.act,v=cl.dataset.v;if(cl.disabled)return;tap();
  const A={
    tab(){S.tab=v;save();render();window.scrollTo(0,0)},
    async checkupdate(){toast('Checking for updates');await syncData();const up=await codeCheck(true);if(!up)toast('You have the latest version');render()},
    replay(){openReplay()},
    closereplay(){const r=document.querySelector('.rply');if(r)r.remove();document.body.style.overflow=''},
    clearnotes(){S.notices=[];save();render()},
    closecel(){const c=document.querySelector('.cel');if(c)c.remove()},
    rest(){S.rest.push(today());save();toast('Rest day logged. Recharge, Doctor.');render()},
    export(){const json=JSON.stringify(S);
      navigator.clipboard.writeText(json).then(()=>toast('Backup copied. Paste it into Notes to keep it safe.')).catch(()=>openDlg(`<h3>Backup</h3><p class="soft small">Select all and copy this text.</p><textarea id="bk" readonly>${esc(json)}</textarea><button class="cta" data-act="closedlg">Close</button>`))},
    import(){openDlg(`<h3>Restore backup</h3><p class="soft small">Paste the backup text you copied earlier.</p><textarea id="bk" placeholder='{"v":1,...}'></textarea><button class="cta" data-act="restoretext">Restore</button><div style="text-align:center"><button class="tb" data-act="closedlg">Cancel</button></div>`)},
    restoretext(){try{const o=JSON.parse($('#bk').value);if(o&&o.v===1){S=o;S.perfect=S.perfect||0;S.awards=S.awards||[];S.stops=S.stops||[];save();rollDays();closeDlg();render();toast('Backup restored')}else toast('That does not look like a backup')}catch(err){toast('Could not read that text')}},
    async reset(){if(await ask('Reset all progress? This cannot be undone.',{ok:'Reset'})){S=seed();rollDays();mergeData(DEFAULT_DATA);save();render()}},
    pickzone(){pickedZone=v;document.querySelectorAll('#chips .chip').forEach(c=>c.classList.toggle('on',c.dataset.v===v))},
    blockmin(){S.blockMin=+v;save();document.querySelectorAll('#seg button').forEach(b=>b.classList.toggle('on',+b.dataset.v===S.blockMin))},
    start:startBlock,
    async abandon(){if(await ask('Abandon this session? You lose 15 health and it will not count.',{ok:'Abandon'})){S.active=null;S.hp=Math.max(0,S.hp-15);S.abandons++;keepAwake(false);save();toast('Session abandoned. Tomorrow we go again.');render()}},
    rate(){draftRating=+v;document.querySelectorAll('#rate button').forEach(b=>b.classList.toggle('on',+b.dataset.v===draftRating))},
    discharge(){discharge(false)},
    async skiprecall(){if(await ask('Skip the check-in? You only get half XP.',{ok:'Skip'}))discharge(true)},
    chest:openChest,
    gobreak(){S.brk={end:Date.now()+(S.result.long?15:5)*60000,long:S.result.long};S.result=null;save();render()},
    endbreak:endBreak,
    addboss(){bossForm()},editboss(){bossForm(S.bosses.find(b=>b.id===v))},
    async delboss(){if(await ask('Delete this exam?',{ok:'Delete'})){S.bosses=S.bosses.filter(b=>b.id!==v);S.rewards.forEach(r=>{if(r.bossId===v)r.bossId=null});save();render()}},
    async score(){const b=S.bosses.find(x=>x.id===v);const s=await ask(`Your score on ${b.name} (%)`,{input:true,val:b.score??'',ok:'Save'});
      if(s===null||String(s).trim()===''||isNaN(+s))return;b.score=clamp(+s,0,100);
      if(b.score>=b.targetScore&&!b.defeated){b.defeated=true;addXp(300);save();render();checkAwards();celebrate('Exam passed',`${b.name}. +300 XP.`);return}
      toast(b.score>=b.targetScore?'Score updated':`Logged ${b.score}%. Below target, so let's find the weak spots.`);save();render()},
    submitted(){const b=S.bosses.find(x=>x.id===v);if(!b||b.defeated)return;b.defeated=true;b.score=100;addXp(300);save();render();checkAwards();celebrate('Submitted',`${b.name}. +300 XP.`)},
    pickier(){document.querySelectorAll('#f-tier button').forEach(b=>b.classList.toggle('on',b.dataset.v===v))},
    pickboss(){document.querySelectorAll('#f-boss .chip').forEach(b=>b.classList.toggle('on',b.dataset.v===v))},
    savedboss(){const o={name:$('#f-name').value.trim()||'Untitled exam',date:$('#f-date').value||today(),targetHrs:+$('#f-hrs').value||1,targetScore:+$('#f-score').value||0};
      if(v)Object.assign(S.bosses.find(b=>b.id===v),o);else S.bosses.push({id:'b'+Date.now(),icon:'',...o,min:0,score:null,defeated:false});save();closeDlg();render()},
    closedlg:closeDlg,
    addreward(){rewardForm()},editreward(){rewardForm(S.rewards.find(r=>r.id===v))},
    async delreward(){if(await ask('Delete this reward?',{ok:'Delete'})){S.rewards=S.rewards.filter(r=>r.id!==v);save();render()}},
    savedreward(){const tier=(document.querySelector('#f-tier .on')||{dataset:{v:'common'}}).dataset.v,bossId=(document.querySelector('#f-boss .on')||{dataset:{v:''}}).dataset.v||null;
      const o={name:$('#f-name').value.trim()||'Mystery prize',tier,bossId,hrs:+$('#f-hrs').value||0,score:+$('#f-score').value||0,weekly:+$('#f-weekly').value||0,daily:+$('#f-daily').value||0};
      if(v)Object.assign(S.rewards.find(r=>r.id===v),o);else S.rewards.push({id:'r'+Date.now(),icon:'',...o,claimed:null});save();closeDlg();render()},
    claim(){const r=S.rewards.find(x=>x.id===v),st=rewardState(r);if(!st.unlocked||st.claimed)return;
      if(r.weekly||r.daily)r.claimedKey=st.period;else r.claimed=today();addXp(50);save();render();celebrate('Reward unlocked',`${r.name}. You earned it.`)},
  };
  if(A[act])A[act]();
});
document.addEventListener('input',e=>{if(e.target.id==='dump')updateWC()});
function updateWC(){const d=$('#dump');if(!d)return;const n=d.value.trim()?d.value.trim().split(/\s+/).length:0;
  $('#wc').textContent=`${n} word${n===1?'':'s'}${n<8?`, ${8-n} more to go`:''}`;$('#discharge').disabled=n<8}

/* ---- data.json sync: Claude edits exams, rewards, rotations and targets without touching your progress ---- */
const DEFAULT_DATA=/*DEFAULT_DATA*/{"_help": "Edited by Claude on request. Merged into your saved progress on load: existing ids are updated (XP, hours and scores kept), new ids added, ids in 'remove' deleted. dailyTargets = hours per day per ward.", "bosses": [{"id": "b-endo", "name": "Endocrine Quiz", "icon": "🦋", "date": "2026-11-10", "targetHrs": 21, "targetScore": 80}, {"id": "b-research", "name": "Research Submission", "icon": "📄", "date": "2026-11-11", "targetHrs": 16, "targetScore": 100, "kind": "submit"}, {"id": "b-renal", "name": "Urinary Quiz", "icon": "💧", "date": "2026-12-19", "targetHrs": 20, "targetScore": 80}, {"id": "b-rps", "name": "Reproductive Quiz", "icon": "🧬", "date": "2027-01-26", "targetHrs": 20, "targetScore": 80}, {"id": "b-bmse", "name": "BMSE — FINAL BOSS", "icon": "👹", "date": "2027-02-12", "targetHrs": 166, "targetScore": 70}], "rewards": [{"id": "r-vpn", "icon": "🔐", "name": "The VPN", "tier": "rare", "bossId": "b-endo", "hrs": 18, "score": 80, "weekly": 0, "daily": 0}, {"id": "r-atv", "icon": "📺", "name": "Apple TV box", "tier": "legendary", "bossId": "b-bmse", "hrs": 150, "score": 70, "weekly": 0, "daily": 0}, {"id": "r-coffee", "icon": "☕", "name": "Favourite coffee trip", "tier": "common", "bossId": null, "hrs": 0, "score": 0, "weekly": 10, "daily": 0}, {"id": "r-night", "icon": "🎮", "name": "Guilt-free show / game night", "tier": "common", "bossId": null, "hrs": 0, "score": 0, "weekly": 0, "daily": 5}], "rotations": [], "cards": [], "remove": ["c-de1", "c-de10", "c-de11", "c-de12", "c-de2", "c-de3", "c-de4", "c-de5", "c-de6", "c-de7", "c-de8", "c-de9", "c-seed0", "c-seed1", "c-seed2", "c-seed3", "c-seed4", "c-seed5", "c-seed6", "c-seed7", "c-seed8", "c-seed9"], "dailyTargets": [{"zone": "b-endo", "hrs": 3, "until": "2026-11-09"}, {"zone": "b-research", "hrs": 2, "until": "2026-11-10"}, {"zone": "z-german", "dates": {"2026-11-03": 3, "2026-11-04": 2, "2026-11-05": 3, "2026-11-06": 2, "2026-11-07": 2, "2026-11-08": 2, "2026-11-09": 0.75, "2026-11-10": 0.3, "2026-11-12": 3, "2026-11-13": 3, "2026-11-14": 3, "2026-11-15": 1.5, "2026-11-16": 3, "2026-11-17": 3, "2026-11-18": 3, "2026-11-19": 2, "2026-11-20": 3, "2026-11-21": 3, "2026-11-22": 1.5, "2026-11-23": 3, "2026-11-24": 3, "2026-11-25": 3, "2026-11-26": 3, "2026-11-27": 3, "2026-11-28": 3, "2026-11-30": 3, "2026-12-01": 3, "2026-12-02": 2, "2026-12-03": 3, "2026-12-04": 3, "2026-12-05": 3, "2026-12-07": 3, "2026-12-08": 3, "2026-12-09": 3, "2026-12-10": 3, "2026-12-11": 3, "2026-12-12": 3, "2026-12-13": 1.5, "2026-12-14": 2, "2026-12-15": 3, "2026-12-16": 3, "2026-12-17": 3, "2026-12-18": 3, "2026-12-19": 3, "2026-12-21": 3, "2026-12-22": 3, "2026-12-23": 2, "2026-12-24": 3, "2026-12-25": 3, "2026-12-26": 3, "2026-12-27": 1.5, "2026-12-28": 3, "2026-12-29": 3, "2026-12-30": 3, "2026-12-31": 3, "2027-01-01": 3, "2027-01-02": 3, "2027-01-04": 3, "2027-01-05": 2, "2027-01-06": 3, "2027-01-07": 3, "2027-01-08": 3, "2027-01-09": 3, "2027-01-10": 1.5, "2027-01-11": 3, "2027-01-12": 3, "2027-01-13": 3, "2027-01-14": 3, "2027-01-15": 2, "2027-01-16": 3, "2027-01-17": 1.5, "2027-01-18": 3, "2027-01-19": 3, "2027-01-20": 3, "2027-01-21": 3, "2027-01-23": 3, "2027-01-24": 1.5, "2027-01-25": 3, "2027-01-26": 3, "2027-01-27": 3, "2027-01-28": 3, "2027-01-29": 3, "2027-01-30": 3, "2027-01-31": 1.5}}, {"zone": "z-filters", "hrs": 1, "until": "2026-11-11"}, {"zone": "z-filters", "hrs": 2, "from": "2026-11-12", "until": "2027-02-11"}], "journey": {"zone": "z-german", "name": "Reise nach München", "stops": [{"name": "Berlin Hbf", "hrs": 0}, {"name": "Hannover Hbf", "hrs": 20}, {"name": "Köln Hbf", "hrs": 56}, {"name": "Frankfurt Hbf", "hrs": 106}, {"name": "Stuttgart Hbf", "hrs": 162}, {"name": "München Hbf", "hrs": 225}]}};
function mergeData(d){
  if(!d||typeof d!=='object')return;
  DATA.rotations=Array.isArray(d.rotations)?d.rotations:[];
  if(Array.isArray(d.dailyTargets))DATA.dailyTargets=d.dailyTargets;
  if(d.journey&&Array.isArray(d.journey.stops))DATA.journey=d.journey;
  const rm=new Set(Array.isArray(d.remove)?d.remove:[]);
  S.bosses=S.bosses.filter(b=>!rm.has(b.id));S.rewards=S.rewards.filter(r=>!rm.has(r.id));S.cards=[];
  (d.bosses||[]).forEach(n=>{if(!n||!n.id||rm.has(n.id))return;const o=S.bosses.find(b=>b.id===n.id);
    if(o)Object.assign(o,{name:n.name,date:n.date,targetHrs:n.targetHrs,targetScore:n.targetScore,kind:n.kind});
    else S.bosses.push({min:0,score:null,defeated:false,icon:'',targetHrs:8,targetScore:80,...n})});
  (d.rewards||[]).forEach(n=>{if(!n||!n.id||rm.has(n.id))return;const o=S.rewards.find(r=>r.id===n.id);
    if(o)Object.assign(o,n);else S.rewards.push({tier:'common',bossId:null,hrs:0,score:0,weekly:0,daily:0,claimed:null,...n})});
  save();
}
let SYNC_AT=0;
async function codeCheck(force){
  try{const r=await fetch('app.js',{cache:'no-store'});if(!r.ok)return false;const m=(await r.text()).match(/APP_VERSION\s*=\s*'(\d[^']*)'/);
    if(m&&m[1]!==APP_VERSION&&(force||(!S.active&&!S.recall&&!S.result&&!S.brk))){toast('Updating to the latest version');setTimeout(()=>location.reload(),700);return true}}catch(e){}
  return false}
async function syncData(){
  try{const r=await fetch('data.json',{cache:'no-store'});if(!r.ok)return;mergeData(await r.json());SYNC_AT=Date.now();
    if(!S.active&&!S.recall&&!S.result&&!document.querySelector('dialog[open]'))render()}catch(e){}
}


/* ---- Liquid Glass tab bar: floating pill, sliding glass lens, drag to switch ---- */
const APP_VERSION='2026-11-03.3';
const TABS=[['ward','today','Today'],['shift','focus','Focus'],['boss','exams','Exams'],['vault','wallet','Wallet']];
let lastTab=null;
function renderNav(){
  const n=$('#nav');if(!n)return;
  if(!n.dataset.built){
    n.innerHTML='<i class="lens"></i>'+TABS.map(([id,i,l])=>`<button data-act="tab" data-v="${id}">${ic(i,26)}${l}</button>`).join('');
    n.dataset.built='1';
  }
  const idx=TABS.findIndex(t=>t[0]===S.tab);
  n.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('on',i===idx));
  const lens=n.querySelector('.lens');if(lens&&!n.classList.contains('drag'))lens.style.transform=`translateX(${idx*100}%)`;
}
function pageEnter(app,tab){
  if(lastTab!==null&&lastTab!==tab){
    const dx=(TABS.findIndex(t=>t[0]===tab)-TABS.findIndex(t=>t[0]===lastTab))>0?28:-28;
    app.style.setProperty('--dx',dx+'px');app.classList.remove('enter');void app.offsetWidth;app.classList.add('enter');
    app.addEventListener('animationend',()=>app.classList.remove('enter'),{once:true});
  }
  lastTab=tab;
}
(function(){
  const n=document.getElementById('nav');if(!n)return;
  let sx=0,drag=false,down=false,hover=0,justDragged=false;
  const geo=()=>{const r=n.getBoundingClientRect(),w=r.width-10,lw=w/TABS.length;return{r,w,lw}};
  n.addEventListener('pointerdown',e=>{down=true;drag=false;sx=e.clientX});
  n.addEventListener('pointermove',e=>{
    if(!down)return;
    if(!drag&&Math.abs(e.clientX-sx)>8){drag=true;n.classList.add('drag');try{n.setPointerCapture(e.pointerId)}catch(_){}}
    if(!drag)return;
    const{r,w,lw}=geo();const x=Math.min(Math.max(e.clientX-r.left-5-lw/2,0),w-lw);
    n.querySelector('.lens').style.transform=`translateX(${x}px) scale(1.12)`;
    hover=Math.round(x/lw);n.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('pre',i===hover));
  });
  const end=e=>{
    if(!down)return;down=false;
    if(drag){justDragged=true;setTimeout(()=>justDragged=false,60);
      n.classList.remove('drag');n.querySelectorAll('button').forEach(b=>b.classList.remove('pre'));
      const lens=n.querySelector('.lens');lens.style.transform=`translateX(${hover*100}%)`;
      if(TABS[hover][0]!==S.tab){tap();S.tab=TABS[hover][0];save();render();window.scrollTo(0,0)}
      drag=false}
  };
  n.addEventListener('pointerup',end);n.addEventListener('pointercancel',end);
  document.addEventListener('click',e=>{if(justDragged){e.stopPropagation();e.preventDefault();justDragged=false}},true);
})();


/* ---- Replay: Apple Music Replay-style story cards of your study ---- */
function openReplay(){
  const L=S.log||[],tot=L.reduce((a,x)=>a+(x.min||0),0),days={},zones={};
  L.forEach(x=>{days[x.day]=(days[x.day]||0)+(x.min||0);zones[x.zone]=(zones[x.zone]||0)+(x.min||0)});
  const bestDay=Object.entries(days).sort((a,b)=>b[1]-a[1])[0],topZ=Object.entries(zones).sort((a,b)=>b[1]-a[1])[0];
  const nameOf=id=>{const b=S.bosses.find(q=>q.id===id);if(b)return short(b.name);const e=EXTRA_ZONES.find(q=>q.id===id);return e?short(e.name):'Study'};
  const rated=L.filter(x=>x.rating);const avg=rated.length?rated.reduce((a,x)=>a+x.rating,0)/rated.length:0;
  const r=rank(),n=L.length;
  const cards=[
    ['linear-gradient(160deg,#FF2D6F,#7A1FA2)','Your Replay','Resident Run',n?'Swipe through your study story.':'Finish your first patient to start your story.'],
    ['linear-gradient(160deg,#14D8FF,#0A4DFF)','Focus time',hrs(tot)+' h',`${n} patient${n===1?'':'s'} treated`],
    ['linear-gradient(160deg,#9DFF3A,#0B8A4A)','Top ward',topZ?esc(nameOf(topZ[0])):'None yet',topZ?hrs(topZ[1])+' h of your time':'Pick a ward and start'],
    ['linear-gradient(160deg,#FF9F0A,#FF2D6F)','Best day',bestDay?hrs(bestDay[1])+' h':'None yet',bestDay?esc(fmtDate(bestDay[0])):''],
    ['linear-gradient(160deg,#BF5AF2,#0A84FF)','Streak',S.streak+' days',`Best ever: ${S.best||0} days`],
    ['linear-gradient(160deg,#30D158,#0A84FF)','Rank',esc(r.name),`${S.xp} XP${avg?' · recall average '+avg.toFixed(1)+' of 5':''}`]
  ];
  const el=document.createElement('div');el.className='rply';
  el.innerHTML=`<button class="rplyx" data-act="closereplay" aria-label="Close">Close</button><div class="rplys">${cards.map((c,i)=>`<section style="background:${c[0]}"><small>${c[1]}</small><h2>${c[2]}</h2><p>${c[3]}</p><em>${i+1} / ${cards.length}</em></section>`).join('')}</div>`;
  document.body.appendChild(el);document.body.style.overflow='hidden';
}

/* ---- boot ---- */
mergeData(DEFAULT_DATA);
checkAwards(true);
if(S.active||S.recall||S.result||S.brk)S.tab='shift';
if(S.active&&Date.now()>=S.active.start+S.active.dur)completeBlock();else render();
syncData();codeCheck(false);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){syncData();codeCheck(false)}});
try{if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{})}catch(e){}
