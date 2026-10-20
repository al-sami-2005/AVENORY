(() => {
  'use strict';
  const STORE = 'ninety-track-v1'; // Preserve all Ninety 1–3 local data for a safe VOWMERA migration.
  const FOCUS_KEY = 'ninety-v3-focus-runtime';
  const GUEST_KEY = 'ninety-v3-guest-approved';
  const SESSION_KEY = 'ninety-v3-auth-session';
  const CONFIG = window.NINETY_CLOUD || {};
  const cloudEnabled = /^https:\/\/[^/]+\.supabase\.co$/.test((CONFIG.url||'').replace(/\/$/,'')) && (CONFIG.anonKey||'').length>20;
  const DAY_MS = 86400000;
  const QUOTES = [
    'The life you want is hidden in the hours you protect.',
    'Proof is quieter than promises. Make some today.',
    'One honest action is worth a thousand perfect plans.',
    'Your attention is precious. Spend it like it matters.',
    'Small choices make a remarkable person.',
    'You are allowed to begin again without beginning from zero.',
    'Consistency is a kind of self-respect.',
    'Build a day that your future self can lean on.',
    'You do not need momentum to begin. Beginning creates it.',
    'A difficult moment is not the whole story.',
    'Show up gently. Then show up again.',
    'Quiet progress is still extraordinary progress.',
    'The next good choice is always available.',
    'Learn to trust your actions more than your moods.',
    'Protect your peace. Practice your purpose.',
    'A habit is a vote for the person you are becoming.',
    'What you repeat becomes what you believe about yourself.',
    'Your pace can change. Your direction can stay.',
    'Let the evidence of your effort accumulate.',
    'The goal is growth, not a flawless record.',
    'Look for the next small opening, not the perfect day.',
    'Your future is not an event. It is a practice.',
    'An ordinary Tuesday can change a life.',
    'Progress rewards attention, not pressure.',
    'Be the person who returns to what matters.'
  ];
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const ICONS = new Set(['grid','checks','target','chart','trophy','settings','bell','moon','sun','plus','minus','arrow-left','arrow-right','droplet','brain','shield','leaf','bed','clock','phone','sparkles','book','heart','activity','x','trash','pencil','download','upload','calendar','check','flame','coffee','play','pause','reset','lock','filter','menu']);
  const h = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ico = (id, css = '') => `<svg aria-hidden="true" class="icon ${css}"><use href="#i-${ICONS.has(id) ? id : 'target'}"></use></svg>`;
  function dateLocal(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  function parseDate(s) { const [y,m,d]=String(s).split('-').map(Number); return new Date(y || 2026, (m || 1) - 1, d || 1, 12); }
  function shiftDay(s,n) { const d=parseDate(s); d.setDate(d.getDate()+n); return dateLocal(d); }
  function diffDays(a,b) { return Math.round((Date.UTC(...a.split('-').map((n,i)=>i===1?+n-1:+n))-Date.UTC(...b.split('-').map((n,i)=>i===1?+n-1:+n)))/DAY_MS); }
  function niceDate(date, opts={month:'short',day:'numeric'}) { return parseDate(date).toLocaleDateString(undefined, opts); }
  function durationLabel(num,unit) { const str = Number(num).toLocaleString(undefined,{maximumFractionDigits:2}); return `${str} ${unit || ''}`.trim(); }
  function round(n,p=2){return Math.round((Number(n)||0)*Math.pow(10,p))/Math.pow(10,p);}
  function clamp(n,min,max) { return Math.min(max, Math.max(min,n)); }
  const habitDefaults = (start) => [
    {id:'clear-mind',title:'Clear Mind',caption:'A private promise to yourself',icon:'shield',color:'blue',category:'Mindset',kind:'binary',target:1,unit:'',step:1,days:[0,1,2,3,4,5,6],startDate:start,reminder:'',points:20},
    {id:'added-sugar',title:'No added sugar',caption:'Choose foods that nourish you',icon:'leaf',color:'green',category:'Nutrition',kind:'binary',target:1,unit:'',step:1,days:[0,1,2,3,4,5,6],startDate:start,reminder:'',points:20},
    {id:'junk-food',title:'Skip junk food',caption:'Fuel your energy with intention',icon:'heart',color:'orange',category:'Nutrition',kind:'binary',target:1,unit:'',step:1,days:[0,1,2,3,4,5,6],startDate:start,reminder:'',points:20},
    {id:'hydration',title:'Drink water',caption:'Daily hydration goal',icon:'droplet',color:'blue',category:'Wellness',kind:'min',target:3.5,unit:'L',step:0.25,days:[0,1,2,3,4,5,6],startDate:start,reminder:'11:00'},
    {id:'sleep',title:'Quality sleep',caption:'Rest is productive too',icon:'bed',color:'blue',category:'Wellness',kind:'min',target:7,unit:'hr',step:0.5,days:[0,1,2,3,4,5,6],startDate:start,reminder:'21:30'},
    {id:'meditation',title:'Meditate',caption:'Breathe, then begin again',icon:'brain',color:'green',category:'Mindset',kind:'min',target:10,unit:'min',step:5,days:[0,1,2,3,4,5,6],startDate:start,reminder:'07:30'},
    {id:'social-media',title:'Mindful scrolling',caption:'Log your total screen time',icon:'phone',color:'orange',category:'Focus',kind:'max',target:59,unit:'min',step:15,days:[0,1,2,3,4,5,6],startDate:start,reminder:'20:30'},
    {id:'self-growth',title:'Self-improvement',caption:'Learn or practice a chosen skill',icon:'book',color:'green',category:'Growth',kind:'min',target:60,unit:'min',step:15,days:[0,1,2,3,4,5,6],startDate:start,reminder:'19:00'},
    {id:'deep-work',title:'Deep work',caption:'Focused, meaningful work',icon:'clock',color:'blue',category:'Focus',kind:'min',target:6.5,unit:'hr',step:0.5,days:[0,1,2,3,4,5,6],startDate:start,reminder:'09:00'},
    {id:'movement',title:'Move your body',caption:'Walk, stretch, or exercise',icon:'activity',color:'orange',category:'Wellness',kind:'min',target:30,unit:'min',step:10,days:[0,1,2,3,4,5,6],startDate:start,reminder:''}
  ];
  const templates = [
    {title:'Read every day',caption:'Build a reading rhythm',icon:'book',color:'blue',category:'Growth',kind:'min',target:10,unit:'pages',step:5},
    {title:'Journal',caption:'Write a few honest lines',icon:'pencil',color:'green',category:'Mindset',kind:'binary',target:1,unit:'',step:1},
    {title:'Morning sunlight',caption:'Get outside and reset',icon:'sun',color:'orange',category:'Wellness',kind:'min',target:15,unit:'min',step:5},
    {title:'No late caffeine',caption:'A calmer evening routine',icon:'coffee',color:'orange',category:'Wellness',kind:'binary',target:1,unit:'',step:1},
    {title:'Save some money',caption:'Build financial mindfulness',icon:'target',color:'green',category:'Lifestyle',kind:'binary',target:1,unit:'',step:1},
    {title:'Tidy your space',caption:'A clear space, a clearer mind',icon:'sparkles',color:'blue',category:'Lifestyle',kind:'min',target:10,unit:'min',step:5}
  ];
  function freshState() { const start=dateLocal(); return {
    version:4, settings:{name:'You',startDate:start,theme:'dark',notifications:false,morning:'08:00',evening:'21:00',northStar:'',favoriteQuotes:[],weeklyFocusHours:25},
    habits:habitDefaults(start),projects:[],logs:{},reminded:{},redemptions:[],customRewards:[],focusSessions:[],parkedThoughts:[]
  }; }
  function sanitizeState(raw) {
    if(!raw || !Array.isArray(raw.habits) || !Array.isArray(raw.projects) || !raw.logs || typeof raw.logs!=='object' || !raw.settings || typeof raw.settings!=='object') throw Error('Invalid saved data');
    const fallback=freshState();
    const validDate = (v, fb=dateLocal()) => typeof v==='string' && /^\d{4}-\d\d-\d\d$/.test(v) && dateLocal(parseDate(v))===v ? v : fb;
    const asText=(v,length=120)=>String(v??'').slice(0,length);
    const asId=(v,fb)=>asText(v||fb,90).replace(/[^a-zA-Z0-9_-]/g,'_')||fb;
    const asNum=(v,min,max,fb)=>Number.isFinite(Number(v))?clamp(Number(v),min,max):fb;
    const s=raw.settings;
    const start=validDate(s.startDate,fallback.settings.startDate);
    const settings={name:asText(s.name||'You',35),startDate:start,theme:s.theme==='dark'?'dark':'light',notifications:s.notifications===true,morning:/^([01]\d|2[0-3]):[0-5]\d$/.test(s.morning)?s.morning:'08:00',evening:/^([01]\d|2[0-3]):[0-5]\d$/.test(s.evening)?s.evening:'21:00',northStar:asText(s.northStar||'',150),weeklyFocusHours:asNum(s.weeklyFocusHours,0.5,80,25),favoriteQuotes:Array.isArray(s.favoriteQuotes)?[...new Set(s.favoriteQuotes.map(Number).filter(n=>Number.isInteger(n)&&n>=0&&n<QUOTES.length))].slice(0,30):[]};
    const habits=raw.habits.slice(0,200).filter(x=>x&&typeof x==='object').map((x,i)=>({
      id:asId(x.id,`habit-restored-${i}`),title:asText(x.title||'Untitled habit',70),caption:asText(x.caption||'',120),icon:ICONS.has(x.icon)?x.icon:'target',color:['blue','green','orange'].includes(x.color)?x.color:'blue',category:asText(x.category||'Growth',32),
      kind:['binary','min','max'].includes(x.kind)?x.kind:'binary',target:asNum(x.target,.01,100000,1),unit:asText(x.unit||'',16),step:asNum(x.step,.01,10000,1),
      days:Array.isArray(x.days)?[...new Set(x.days.map(Number).filter(n=>Number.isInteger(n)&&n>=0&&n<=6))]:[0,1,2,3,4,5,6],startDate:validDate(x.startDate,start),reminder:/^([01]\d|2[0-3]):[0-5]\d$/.test(x.reminder)?x.reminder:'',points:[10,20,30].includes(Number(x.points))?Number(x.points):20
    }));
    const projects=raw.projects.slice(0,200).filter(x=>x&&typeof x==='object').map((x,i)=>({
      id:asId(x.id,`project-restored-${i}`),title:asText(x.title||'Untitled project',80),description:asText(x.description||'',350),category:asText(x.category||'Learning',32),icon:ICONS.has(x.icon)?x.icon:'target',
      durationDays:Math.round(asNum(x.durationDays,1,90,30)),dailyMinutes:Math.round(asNum(x.dailyMinutes,5,1440,60)),startDate:validDate(x.startDate,start)
    }));
    const logs={};
    for(const [date,record] of Object.entries(raw.logs).slice(0,2000)){
      if(validDate(date,'')!==date || !record || typeof record!=='object')continue;
      const habitLogs={},projectLogs={};
      if(record.habits&&typeof record.habits==='object')for(const [id,entry] of Object.entries(record.habits).slice(0,250)){
        if(!entry||typeof entry!=='object')continue;
        habitLogs[asId(id,'invalid-habit')]={done:entry.done===true,logged:entry.logged===true,value:asNum(entry.value,0,1000000,0)};
      }
      if(record.projects&&typeof record.projects==='object')for(const [id,minutes] of Object.entries(record.projects).slice(0,250))projectLogs[asId(id,'invalid-project')]=asNum(minutes,0,1000000,0);
      logs[date]={habits:habitLogs,projects:projectLogs,mood:['great','okay','low'].includes(record.mood)?record.mood:'',note:asText(record.note||'',1200)};
    }
    const reminded={};
    if(raw.reminded&&typeof raw.reminded==='object')for(const [key,value] of Object.entries(raw.reminded).slice(-1200))if(value===true&&key.length<160)reminded[asText(key,159)]=true;
    const redemptions=Array.isArray(raw.redemptions)?raw.redemptions.slice(0,1000).filter(x=>x&&typeof x==='object').map((x,i)=>({id:asId(x.id,`redeem-${i}`),rewardId:asId(x.rewardId,'reward'),title:asText(x.title,80),cost:Math.round(asNum(x.cost,0,1000000,0)),date:validDate(x.date,start)})):[];
    const customRewards=Array.isArray(raw.customRewards)?raw.customRewards.slice(0,80).filter(x=>x&&typeof x==='object').map((x,i)=>({id:asId(x.id,`custom-${i}`),title:asText(x.title||'My reward',80),description:asText(x.description||'',180),cost:Math.round(asNum(x.cost,10,100000,200))})):[];
    const focusSessions=Array.isArray(raw.focusSessions)?raw.focusSessions.slice(-5000).filter(x=>x&&typeof x==='object'&&['focus','stopwatch'].includes(x.mode)).map((x,i)=>({id:asId(x.id,`session-${i}`),date:validDate(x.date,start),minutes:asNum(x.minutes,0,1440,0),startedAt:asText(x.startedAt||'',40),target:asText(x.target||'deep-work',100),task:asText(x.task||'',160),mode:x.mode==='stopwatch'?'stopwatch':'focus'})):[];
    const parkedThoughts=Array.isArray(raw.parkedThoughts)?raw.parkedThoughts.slice(-100).filter(x=>x&&typeof x==='object').map((x,i)=>({id:asId(x.id,`thought-${i}`),text:asText(x.text||'',180),date:validDate(x.date,start)})):[];return {version:4,settings,habits,projects,logs,reminded,redemptions,customRewards,focusSessions,parkedThoughts};
  }
  function loadState() { try {
    const raw=localStorage.getItem(STORE); if (!raw) return freshState();
    const x=JSON.parse(raw);
    if (!x || !Array.isArray(x.habits) || !Array.isArray(x.projects) || !x.logs || !x.settings || !/^\d{4}-\d\d-\d\d$/.test(x.settings.startDate)) throw Error('Invalid saved data');
    return sanitizeState(x);
  } catch(e) { console.warn('Using a fresh local tracker:',e); return freshState(); } }
  let state = loadState();
  let ui = {page:'overview',date:dateLocal(),timerMinutes:25,remaining:1500,timerRunning:false,timerEnd:0,focusTarget:'deep-work',insightPeriod:'day',insightPick:'',quoteOffset:0,habitDetail:'',authGate:!localStorage.getItem(GUEST_KEY)};
  let currentStore=STORE;
  let account=null;
  let cloudSession=null;
  let cloudRevision=0;
  let cloudError='';
  let cloudStatus='Local mode';
  let syncTimer=0, syncInFlight=false, unsynced=false, syncCount=0;
  let authBusy=false;
  let timerMode='focus';
  let audioContext=null, ambientSource=null, ambientGain=null;
  const focusPrefs=(()=>{try{return {...{focus:25,short:5,long:15,rounds:4,autoNext:false,sound:true,ambient:'off',volume:.2,presets:[]},...JSON.parse(localStorage.getItem('ninety-v3-focus-prefs')||'{}')}}catch{return {focus:25,short:5,long:15,rounds:4,autoNext:false,sound:true,ambient:'off',volume:.2,presets:[]}}})();
  let focusRun=(()=>{try{return JSON.parse(localStorage.getItem(FOCUS_KEY)||'null')||{mode:'focus',remaining:focusPrefs.focus*60,duration:focusPrefs.focus*60,elapsed:0,running:false,end:0,task:'',target:'deep-work',round:0,startedAt:0}}catch{return {mode:'focus',remaining:focusPrefs.focus*60,duration:focusPrefs.focus*60,elapsed:0,running:false,end:0,task:'',target:'deep-work',round:0,startedAt:0}}})();
  function persistFocus(){try{localStorage.setItem(FOCUS_KEY,JSON.stringify(focusRun));localStorage.setItem('ninety-v3-focus-prefs',JSON.stringify(focusPrefs))}catch{}}

  let toastTimer;
  function save() { try {localStorage.setItem(currentStore,JSON.stringify(state)); if(account){unsynced=true;syncCount++;setCloudMeta({revision:cloudRevision,dirty:true});cloudStatus='Changes waiting to sync';scheduleSync();}} catch(e) { toast('Local storage is unavailable. Export a backup!');} }
  function endDate(){return shiftDay(state.settings.startDate,89);}
  function challengeDay(date=dateLocal()){return clamp(diffDays(date,state.settings.startDate)+1,0,90);}
  function chosenDate(){return clampDate(ui.date);}
  function clampDate(date){ const low=state.settings.startDate, high=shiftDay(state.settings.startDate,89); const maxDate = dateLocal() < high ? dateLocal() : high; return date < low ? low : date > maxDate ? maxDate : date; }
  function scheduled(habit,date){return date>=habit.startDate && parseDate(date).getDay()>=0 && (habit.days||[0,1,2,3,4,5,6]).includes(parseDate(date).getDay());}
  function scheduledHabits(date){return state.habits.filter(x=>scheduled(x,date));}
  function getLog(date){return state.logs[date]||{habits:{},projects:{},note:'',mood:''};}
  function editLog(date){return state.logs[date] ||= {habits:{},projects:{},note:'',mood:''};}
  function habitEntry(habit,date){return (getLog(date).habits||{})[habit.id]||{};}
  function completed(habit,date){const e=habitEntry(habit,date); if(habit.kind==='binary') return !!e.done; if (!e.logged) return !!e.done;return habit.kind==='max' ? Number(e.value)<=Number(habit.target) : Number(e.value)>=Number(habit.target);}
  function dayScore(date){const list=scheduledHabits(date);return {done:list.filter(x=>completed(x,date)).length,total:list.length,pct:list.length?Math.round(list.filter(x=>completed(x,date)).length/list.length*100):0};}
  function challengeDatesToToday(){const total=clamp(diffDays(dateLocal(),state.settings.startDate)+1,0,90);return Array.from({length:total},(_,i)=>shiftDay(state.settings.startDate,i));}
  function projectDaysDone(p){const total=clamp(Number(p.durationDays)||1,1,90);let n=0;for(let i=0;i<total;i++){let dt=shiftDay(p.startDate,i);if(dt>dateLocal())break;if(Number((getLog(dt).projects||{})[p.id]||0)>=Number(p.dailyMinutes))n++;}return n;}
  function projectEligible(p,date){return date>=p.startDate && date<=shiftDay(p.startDate,p.durationDays-1);}
  function habitProgress(habit,date){
    if (!scheduled(habit,date)) return 0;
    const e=habitEntry(habit,date);
    if(habit.kind==='binary')return e.done?1:0;
    if(!e.logged)return e.done?1:0;
    if(habit.kind==='max')return Number(e.value)<=Number(habit.target)?1:0;
    return clamp(Number(e.value||0)/Number(habit.target||1),0,1);
  }
  function xpBreakdown(date){
    if(date<state.settings.startDate||date>endDate()||date>dateLocal())return {habits:0,projects:0,bonus:0,reflection:0,total:0,possible:0};
    const scheduledList=scheduledHabits(date),scores=scheduledList.map(x=>Math.round((x.points||20)*habitProgress(x,date)));
    const habits=scores.reduce((a,b)=>a+b,0),possible=scheduledList.reduce((a,x)=>a+(x.points||20),0);
    let projects=0,projectPossible=0;
    for(const p of state.projects)if(projectEligible(p,date)){projectPossible+=20;projects+=Math.round(20*clamp(Number(getLog(date).projects?.[p.id]||0)/p.dailyMinutes,0,1));}
    const score=dayScore(date),bonus=score.total>0&&score.done===score.total?30:0;
    const rec=getLog(date),reflection=(rec.mood?5:0)+(String(rec.note||'').trim().length>=12?5:0);
    return {habits,projects,bonus,reflection,total:habits+projects+bonus+reflection,possible:possible+projectPossible+30+10};
  }
  function xpTotal(){return challengeDatesToToday().reduce((n,d)=>n+xpBreakdown(d).total,0);}
  function earnedXp(){return xpTotal();}
  function redeemedXp(){return (state.redemptions||[]).reduce((n,r)=>n+Number(r.cost||0),0);}
  function availableXp(){return Math.max(0,earnedXp()-redeemedXp());}
  function todayXp(){return earnedXp();}
  
  function overallStreak(){let date=dateLocal();if(date>endDate())date=endDate();if(date<state.settings.startDate)return 0;
    // Unscheduled rest days do not break a streak. Today's unfinished work may still be in progress.
    while(date>=state.settings.startDate&&!dayScore(date).total)date=shiftDay(date,-1);
    if(date>=state.settings.startDate&&dayScore(date).pct<75)date=shiftDay(date,-1);
    let n=0;while(date>=state.settings.startDate){const score=dayScore(date);if(score.total===0){date=shiftDay(date,-1);continue;}if(score.pct<75)break;n++;date=shiftDay(date,-1);}return n;}
  function bestStreak(){let run=0,best=0;for(const date of challengeDatesToToday()){const score=dayScore(date);if(score.total===0)continue;if(score.pct>=75)run++;else run=0;best=Math.max(best,run);}return best;}
  function habitStreak(habit){let date=dateLocal();if(date>endDate())date=endDate();let checks=0;
    if(scheduled(habit,date)&&!completed(habit,date))date=shiftDay(date,-1);
    for(let i=0;i<90&&date>=state.settings.startDate;i++,date=shiftDay(date,-1)){
      if(!scheduled(habit,date))continue;if(!completed(habit,date))break;checks++;
    }return checks;
  }
  function overallCompletion(){const dates=challengeDatesToToday();let done=0,total=0;for(const date of dates){const s=dayScore(date);done+=s.done;total+=s.total;}return total?Math.round(done/total*100):0;}
  function perfectDays(){return challengeDatesToToday().filter(d=>{const s=dayScore(d);return s.total>0&&s.total===s.done}).length;}
  function allProjectDays(){return state.projects.reduce((n,p)=>n+projectDaysDone(p),0);}
  function stats(){const xp=todayXp();return {xp,level:Math.floor(xp/300)+1,nextXp:xp%300,streak:overallStreak(),consistency:overallCompletion(),done:challengeDatesToToday().length,perfect:perfectDays()};}
  function logHabit(habit,date,data){const log=editLog(date);log.habits[habit.id]=data;save();render();}
  function toggleHabit(id,date=chosenDate()){
    const habit=state.habits.find(h=>h.id===id);if(!habit || !scheduled(habit,date))return;
    const isDone=completed(habit,date);
    if(habit.kind==='binary')logHabit(habit,date,{done:!isDone});
    else logHabit(habit,date,isDone ? {logged:false,value:0}:{logged:true,value:habit.kind==='max'?0:habit.target});
    if(!isDone){ const s=dayScore(date); if(s.total&&s.done===s.total){toast('Perfect day! +30 bonus XP ✨');celebrate();} else toast(`+${habit.points||20} XP • You showed up!`); }
  }
  function addQuantity(id,change,date=chosenDate()){
    const habit=state.habits.find(h=>h.id===id);if(!habit||!scheduled(habit,date)||habit.kind==='binary')return;
    const previous=habitEntry(habit,date);
    const value=round(clamp(Number(previous.value||0)+change,0,100000));
    logHabit(habit,date,{logged:true,value});
  }
  function writeQuantity(id,val,date=chosenDate()){
    const habit=state.habits.find(h=>h.id===id);if(!habit||habit.kind==='binary')return;
    if(val==='') logHabit(habit,date,{logged:false,value:0});
    else {const v=Number(val);if(Number.isFinite(v)&&v>=0) logHabit(habit,date,{logged:true,value:round(v)});}
  }
  function toast(message){ const el=document.getElementById('toast-root');el.innerHTML=`<div class="toast" role="status">${ico('check')}<span>${h(message)}</span></div>`;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.replaceChildren(),3600); }
  const nav=[['overview','grid','Today'],['habits','checks','Habits'],['projects','target','Projects'],['focus','clock','Focus Studio'],['insights','chart','Progress'],['rewards','trophy','Rewards'],['sanctuary','heart','Reset space'],['settings','settings','Settings'],['account','lock','Account']];
  function sideNav(){const day=challengeDay(),st=stats();return `<aside class="sidebar v4-sidebar" aria-label="Primary navigation">
    <div class="brand v4-brand"><div class="brand-symbol v4-brand-symbol" aria-hidden="true">✶</div><div><div class="brand-name">AVENORY<span>.</span></div><div class="brand-tag">BECOME, ONE DAY AT A TIME</div></div></div>
    <div class="v4-sidebar-ritual"><span class="v4-micro-label">YOUR 90-DAY EDITION</span><b>${String(day).padStart(2,'0')} <i>/ 90</i></b><div class="progress-track"><div class="progress-fill" style="width:${day/90*100}%"></div></div><small>Write a story worth repeating.</small></div>
    <div class="nav-group-label">EXPLORE YOUR SPACE</div><div class="nav-list">${nav.map(([p,icon,label])=>`<button type="button" class="nav-item ${ui.page===p?'active':''}" data-nav="${p}" ${ui.page===p?'aria-current="page"':''}>${ico(icon)}<span>${label}</span>${p==='habits'?`<span class="nav-badge">${state.habits.length}</span>`:''}</button>`).join('')}</div>
    <div class="side-lower"><button type="button" class="v4-side-help" data-nav="sanctuary"><span class="v4-micro-label">NEED A RESET?</span><b>Pause. Breathe.<br>Choose again. ↗</b><small>Open your private sanctuary</small></button><div class="side-footer">✳ YOUR PACE. YOUR PROGRESS.<br>ONE DAY AT A TIME.</div></div></aside>`; }
  function mobileNav(){const mobile=['overview','habits','focus','insights','sanctuary'];const labels={overview:'Today',habits:'Habits',focus:'Focus',insights:'Progress',sanctuary:'Reset'};return `<nav class="mobile-nav" aria-label="Primary mobile navigation">${nav.filter(x=>mobile.includes(x[0])).map(([page,icon])=>`<button type="button" data-nav="${page}" class="${ui.page===page?'active':''}" aria-label="${labels[page]}" ${ui.page===page?'aria-current="page"':''}>${ico(icon)}<span>${labels[page]}</span></button>`).join('')}</nav>`; }
  function topbar(){return `<div class="topbar v4-topbar"><span class="top-eyebrow"><span class="v4-status-dot"></span> BUILD YOUR OWN PROOF <span class="v4-top-slash"> / </span> ${h(ui.page.toUpperCase())}</span><div class="top-actions"><span class="pill-date">${ico('calendar','i-sm')} ${h(niceDate(dateLocal(),{weekday:'short',month:'short',day:'numeric'}))}</span><button class="v4-help-quick" data-nav="sanctuary">${ico('heart','i-sm')} Take a pause</button><button class="icon-btn" data-action="theme" aria-label="Toggle light and dark appearance">${ico(state.settings.theme==='dark'?'sun':'moon')}</button><button class="user-dot" data-nav="account" aria-label="Account and synchronization">${h((state.settings.name||'Y').charAt(0).toUpperCase())}</button></div></div>`; }
  function mobileTop(){return `<div class="mobile-top v4-mobile-top"><div class="brand v4-brand"><div class="brand-symbol">✶</div><div class="brand-name">AVENORY<span>.</span></div></div><div class="top-actions"><button class="icon-btn" data-nav="sanctuary" aria-label="Open private sanctuary">${ico('heart')}</button><button class="icon-btn" data-action="open-command" aria-label="Open all features">${ico('menu')}</button></div></div>`; }
  function header(eyebrow,title,sub,action=''){return `<div class="page-head"><div><span class="eyebrow">${eyebrow}</span><h1 class="page-title">${title}</h1><p class="subhead">${sub}</p></div>${action}</div>`;}
  function statCard(label,num,unit,foot,icon,color=''){return `<div class="stat-card"><div class="stat-heading"><span>${label}</span><span class="stat-icon ${color}">${ico(icon)}</span></div><div class="stat-number">${num}<span class="stat-unit">${unit}</span></div><div class="stat-foot">${foot}</div></div>`;}
  const rewardCatalog = [
    {id:'pause',title:'Guilt-free reset',description:'A relaxing break with zero guilt.',cost:120,emoji:'🌿'},
    {id:'film',title:'Movie night',description:'Watch a film you love.',cost:300,emoji:'🎬'},
    {id:'experience',title:'Small adventure',description:'Plan a budget-friendly outing.',cost:500,emoji:'🗺️'},
    {id:'treat',title:'Personal treat',description:'Choose something kind for yourself.',cost:750,emoji:'🎁'}
  ];
  function formatDelta(n){return n>0?`+${n}`:String(n);}
  function compareWindow(days,offset=0){
    const end=shiftDay(dateLocal(),-offset), start=shiftDay(end,-(days-1));
    let total=0,done=0,xp=0,valid=0,perfect=0;
    for(let i=0;i<days;i++){const d=shiftDay(start,i);if(d<state.settings.startDate||d>endDate()||d>dateLocal())continue;
      const sc=dayScore(d);if(sc.total){total+=sc.total;done+=sc.done;valid++;if(sc.done===sc.total)perfect++;}xp+=xpBreakdown(d).total;
    }
    return {pct:total?Math.round(100*done/total):0,total,done,xp,valid,perfect};
  }
  function comparisonDays(){return ui.insightPeriod==='week'?7:ui.insightPeriod==='month'?30:90;}
  function progressRing(pct,size=130,stroke=11,caption='COMPLETE'){
    const r=(size-stroke)/2,c=2*Math.PI*r;
    return `<div class="ring-wrap" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${pct}% complete"><circle cx="${size/2}" cy="${size/2}" r="${r}" stroke="var(--line)" fill="none" stroke-width="${stroke}"/><circle cx="${size/2}" cy="${size/2}" r="${r}" stroke="var(--accent)" fill="none" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${round(c*(1-pct/100),2)}" transform="rotate(-90 ${size/2} ${size/2})" class="ring-arc"/></svg><div class="ring-middle"><b>${pct}%</b><small>${caption}</small></div></div>`;
  }
  function rewardMilestones(){const st=stats(),pdays=allProjectDays();return [
    ['First step','Complete your first habit',st.xp>=10,'checks','One habit'],
    ['Clean sweep','Complete one perfect day',st.perfect>=1,'sparkles','1 perfect day'],
    ['Week warrior','Complete 7 consistent days in a row',bestStreak()>=7,'flame','7-day streak'],
    ['Momentum','Collect 500 lifetime XP',st.xp>=500,'trophy','500 XP'],
    ['Curious mind','Finish 7 growth project days',pdays>=7,'book','7 project days'],
    ['One thousand','Earn 1,000 lifetime XP',st.xp>=1000,'target','1,000 XP'],
    ['Thirty strong','Complete 30 consistent days in a row',bestStreak()>=30,'calendar','30-day streak'],
    ['Day ninety','Reach the final challenge day',challengeDay()>=90,'shield','90 days'],
    ['Perfect ten','Complete 10 perfect days',st.perfect>=10,'heart','10 perfect days'],
    ['Mastery','Earn 5,000 lifetime XP',st.xp>=5000,'trophy','5,000 XP'],
    ['Reflection habit','Record reflections on 14 days',challengeDatesToToday().filter(d=>String(getLog(d).note||'').trim().length>=12).length>=14,'brain','14 reflections'],
    ['Growth machine','Complete 30 project days',pdays>=30,'book','30 project days'],
    ['First flow','Finish your first focused session',(state.focusSessions||[]).length>=1,'clock','1 session'],
    ['Focus architect','Finish 14 focused sessions',(state.focusSessions||[]).length>=14,'target','14 sessions'],
    ['Hundred-hour club','Complete 100 hours of logged focus time',(state.focusSessions||[]).reduce((n,x)=>n+Number(x.minutes||0),0)>=6000,'flame','100 focus hours']
  ];}
  function littleWins(){const current=compareWindow(7),previous=compareWindow(7,7);return current.pct-previous.pct;}
  function dailyXpCard(){const d=chosenDate(),xp=xpBreakdown(d),balance=availableXp(),sc=dayScore(d);
    return `<div class="card xp-daily-card"><div class="section-header"><div><span class="mini-eyebrow">TODAY'S MOTIVATION</span><h3 class="section-title">Earned through action</h3></div><span class="xp-spark">✦ ${xp.total} XP</span></div>
    <div class="daily-hero-meter">${progressRing(sc.pct,124,10,'HABITS')}<div><b class="daily-xp-number">${xp.total}<span> XP</span></b><p>${xp.possible?`${Math.max(0,xp.possible-xp.total)} points still possible today`:'Your habits are waiting for you.'}</p><span class="small-chip">${sc.done} / ${sc.total} habits completed</span></div></div>
    <div class="xp-breakdown">${[['Habits',xp.habits],['Projects',xp.projects],['Perfect-day bonus',xp.bonus],['Reflection',xp.reflection]].map(([label,n])=>`<div><span>${label}</span><strong>+${n}</strong></div>`).join('')}</div><button class="text-link" data-nav="rewards">${balance} XP available to spend ${ico('arrow-right','i-sm')}</button></div>`;
  }
  function trendInsight(){const now=compareWindow(7),prev=compareWindow(7,7),delta=now.pct-prev.pct;
    const ranked=state.habits.map(habit=>{let total=0,done=0;for(const d of challengeDatesToToday())if(scheduled(habit,d)){total++;if(completed(habit,d))done++;}return {habit,score:total?Math.round(done/total*100):0,total};}).filter(x=>x.total).sort((a,b)=>a.score-b.score);
    const weak=ranked[0],strong=ranked[ranked.length-1];
    return `<div class="card coach-card"><div class="section-header"><div><span class="mini-eyebrow">PROGRESS COACH</span><h3 class="section-title">Your week in perspective</h3></div>${ico('sparkles')}</div><div class="coach-score"><strong class="${delta>=0?'up':'down'}">${formatDelta(delta)}<span>%</span></strong><p>7-day consistency ${delta>=0?'above or equal to':'below'} the previous 7 days.</p></div>
    <div class="coach-details"><div><span>YOUR BRIGHT SPOT</span><strong>${h(strong?.habit.title||'Your first check-in')}</strong><small>${strong?strong.score+'% consistency':'Start tracking to reveal patterns'}</small></div><div><span>GENTLE FOCUS</span><strong>${h(weak?.habit.title||'Start with one habit')}</strong><small>${weak?weak.score+'% consistency':'Small wins count'}</small></div></div><button class="btn btn-neutral btn-wide" data-nav="insights">Explore all your trends ${ico('arrow-right','i-sm')}</button></div>`;
  }
  function celebrate(){if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const root=document.getElementById('celebration-root');if(!root)return;
    root.innerHTML=Array.from({length:24},(_,i)=>`<i style="--i:${i};--x:${(i*37)%90+5}vw;--delay:${(i%5)*55}ms;--color:${['#8b79ef','#5cbf96','#f7ad72'][i%3]}"></i>`).join('');setTimeout(()=>root.replaceChildren(),1800);
  }
  function notificationsStatus(){
    if(!('Notification' in window))return 'Notifications unavailable in this browser';
    if(Notification.permission==='denied')return 'Notifications blocked in browser settings';
    if(Notification.permission==='granted')return state.settings.notifications?'On-page reminders enabled':'Permission granted • reminders paused';
    return 'Permission not requested';
  }
  function testNotification(){if(!state.settings.notifications||!('Notification' in window)||Notification.permission!=='granted'){toast('Enable browser notifications first in Settings.');return;}void systemNotify('AVENORY · Test reminder','A small step today is real progress.');toast('Test notification sent to your device (if supported).');}
  function customRewardModal(){modal(`<div class="modal-titlebar"><h2>Create a personal reward</h2><button class="icon-btn" data-action="close-modal" aria-label="Close">${ico('x')}</button></div><form id="reward-form"><div class="field"><label for="r-title">Reward name</label><input id="r-title" class="input" name="title" required maxlength="80" placeholder="e.g. Visit a new café"></div><div class="field"><label for="r-desc">Why is it meaningful? (optional)</label><input id="r-desc" class="input" name="description" maxlength="180" placeholder="Something that feels rewarding"></div><div class="field"><label for="r-cost">Cost in XP (50–10000)</label><input id="r-cost" class="input" type="number" name="cost" min="50" max="10000" step="10" required value="250"></div><div class="modal-footer"><button class="btn btn-neutral" data-action="close-modal" type="button">Cancel</button><button class="btn btn-primary" type="submit">Add my reward</button></div></form>`);}
  function redeemReward(id){const rw=[...rewardCatalog,...(state.customRewards||[])].find(x=>x.id===id);if(!rw)return;
    if(availableXp()<rw.cost){toast('Not enough XP yet. Keep earning!');return;}
    if(!confirm(`Redeem ${rw.cost} XP for “${rw.title}”? Your lifetime XP stays on your achievements.`))return;
    (state.redemptions||= []).push({id:newId('redeem'),rewardId:rw.id,title:rw.title,cost:rw.cost,date:dateLocal()});save();render();celebrate();toast(`Reward redeemed: ${rw.title}! 🎉`);
  }
  function monthBlocks(){const blocks=[];for(let i=0;i<3;i++){let d=0,t=0,xp=0;for(let j=i*30;j<(i+1)*30;j++){const date=shiftDay(state.settings.startDate,j);if(date>dateLocal()||date>endDate())continue;const z=dayScore(date);d+=z.done;t+=z.total;xp+=xpBreakdown(date).total;}
    blocks.push({label:`Days ${i*30+1}–${(i+1)*30}`,done:d,total:t,pct:t?Math.round(d/t*100):0,xp});}return blocks;}
  function weeklyBlocks(){const blocks=[];for(let i=0;i<13;i++){let done=0,total=0,xp=0;for(let j=i*7;j<Math.min(90,(i+1)*7);j++){let date=shiftDay(state.settings.startDate,j);if(date>dateLocal())continue;const z=dayScore(date);done+=z.done;total+=z.total;xp+=xpBreakdown(date).total;}blocks.push({label:`W${i+1}`,done,total,pct:total?Math.round(done/total*100):0,xp});}return blocks;}
  function periodChart(){const mode=ui.insightPeriod||'week',days=mode==='day'?14:mode==='week'?7:mode==='month'?30:90;
    let rows=[];
    if(mode==='day')rows=Array.from({length:14},(_,i)=>{const dt=shiftDay(dateLocal(),i-13),inBounds=dt>=state.settings.startDate&&dt<=endDate();let z=inBounds?dayScore(dt):{total:0,done:0,pct:0};return {label:niceDate(dt,{month:'short',day:'numeric'}),date:dt,pct:z.pct,total:z.total,done:z.done,xp:xpBreakdown(dt).total};});
    if(mode==='week')rows=weeklyBlocks();
    if(mode==='month')rows=monthBlocks();
    if(mode==='all')rows=monthBlocks();
    const filtered=rows.filter(x=>x.total>0);
    const selection=ui.insightPick||'';
    const selected=rows.find(x=>x.label===selection||x.date===selection)||filtered.at(-1);
    return `<div class="card explorer-card"><div class="section-header explorer-top"><div><span class="mini-eyebrow">TIME MACHINE</span><h2 class="section-title">Compare every chapter</h2><p class="section-sub">Tap a bar for its exact score. Empty periods aren't counted.</p></div><div class="segmented" role="group" aria-label="Progress chart range">${[['day','Days'],['week','Weeks'],['month','Months']].map(([v,t])=>`<button data-range="${v}" class="${mode===v?'active':''}" aria-pressed="${mode===v}">${t}</button>`).join('')}</div></div>
    <div class="period-bars ${mode==='day'?'day-bars':mode==='week'?'week-bars':'month-bars'}" role="group" aria-label="Progress over time">${rows.map(x=>`<button class="period-bar ${selected===x?'selected':''}" data-pick="${h(x.date||x.label)}" ${!x.total?'disabled':''} title="${h(x.label)}: ${x.done}/${x.total} • ${x.pct}% • ${x.xp} XP"><span class="bar-pct">${x.total?x.pct+'%':''}</span><span class="period-column"><span style="height:${Math.max(x.total?x.pct:0,2)}%"></span></span><small>${h(mode==='day'?x.label.split(' ').at(-1):x.label)}</small></button>`).join('')}</div>
    <div class="period-detail">${selected?`<div><span class="mini-eyebrow">SELECTED PERIOD</span><h3>${h(selected.label)}</h3></div><div><strong>${selected.pct}%</strong><small>${selected.done} / ${selected.total} check-ins</small></div><div><strong>${selected.xp} XP</strong><small>earned in this period</small></div>${selected.date?`<button class="btn btn-neutral btn-sm" data-jump-day="${selected.date}">Open day ${ico('arrow-right','i-sm')}</button>`:''}`:'<p>Check off your first habit to see charts and comparisons.</p>'}</div></div>`;
  }
  function journeyStrip(){const st=stats(),day=challengeDay(),score=dayScore(chosenDate());return `<section class="journey-ribbon" aria-label="Challenge progress"><div><span class="mini-eyebrow">90-DAY CHALLENGE</span><h2>${day}<span>/90</span> <small>days on your journey</small></h2></div><div class="journey-main"><div class="ribbon-label"><span>Journey timeline</span><strong>${Math.round(day/90*100)}%</strong></div><div class="progress-track" role="progressbar" aria-valuenow="${day}" aria-valuemin="0" aria-valuemax="90" aria-label="Challenge days"><div class="progress-fill" style="width:${round(day/90*100)}%"></div></div><div class="ribbon-sub"><span>START · ${niceDate(state.settings.startDate)}</span><span>FINISH · ${niceDate(endDate())}</span></div></div><div class="ribbon-total"><span>Today</span><b>${score.pct}%</b><small>${score.done}/${score.total} complete</small></div></section>`;}
  function quickWins(){const today=chosenDate(),sc=dayScore(today),dateFmt=today===dateLocal()?'TODAY':niceDate(today).toUpperCase();return `<div class="micro-status"><span class="status-pulse"></span><span>${dateFmt} · ${sc.done} of ${sc.total} check-ins</span><strong>${xpBreakdown(today).total} XP earned</strong></div>`;}

  function miniWeek(){const date=parseDate(dateLocal());const mon=shiftDay(dateLocal(),-(date.getDay()+6)%7);const days=Array.from({length:7},(_,i)=>shiftDay(mon,i));return `<div class="card weekday-card"><div class="section-header"><div><h3 class="section-title">This week</h3><p class="section-sub">A little better, every day.</p></div>${ico('calendar')}</div><div class="mini-days">${days.map(d=>{const s=dayScore(d);const future=d>dateLocal()||d<state.settings.startDate;return `<div class="mini-day"><small>${DAYS[parseDate(d).getDay()].charAt(0)}</small><div title="${niceDate(d)}: ${future?'Not tracked yet':`${s.done}/${s.total} habits`}" class="day-circle ${future?'':s.pct>=75?'hit':s.done?'partial':''} ${d===dateLocal()?'today':''}">${future?'·':s.pct>=75?ico('check','i-sm'):parseDate(d).getDate()}</div></div>`}).join('')}</div></div>`;}
  function habitRow(habit,date){const e=habitEntry(habit,date);const done=completed(habit,date);const raw=Number(e.value||0);
    let controls='';
    if(habit.kind==='min')controls=`<div class="habit-actions"><button class="step-btn" data-qty="${h(habit.id)}" data-change="-${habit.step}" aria-label="Decrease ${h(habit.title)}">${ico('minus','i-sm')}</button><span class="step-value" data-quick-qty="${h(habit.id)}" role="button" tabindex="0" title="Tap to enter exact amount" aria-label="${durationLabel(e.logged?raw:0,habit.unit)} · Tap to enter exact amount">${durationLabel(e.logged?raw:0,habit.unit)}</span><button class="step-btn" data-qty="${h(habit.id)}" data-change="${habit.step}" aria-label="Increase ${h(habit.title)}">${ico('plus','i-sm')}</button></div>`;
    if(habit.kind==='max') controls=`<div class="habit-actions"><label class="sr-only" for="quantity-${h(habit.id)}">${h(habit.title)} ${h(habit.unit)}</label><input class="num-field" id="quantity-${h(habit.id)}" type="number" inputmode="decimal" min="0" step="${habit.step}" data-qty-input="${h(habit.id)}" value="${e.logged?raw:''}" placeholder="log"><span class="habit-amount">${h(habit.unit)}</span></div>`;
    return `<div class="habit-row ${done?'done':''}" data-habit-row="${h(habit.id)}"><div class="habit-symbol ${h(habit.color)}">${ico(habit.icon)}</div><div><div class="habit-name">${h(habit.title)}<span class="xp-mini">+${habit.points||20} XP</span></div><p class="habit-detail">${h(habit.kind==='binary'?habit.caption:`${habit.kind==='max'?'≤':'≥'} ${durationLabel(habit.target,habit.unit)} · ${habit.caption}`)}</p><div class="tiny-progress" aria-label="${Math.round(habitProgress(habit,date)*100)}% of goal"><span style="width:${Math.round(habitProgress(habit,date)*100)}%"></span></div></div>${controls}<button class="tick ${done?'done':''}" data-toggle="${h(habit.id)}" title="${done?'Mark incomplete':'Mark complete'}" aria-label="${done?'Uncheck':'Check'} ${h(habit.title)}" aria-pressed="${done}">${ico('check')}</button></div>`;
  }
  function todayHabits(){const date=chosenDate(),score=dayScore(date),today=dateLocal();return `<div class="card habits-card"><div class="section-header" style="padding-bottom:3px"><div><h3 class="section-title">Daily essentials</h3><p class="section-sub">Track your promises, one tap at a time.</p></div><span class="completion-tag">${score.done} / ${score.total} done</span></div>
    <div class="section-header" style="margin:0 0 9px"><div class="day-nav"><button data-action="prev-day" aria-label="Previous day" ${date<=state.settings.startDate?'disabled':''}>${ico('arrow-left','i-sm')}</button><span>${date===today?'Today':niceDate(date,{month:'short',day:'numeric'})}</span><button data-action="next-day" aria-label="Next day" ${date>=today||date>=endDate()?'disabled':''}>${ico('arrow-right','i-sm')}</button></div><button class="text-link" data-nav="habits">Manage ${ico('arrow-right','i-sm')}</button></div>
    ${scheduledHabits(date).length ? scheduledHabits(date).map(x=>habitRow(x,date)).join(''):`<div class="empty-state">${ico('calendar')}<h3>No habits scheduled</h3><p>You have a free day. Enjoy your reset, or add a habit.</p><button data-action="add-habit" class="btn btn-primary">Add a habit</button></div>`}
    <div class="daily-progress"><div class="bar-labels"><b>Today's progress</b><span>${score.pct}% complete</span></div><div class="progress-track"><div class="progress-fill" style="width:${score.pct}%"></div></div></div></div>`;}
  function reflection(){const log=getLog(chosenDate());return `<div class="card reflection-card"><div class="section-header"><div><h3 class="section-title">Daily check-in</h3><p class="section-sub">How are you feeling?</p></div>${ico('heart')}</div><div class="moods">${[['great','😊','Great'],['okay','😌','Okay'],['low','🌧️','Low']].map(([v,emoji,label])=>`<button class="mood ${log.mood===v?'active':''}" data-mood="${v}" aria-pressed="${log.mood===v}"><span class="face">${emoji}</span>${label}</button>`).join('')}</div><label class="field-label" for="day-note">One thought from today</label><textarea id="day-note" class="textarea" data-note placeholder="A win, a lesson, or something you're grateful for...">${h(log.note||'')}</textarea><div class="form-hint">Saved when you finish editing. Notes stay on this device in guest mode or in your account when cloud sync is enabled.</div></div>`;}
  function focusMini(){const p=state.projects.find(p=>projectEligible(p,chosenDate()))||state.projects[0];const goal=state.habits.find(h=>h.id==='self-growth'),growthDone=goal&&habitEntry(goal,chosenDate()).logged?Number(habitEntry(goal,chosenDate()).value||0):0;
    return `<div class="focus-mini"><div class="section-header"><div><h3 class="section-title">Your growth hour</h3><p class="section-sub">Protect time for what matters.</p></div><span class="stat-icon">${ico('sparkles')}</span></div><div class="mini-feature"><div class="mini-feature-icon">${ico(p?'target':'book','i-lg')}</div><div><p class="mini-feature-title">${h(p?p.title:'Choose a skill to master')}</p><p class="mini-feature-sub">${h(p?`${p.durationDays}-day growth project`:'Define your next personal project')}</p></div></div><div class="mini-focus-goal"><div><span>TODAY'S GROWTH TIME</span><br><strong>${growthDone} <span class="muted" style="font-size:12px">/ ${goal?goal.target:60} min</span></strong></div><span class="stat-icon green">${ico('target')}</span></div><button class="btn btn-primary btn-wide" data-nav="${p?'focus':'projects'}">${p?'Start a focus session':'Create a growth project'} ${ico('arrow-right','i-sm')}</button></div>`;}
  // VOWMERA design system: quote rituals, journey map, honest pattern analytics.
  function currentQuoteIndex(){return ((challengeDay()||1)-1+QUOTES.length)%QUOTES.length;}
  function quoteInlay(kind='day'){
    const idx=kind==='day'?currentQuoteIndex():kind==='focus'?3:kind==='sanctuary'?9:((currentQuoteIndex()+5)%QUOTES.length);
    const fav=(state.settings.favoriteQuotes||[]).includes(idx);
    return `<div class="v4-quote-inlay"><div class="v4-quote-glyph" aria-hidden="true">“</div><div><span class="v4-micro-label">${kind==='focus'?'A THOUGHT FOR YOUR SESSION':kind==='sanctuary'?'WHEN THINGS FEEL DIFFICULT':'A NOTE TO YOUR FUTURE SELF'}</span><p>${h(QUOTES[idx])}</p></div><button data-favorite-quote="${idx}" class="v4-quote-save ${fav?'saved':''}" aria-label="${fav?'Remove quote from':'Save quote to'} your favorites" aria-pressed="${fav}" title="${fav?'Unsave':'Save'} this thought">${fav?'♥':'♡'}</button></div>`;
  }
  function ninetyAtlas(compact=false){const from=state.settings.startDate;let completedDays=0;
    const dots=Array.from({length:90},(_,i)=>{const date=shiftDay(from,i),future=date>dateLocal()||date>endDate(),score=dayScore(date);if(!future && score.pct>=75)completedDays++;
      const cls=future?'future':score.pct>=100?'perfect':score.pct>=75?'strong':score.pct>0?'partial':'empty';
      return `<button type="button" ${future?'disabled':''} class="v4-star ${cls} ${date===dateLocal()?'today':''}" data-jump-day="${date}" aria-label="${future?'Upcoming':niceDate(date)+', '+score.pct+'% complete'}" title="Day ${i+1} · ${niceDate(date)}${future?' · upcoming':' · '+score.pct+'%'}"><span class="sr-only">Day ${i+1}</span></button>`;}).join('');
    return `<section class="v4-atlas ${compact?'compact':''}"><div class="v4-atlas-heading"><div><span class="v4-micro-label">YOUR LIVING TIMELINE</span><h3>90 days. A thousand small decisions.</h3></div><span class="v4-atlas-count">${completedDays}<small> STRONG DAYS</small></span></div><div class="v4-atlas-grid" role="group" aria-label="90-day journey calendar">${dots}</div><div class="v4-atlas-chapters"><span><i>01</i> IGNITION</span><span><i>02</i> MOMENTUM</span><span><i>03</i> BECOMING</span></div><div class="v4-atlas-legend"><span><b class="v4-key empty"></b> Not logged</span><span><b class="v4-key partial"></b> Started</span><span><b class="v4-key strong"></b> 75%+</span><span><b class="v4-key perfect"></b> Perfect</span></div></section>`;
  }
  function weekRhythm(){const days=['S','M','T','W','T','F','S'],now=dateLocal(),totals=days.map((_,day)=>({day,n:0,count:0}));
    for(const date of challengeDatesToToday()) {const score=dayScore(date);if(!score.total)continue;const obj=totals[parseDate(date).getDay()];obj.n+=score.pct;obj.count++;}
    const sample=totals.reduce((n,d)=>n+d.count,0);
    const best=totals.filter(x=>x.count>=2).sort((a,b)=>b.n/b.count-a.n/a.count)[0];
    return `<div class="card v4-rhythm"><div class="v4-card-heading"><div><span class="v4-micro-label">FIND YOUR NATURAL RHYTHM</span><h3>Days of your week</h3></div><span>${sample} DAYS</span></div><div class="v4-week-bars">${totals.map(x=>{const pct=x.count?Math.round(x.n/x.count):0;return `<div class="v4-week-col" title="${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][x.day]}: ${x.count?pct+'%':'No history'}"><div><span style="height:${x.count?Math.max(3,pct):0}%"></span></div><small>${days[x.day]}</small></div>`}).join('')}</div><p class="v4-chart-note">${sample<14?'Patterns get more useful after about two weeks of check-ins.':best?`${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][best.day]} is currently your strongest day. Look for repeatable conditions, not blame.`:'More days will reveal your rhythm.'} Averages describe your logs, not a prediction.</p></div>`;
  }
  function smartSignal(){const now=compareWindow(7),prev=compareWindow(7,7),trend=now.pct-prev.pct;
    const growth=state.projects.find(p=>projectEligible(p,chosenDate()));const behind=state.habits.filter(habit=>scheduled(habit,chosenDate())&&!completed(habit,chosenDate()));
    let title,copy;
    if(now.done===0&&prev.done===0){title='Everything begins with one mark.';copy='Choose one habit that takes less than five minutes. Make it real, then build from there.';}
    else if(now.valid<3){title='Your story is still opening.';copy='Collect a few honest check-ins before judging your progress.';}
    else if(trend>5){title='You are building momentum.';copy=`Your last seven days are ${trend} percentage points stronger than the week before. Protect what is working.`;}
    else if(trend< -5){title='A softer reset may help.';copy='Your consistency dipped. Try reducing the size of your next step instead of abandoning the habit.';}
    else{title='The quiet work is adding up.';copy='Your rhythm is relatively steady. Choose one area to sharpen without overloading your day.';}
    return `<div class="v4-signal"><div class="v4-signal-top"><span class="v4-micro-label">YOUR PERSONAL SIGNAL</span><span aria-hidden="true">✦</span></div><h3>${h(title)}</h3><p>${h(copy)}</p><div class="v4-signal-line"><span>${behind.length} rituals waiting</span><span>${growth?h(growth.title):'Your next chapter'}</span></div></div>`;
  }
  function insightOverview(){const st=stats(),w=compareWindow(7),prev=compareWindow(7,7),m=compareWindow(30),before=compareWindow(30,30),toSign=n=>n>0?`+${n}`:String(n);
    return `<section class="v4-insights-overview"><div class="v4-performance-list">${[['PAST 7 DAYS',w.pct,toSign(w.pct-prev.pct)+' pp vs previous week'],['PAST 30 DAYS',m.pct,toSign(m.pct-before.pct)+' pp vs previous 30 days'],['90-DAY CONSISTENCY',st.consistency,'Across your tracked challenge']].map(([label,value,meta])=>`<div><span class="v4-micro-label">${label}</span><strong>${value}<i>%</i></strong><small>${meta}</small><div class="v4-thin-progress"><i style="width:${value}%"></i></div></div>`).join('')}</div><p class="v4-chart-note">“pp” means percentage points. Current periods may be incomplete; comparisons are descriptive, not forecasts.</p></section>`;
  }
  function sanctuaryPage(){const log=getLog(chosenDate()),fav=state.settings.favoriteQuotes||[];return `${header('YOUR QUIET PLACE','Make space to choose.','A private pause when motivation fades or an urge feels loud.',`<button class="btn btn-neutral" data-nav="overview">${ico('arrow-left','i-sm')} Back to today</button>`)}
  <section class="v4-sanctuary-hero"><div class="v4-micro-label">THE PAUSE PROTOCOL · NO SHAME, JUST CHOICE</div><h2>You are more than<br><em>one difficult moment.</em></h2><p>Pause what you are doing. Unclench your shoulders. Give yourself one minute before you decide what happens next.</p><button class="btn btn-primary" data-action="breathe" aria-label="Start guided breathing pause">${ico('heart','i-sm')} Begin a 60-second reset</button><div class="v4-soft-orbit" aria-hidden="true"><div>✳</div></div></section>
  ${quoteInlay('sanctuary')}
  <div class="v4-coping-grid">${[['01','CHANGE YOUR SPACE','Step away from the screen and move somewhere different.'],['02','BREATHE FIRST','Inhale softly for four, hold four, exhale for six. Repeat without forcing it.'],['03','REPLACE THE LOOP','Stretch, drink water, walk, or start a two-minute task.'],['04','RETURN WITHOUT BLAME','One hard moment does not erase every choice you made before it.']].map(([n,title,copy])=>`<article class="v4-coping-card"><span>${n}</span><h3>${title}</h3><p>${copy}</p></article>`).join('')}</div>
  <section class="card v4-favorites"><div class="section-header"><div><span class="v4-micro-label">YOUR PERSONAL LIBRARY</span><h3 class="section-title">Words you chose to keep</h3></div></div>${fav.length?fav.map(i=>`<blockquote><p>“${h(QUOTES[i])}”</p><button data-favorite-quote="${i}" aria-label="Remove from saved quotes">Remove ♥</button></blockquote>`).join(''):'<p class="section-sub">Save any thought using the heart beside it. Your favorites will appear here.</p>'}</section>
  <div class="v4-reminder-boundary">This space offers self-guided reflection, not clinical treatment or content blocking. It keeps your existing “Clear Mind” label discreet, and you can always edit or remove that habit.</div>`; }
  function commandSheet(){return `<div class="v4-command-backdrop" data-command-close><div class="v4-command-modal" role="dialog" aria-modal="true" aria-label="All features"><div class="v4-command-head"><div><span class="v4-micro-label">YOUR ENTIRE SPACE</span><h2>Where to next?</h2></div><button class="icon-btn" data-action="close-command" aria-label="Close feature menu">${ico('x')}</button></div><div class="v4-command-items">${nav.map(([p,icon,label])=>`<button type="button" data-nav="${p}">${ico(icon)}<span>${label}</span>${ico('arrow-right','i-sm')}</button>`).join('')}</div><p>TIP · Press <kbd>/</kbd> to open this menu from anywhere.</p></div></div>`; }
  function openCommand(){lastActiveElement=document.activeElement;document.getElementById('command-root').innerHTML=commandSheet();document.querySelector('.v4-command-modal [data-nav]')?.focus();}
  function closeCommand(){document.getElementById('command-root').replaceChildren();if(lastActiveElement&&typeof lastActiveElement.focus==='function'){try{lastActiveElement.focus();}catch{}lastActiveElement=null;}}
  let breathHandle=null,breathEnd=0;
  function breathModal(){clearInterval(breathHandle);breathEnd=Date.now()+60000;
    modal(`<div class="v4-breath-modal"><span class="v4-micro-label">YOUR PRIVATE PAUSE · 60 SECONDS</span><button class="icon-btn v4-breath-close" data-action="close-modal" aria-label="Close breathing guide">${ico('x')}</button><h2>Make room for a better choice.</h2><p>Slow your breathing. No score, no judgment, no pressure.</p><div class="v4-breath-disc" id="breath-disc"><strong id="breath-label">Breathe in</strong><small id="breath-clock">60s</small></div><p id="breath-description" aria-live="polite">Gently inhale through your nose.</p><button type="button" class="btn btn-primary" data-action="breath-finish">I'm ready to continue</button></div>`);
    const tick=()=>{const time=Math.max(0,Math.ceil((breathEnd-Date.now())/1000));const el=document.getElementById('breath-disc');if(!el){clearInterval(breathHandle);return;}const cycle=(60-time)%14;const phase=cycle<4?'inhale':cycle<8?'hold':'exhale';el.dataset.phase=phase;document.getElementById('breath-label').textContent=phase==='inhale'?'Breathe in':phase==='hold'?'Hold gently':'Breathe out';document.getElementById('breath-description').textContent=phase==='inhale'?'Breathe in slowly for four.':phase==='hold'?'Pause gently.':'Let your breath out for six.';document.getElementById('breath-clock').textContent=`${time}s`;if(time===0){clearInterval(breathHandle);document.getElementById('breath-label').textContent='You made space.';document.getElementById('breath-description').textContent='Choose the smallest next action that supports you.';}};
    tick();breathHandle=setInterval(tick,250);
  }

  // Edition 5 · transparent, descriptive habit trends. No invented forecasts.
  function habitLens(){
    const habit=state.habits.find(x=>x.id===ui.habitDetail)||scheduledHabits(chosenDate())[0]||state.habits[0];
    if(!habit)return '';
    const today=dateLocal(),days=Array.from({length:14},(_,i)=>shiftDay(today,i-13));
    const data=days.map(d=>({date:d,eligible:d>=state.settings.startDate&&d<=endDate()&&d<=today&&scheduled(habit,d),value:completed(habit,d)?1:0,progress:habitProgress(habit,d)}));
    const current=data.slice(-7).filter(x=>x.eligible),previous=data.slice(0,7).filter(x=>x.eligible);
    const score=arr=>arr.length?Math.round(arr.filter(x=>x.value).length/arr.length*100):null;
    const c=score(current),p=score(previous),delta=c!==null&&p!==null?c-p:null;
    const progressBars=data.map(x=>`<button class="v5-spark-bar" ${!x.eligible?'disabled':''} data-jump-day="${x.date}" title="${h(niceDate(x.date))}: ${x.eligible?`${Math.round(x.progress*100)}% toward goal`:'Not scheduled'}" aria-label="${h(niceDate(x.date))}: ${x.eligible?`${Math.round(x.progress*100)} percent`:'not scheduled'}"><i style="height:${x.eligible?Math.max(x.progress*100,4):3}%"></i></button>`).join('');
    return `<section class="card v5-habit-lens"><div class="section-header"><div><span class="v5-caption">YOUR HABIT STORY</span><h2 class="section-title">See what’s becoming easier.</h2><p class="section-sub">Choose a habit to inspect 14 days of real progress.</p></div></div><div class="v5-lens-select"><label for="lens-habit">Explore habit</label><select class="input" id="lens-habit" data-lens-habit>${state.habits.map(x=>`<option value="${h(x.id)}" ${x.id===habit.id?'selected':''}>${h(x.title)}</option>`).join('')}</select></div><div class="v5-lens-content"><div><span>LAST 7 SCHEDULED DAYS</span><strong>${c===null?'—':c+'%'}</strong><small>${c===null?'No scheduled days yet':delta===null?'Not enough earlier data':`${delta>0?'+':''}${delta} percentage points vs previous 7 days`}</small></div><div class="v5-spark-wrap"><div class="v5-spark">${progressBars}</div><div class="v5-spark-labels"><span>14 days ago</span><span>Today</span></div></div></div><p class="v5-lens-note">Only scheduled days count. Bars show recorded progress, not predicted results. Tap any bar to open that date.</p></section>`;
  }
  function nextMove(){
    const day=chosenDate();const todo=scheduledHabits(day).filter(x=>!completed(x,day)).sort((a,b)=>{
      const aVal=habitProgress(a,day),bVal=habitProgress(b,day);return bVal-aVal||String(a.title).localeCompare(String(b.title));
    });
    const top=todo.slice(0,3);
    return `<section class="card v5-next"><div class="v5-next-top"><div><span class="v5-caption">YOUR NEXT THREE MOVES</span><h3>${todo.length?`Start with what’s close.`:'You showed up today.'}</h3></div><span class="v5-next-count">${todo.length} left</span></div><div class="v5-next-actions">${top.length?top.map((x,i)=>`<button data-quick-habit="${h(x.id)}" class="v5-next-button"><span class="v5-num">0${i+1}</span><span><b>${h(x.title)}</b><small>${x.kind==='binary'?'Tap to mark done':x.kind==='max'?'Open check-in to log total':`${Math.round(habitProgress(x,day)*100)}% toward target`}</small></span><span class="v5-arrow">↗</span></button>`).join(''):`<div class="v5-completed-note">That’s a meaningful day. Take a moment to notice it. ✦</div>`}</div><button class="v5-all-habits" data-nav="habits">See every habit ↗</button></section>`;
  }
  function pulseMap(){
    const today=dateLocal(),days=Array.from({length:30},(_,i)=>shiftDay(today,i-29)),valid=days.filter(d=>d>=state.settings.startDate&&d<=endDate());
    const weekNow=compareWindow(7),last=compareWindow(7,7); const diff=weekNow.pct-last.pct;
    return `<section class="card v5-pulse-map"><div class="section-header"><div><span class="v5-caption">30-DAY SIGNAL</span><h2 class="section-title">A portrait of your consistency</h2><p class="section-sub">A quiet record of the days you actually checked in.</p></div><button class="text-link" data-nav="insights">Open insights ↗</button></div><div class="v5-map"><div class="v5-map-grid" role="group" aria-label="Daily progress in the past thirty days">${days.map(d=>{const eligible=d>=state.settings.startDate&&d<=endDate(),s=eligible?dayScore(d):{total:0,pct:0};return `<button ${!eligible?'disabled':''} class="v5-map-cell" style="--intensity:${s.total?s.pct/100:0};" data-jump-day="${d}" aria-label="${h(niceDate(d))}: ${eligible?s.pct+' percent complete':'Before challenge'}" title="${h(niceDate(d))} · ${eligible?s.pct+'% complete':'Before your start'}"><i></i></button>`}).join('')}</div><div class="v5-map-footer"><span>30 days ago</span><span>Today</span></div></div><div class="v5-map-takeaway"><span>${valid.length} days in view</span><b>${last.total?`${diff>0?'+':''}${diff} pts from prior week`:'Keep logging to unlock comparisons'}</b></div></section>`;
  }
  function liveQuote(){
    const candidate=(currentQuoteIndex()+ui.quoteOffset)%QUOTES.length;
    return `<section class="v5-quote-switch" aria-label="A thought for today"><span>WORDS FOR THIS MOMENT</span><div><blockquote>“${h(QUOTES[candidate])}”</blockquote><button data-action="next-quote" title="Show another thought" aria-label="Show another motivational thought">↻</button></div><small>Tap ↻ for another thought. Your actions are the real story.</small></section>`;
  }
  function overview(){const st=stats(),day=challengeDay(),score=dayScore(chosenDate()),name=state.settings.name||'You',todayXP=xpBreakdown(chosenDate());
    return `<div class="v4-overview">
    <div class="v4-greeting"><div><span class="v4-micro-label">YOUR PERSONAL FIELD NOTES · ${h(niceDate(dateLocal(),{weekday:'long',month:'long',day:'numeric'}).toUpperCase())}</span><h1>Good ${new Date().getHours()<12?'morning':new Date().getHours()<18?'afternoon':'evening'}, ${h(name)}<span>.</span></h1><p>Your next version is built in moments like this.</p></div><div class="v4-greeting-tools"><button class="btn btn-neutral" data-nav="sanctuary">${ico('heart','i-sm')} Take a pause</button><button class="btn btn-primary" data-nav="focus">${ico('play','i-sm')} Enter focus</button></div></div>
    <section class="v4-command-hero"><div class="v4-hero-grain" aria-hidden="true"></div><div class="v4-hero-copy"><span class="v4-hero-eyebrow">✦ &nbsp; EDITION 01 &nbsp; / &nbsp; BECOME, ONE DAY AT A TIME</span><h2>Your ordinary days.<br><em>An extraordinary life.</em></h2><p>Make one promise to yourself. Keep it. Then build on the evidence.</p><div class="v4-hero-pill-row"><span>↗ Day ${day} / 90</span><span>✳ ${st.streak}-day rhythm</span><span>◇ Level ${st.level}</span></div><div class="v4-hero-cta"><button data-nav="habits">Open daily habits ${ico('arrow-right','i-sm')}</button><button data-nav="insights">Explore your trajectory ↗</button></div></div><div class="v4-orbit-portal" style="--p:${score.pct}%" role="img" aria-label="${score.pct}% of today's habits completed"><div class="v4-orbit-satellite sat-one"></div><div class="v4-orbit-satellite sat-two"></div><div class="v4-orbit-core"><span>TODAY'S PROOF</span><strong>${score.pct}<i>%</i></strong><small>${score.done} OF ${score.total} HABITS</small></div></div><span class="v4-hero-index" aria-hidden="true">01—90 / EVOLUTION</span></section>
    ${liveQuote()}
    <section class="v4-numbers" aria-label="Current progress statistics"><button data-nav="rewards"><span class="v4-micro-label">LIFETIME EXPERIENCE</span><strong>${st.xp.toLocaleString()} <i>XP</i></strong><small>Earned by doing, not tapping twice ↗</small></button><button data-nav="insights"><span class="v4-micro-label">CHALLENGE CONSISTENCY</span><strong>${st.consistency}<i>%</i></strong><small>Your tracked journey ↗</small></button><button data-nav="insights"><span class="v4-micro-label">CURRENT RHYTHM</span><strong>${st.streak} <i>DAYS</i></strong><small>Keep building momentum ↗</small></button><button data-nav="rewards"><span class="v4-micro-label">YOUR REWARD WALLET</span><strong>${availableXp().toLocaleString()} <i>XP</i></strong><small>Use it for something meaningful ↗</small></button></section>
    <div class="v4-dashboard-grid"><div class="v4-dashboard-main"><div class="v4-northstar card"><div><span class="v4-micro-label">✳ YOUR NORTH STAR</span><h3>What matters most today?</h3><p>Write one clear intention, not a complicated plan.</p></div><form id="northstar-form" class="v4-northstar-form"><label class="sr-only" for="northstar">Today's personal intention</label><input id="northstar" class="input" name="northStar" maxlength="150" placeholder="e.g. Finish my research, protect my attention…" value="${h(state.settings.northStar||'')}"><button class="btn btn-primary" type="submit" aria-label="Save intention">${ico('arrow-right','i-sm')} <span>Set intention</span></button></form></div>${nextMove()}${todayHabits()}${pulseMap()}${ninetyAtlas(true)}${periodChartMini()}</div><div class="v4-dashboard-side">${dailyXpCard()}${smartSignal()}${miniWeek()}${reflection()}<div class="v4-side-quote"><span>✦ AFTER HOURS</span><p>“${h(QUOTES[(currentQuoteIndex()+6)%QUOTES.length])}”</p><button data-nav="sanctuary">Open the reset space ↗</button></div></div></div>
    <div class="v4-footer-note">✦ MAKE THE DAYS COUNT. LET THE DAYS MAKE YOU. <span>AVENORY / YOUR OWN EDITION</span></div>
    </div>`;
  }
  function periodChartMini(){const data=Array.from({length:7},(_,i)=>{const date=shiftDay(dateLocal(),i-6);return {date,score:date>=state.settings.startDate&&date<=endDate()?dayScore(date):{pct:0,total:0}};});
    return `<div class="card weekly-snapshot"><div class="section-header"><div><span class="mini-eyebrow">LOOK BACK, MOVE FORWARD</span><h3 class="section-title">Your last 7 days</h3></div><button class="text-link" data-nav="insights">Full report ${ico('arrow-right','i-sm')}</button></div><div class="seven-bars">${data.map(({date,score})=>`<button ${!score.total?'disabled':''} data-jump-day="${date}" title="${niceDate(date)} • ${score.pct}%" aria-label="Open ${niceDate(date)}, ${score.pct}% complete"><span>${score.total?score.pct+'%':'—'}</span><i class="seven-pillar"><i style="height:${score.total?Math.max(3,score.pct):0}%"></i></i><small>${DAYS[parseDate(date).getDay()].slice(0,1)}</small></button>`).join('')}</div></div>`;}
  
  function habitsPage(){return `${header('BUILD YOUR ROUTINE','Your habits, your rhythm','Edit goals, change schedules, or create habits that fit your life.',`<button class="btn btn-primary" data-action="add-habit">${ico('plus','i-sm')} Add habit</button>`)}
    <div class="section-header"><div><h2 class="section-title">Active habits</h2><p class="section-sub">${state.habits.length} habits in your routine · Adjust anytime</p></div></div>
    <div class="page-grid">${state.habits.map(habit=>`<article class="card manage-card"><div class="habit-symbol ${h(habit.color)}">${ico(habit.icon)}</div><div class="manage-text"><div class="manage-top"><h3>${h(habit.title)}</h3><div class="manage-actions"><button class="tiny-ic" data-edit-habit="${h(habit.id)}" title="Edit habit" aria-label="Edit ${h(habit.title)}">${ico('pencil','i-sm')}</button><button class="tiny-ic" data-delete-habit="${h(habit.id)}" title="Remove habit" aria-label="Remove ${h(habit.title)}">${ico('trash','i-sm')}</button></div></div><p>${h(habit.caption)}</p><div class="manage-metrics"><span>${habit.kind==='binary'?'Daily checkmark':`${habit.kind==='max'?'At most':'At least'} ${h(durationLabel(habit.target,habit.unit))}`}</span><span>${habit.days.length===7?'Every day':`${habit.days.length} days / week`}</span><span>🔥 ${habitStreak(habit)} streak</span><span>✦ ${habit.points||20} XP / day</span></div></div></article>`).join('')}</div>
    ${habitLens()}
    <div class="section-header section-spacer"><div><h2 class="section-title">Looking for inspiration?</h2><p class="section-sub">One tap adds a new idea to your routine.</p></div></div><div class="template-grid">${templates.map((t,i)=>`<button class="template" data-template="${i}">${ico(t.icon,'i-lg')}<div><b>${t.title}</b><span>${t.caption}</span></div>${ico('plus','i-sm')}</button>`).join('')}</div>
    <div class="help-banner">${ico('heart','i-sm')} You choose what is realistic for you. Rest days and flexible goals can be part of a successful routine.</div>`;}
  function projectsPage(){const date=chosenDate();return `${header('GROW WITH INTENTION','Skill-building projects','Choose what you want to improve, set a number of days, and log the time you put in.',`<button class="btn btn-primary" data-action="add-project">${ico('plus','i-sm')} New project</button>`)}
    ${state.projects.length?`<div class="page-grid">${state.projects.map(p=>{
      const done=projectDaysDone(p),pct=clamp(Math.round(done/p.durationDays*100),0,100),active=projectEligible(p,date),minutes=Number((getLog(date).projects||{})[p.id]||0),remaining=Math.max(0,p.durationDays-done);
      return `<article class="card project-card"><div class="project-top"><div class="project-emblem">${ico(p.icon||'target','i-lg')}</div><div class="manage-actions"><button class="tiny-ic" data-edit-project="${h(p.id)}" aria-label="Edit project">${ico('pencil','i-sm')}</button><button class="tiny-ic" data-delete-project="${h(p.id)}" aria-label="Delete project">${ico('trash','i-sm')}</button></div></div><div class="project-eyebrow">${h(p.category||'PERSONAL GROWTH')} · ${p.durationDays} DAY SPRINT</div><h2 class="project-title">${h(p.title)}</h2><p class="project-description">${h(p.description||'Each session is a vote for who you want to become.')}</p>
      <div class="bar-labels"><b>${done} of ${p.durationDays} days completed</b><span>${pct}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="project-meta"><span>${ico('calendar','i-sm')} ${h(niceDate(p.startDate))} → ${h(niceDate(shiftDay(p.startDate,p.durationDays-1)))}</span><span>${ico('clock','i-sm')} ${p.dailyMinutes} min/day</span></div>
      <div class="project-controls"><div><small>${active?`ON ${date===dateLocal()?'TODAY':niceDate(date).toUpperCase()}`:'OUTSIDE PROJECT DATES'}</small><br><b>${minutes} / ${p.dailyMinutes} minutes logged</b></div><button class="btn ${minutes>=p.dailyMinutes?'btn-ghost':'btn-primary'} btn-sm" data-project-toggle="${h(p.id)}" ${active?'':'disabled'}>${minutes>=p.dailyMinutes?`${ico('check','i-sm')} Completed`:`${ico('check','i-sm')} Mark done`}</button></div>
      <div class="project-controls" style="margin-top:12px"><button data-project-min="${h(p.id)}" data-minutes="15" class="btn btn-neutral btn-sm" ${active?'':'disabled'}>${ico('plus','i-sm')} 15 min</button><button class="btn btn-neutral btn-sm" data-project-focus="${h(p.id)}">${ico('play','i-sm')} Focus on this</button><small>${remaining} days to earn</small></div></article>`;
    }).join('')}</div>`:`<div class="card empty-state project-empty">${ico('target')}<h3>What do you want to get better at?</h3><p>Learning to code, practicing English, building a portfolio, reading, fitness, anything. Set a 7, 30, or 90-day focus and track your effort.</p><button class="btn btn-primary" data-action="add-project">${ico('plus','i-sm')} Create your first project</button></div>`}
    <div class="help-banner">${ico('sparkles','i-sm')} Projects have their own daily minute logs and +20 XP for each completed project day. A focus session can also contribute to your self-improvement habit.</div>`;}
  function growthCompass(){
    const today=dateLocal(),days=Array.from({length:14},(_,i)=>shiftDay(today,i-13)).filter(d=>d>=state.settings.startDate&&d<=endDate());
    const areas=[...new Set(state.habits.map(x=>x.category||'Personal'))];
    const items=areas.map(name=>{
      let done=0,total=0;for(const d of days)for(const habit of state.habits){if((habit.category||'Personal')!==name||!scheduled(habit,d))continue;total++;if(completed(habit,d))done++;}
      return {name,done,total,pct:total?Math.round(100*done/total):0};
    }).filter(x=>x.total>0).sort((a,b)=>b.total-a.total).slice(0,6);
    return `<section class="card v5-compass"><div class="section-header"><div><span class="v5-caption">YOUR BALANCE</span><h2 class="section-title">Progress in every part of life</h2><p class="section-sub">14-day scheduled check-in rates, grouped by your habit categories.</p></div></div><div class="v5-compass-grid">${items.map((x,i)=>`<div class="v5-compass-item"><div class="v5-compass-ring" style="--p:${x.pct}%"><div><strong>${x.pct}%</strong><small>${x.done}/${x.total}</small></div></div><b>${h(x.name)}</b><span>${x.total} scheduled check-ins</span></div>`).join('')||'<p class="section-sub">Track a few habits to see your personal balance.</p>'}</div><p class="v5-lens-note">This is a view of recorded habits, not an assessment of health, character, or potential.</p></section>`;
  }
  function moodMirror(){
    const dates=Array.from({length:30},(_,i)=>shiftDay(dateLocal(),i-29)).filter(d=>d>=state.settings.startDate&&d<=endDate());
    const groups=[['great','Bright days','☀'],['okay','Steady days','◐'],['low','Tough days','☾']].map(([key,name,icon])=>{
      const marked=dates.filter(d=>getLog(d).mood===key),scores=marked.map(d=>dayScore(d)).filter(s=>s.total);
      const score=scores.length?Math.round(scores.reduce((n,x)=>n+x.pct,0)/scores.length):null;
      return {key,name,icon,samples:scores.length,pct:score};
    });
    return `<section class="card v5-mood"><div class="section-header"><div><span class="v5-caption">MOOD & MOMENTUM</span><h2 class="section-title">Every kind of day belongs.</h2><p class="section-sub">See the average check-in rate on days you recorded each mood.</p></div></div><div class="v5-mood-grid">${groups.map(x=>`<div class="v5-mood-item"><span class="v5-mood-icon">${x.icon}</span><h3>${x.name}</h3><div class="v5-mood-number">${x.pct===null?'—':x.pct+'%'}</div><span>${x.samples} logged ${x.samples===1?'day':'days'}</span><div class="v5-mood-track"><i style="width:${x.pct||0}%"></i></div></div>`).join('')}</div><p class="v5-lens-note">Descriptive only: small samples can be misleading. A difficult day can still be a meaningful one. Your mood doesn't affect XP.</p></section>`;
  }
  function insightsPage(){const dates=Array.from({length:90},(_,i)=>shiftDay(state.settings.startDate,i));const currentDays=challengeDatesToToday();const st=stats();const now=compareWindow(7),before=compareWindow(7,7),now30=compareWindow(30),before30=compareWindow(30,30);
    const ranking=state.habits.map(habit=>{let total=0,done=0;for(const d of currentDays)if(scheduled(habit,d)){total++;if(completed(habit,d))done++;}return {habit,total,done,pct:total?Math.round(done/total*100):0};}).sort((a,b)=>b.pct-a.pct);
    return `${header('PROGRESS YOU CAN SEE','Your growth, in perspective','Compare individual days, weeks, and 30-day chapters. All numbers come from your own check-ins.',`<button class="btn btn-neutral" data-action="export-csv">${ico('download','i-sm')} Export report</button>`)}
    <div class="insight-summary">${statCard('This 7 days',now.pct,'% ',`${formatDelta(now.pct-before.pct)} points vs previous 7 days`,'chart','green')}${statCard('Last 30 days',now30.pct,'% ',`${formatDelta(now30.pct-before30.pct)} points vs previous 30 days`,'activity')}${statCard('Best streak',bestStreak(),' days','A day counts at 75% or more','flame','warm')}${statCard('Total earned',st.xp.toLocaleString(),' XP','Calculated from your check-ins','trophy')}</div>
    ${growthCompass()}${periodChart()}${moodMirror()}${focusInsightPanel()}
    <div class="card chapter-card"><div class="section-header"><div><span class="mini-eyebrow">MONTH-BY-MONTH EVOLUTION</span><h2 class="section-title">Three 30-day chapters</h2><p class="section-sub">As you build momentum, see how each part compares. Future days aren't counted.</p></div>${ico('chart')}</div><div class="chapter-grid">${monthBlocks().map((b,i)=>`<div class="chapter"><span>CHAPTER ${String(i+1).padStart(2,'0')}</span>${progressRing(b.pct,112,9,'COMPLETE')}<b>${h(b.label)}</b><small>${b.done} / ${b.total} habits · ${b.xp} XP</small></div>`).join('')}</div></div>
    <div class="card heatmap-card"><div class="section-header"><div><span class="mini-eyebrow">THE WHOLE JOURNEY</span><h2 class="section-title">Your 90-day consistency map</h2><p class="section-sub">Tap any past square to open that day's check-in.</p></div><span class="smallcaps">${niceDate(state.settings.startDate)} — ${niceDate(endDate())}</span></div>
      <div class="heatmap">${dates.map(d=>{const future=d>dateLocal(),s=dayScore(d);const cls=future?'future':s.pct>=75?'high':s.pct>=40?'mid':s.pct>0?'low':'';return `<button type="button" class="heat-cell ${cls}" data-jump-day="${d}" ${future?'disabled':''} title="${niceDate(d,{weekday:'long',month:'short',day:'numeric'})} — ${future?'upcoming':`${s.done}/${s.total} habits (${s.pct}%)`}" aria-label="${d}: ${future?'upcoming':`${s.pct}% complete; open daily record`}"></button>`}).join('')}</div>
      <div class="heat-legend"><span>Less</span><i class="legend-square"></i><i class="legend-square low"></i><i class="legend-square mid"></i><i class="legend-square high"></i><span>More</span></div></div>
    <div class="insight-main"><div class="card"><div class="section-header"><div><span class="mini-eyebrow">WHAT THE NUMBERS SAY</span><h2 class="section-title">Habits to celebrate</h2><p class="section-sub">Consistency across your elapsed scheduled days</p></div>${ico('checks')}</div><div class="performance-list">${ranking.length?ranking.map(x=>`<div><div class="performance-line"><span>${h(x.habit.title)}</span><span>${x.done}/${x.total} · ${x.pct}%</span></div><div class="progress-track" style="height:7px"><div class="progress-fill" style="width:${x.pct}%"></div></div></div>`).join(''):'<p class="section-sub">Add a habit and start your 90 days to see this breakdown.</p>'}</div></div>
      ${trendInsight()}</div>${insightOverview()}<div class="v4-data-deep-dive">${ninetyAtlas()}${weekRhythm()}</div>${quoteInlay('reflect')}`;
  }
  
  function rewardsPage(){const st=stats(),rewards=rewardMilestones(),unlocked=rewards.filter(r=>r[2]).length,all=[...rewardCatalog,...(state.customRewards||[])];
    return `${header('MAKE PROGRESS FUN','Celebrate every small win','Your effort earns lifetime XP, achievements, and optional personal rewards.',`<button class="btn btn-neutral" data-action="new-reward">${ico('plus','i-sm')} Create reward</button>`)}
    <div class="level-hero new-level"><div><span class="hero-tag">${ico('sparkles','i-sm')} LEVEL ${st.level} · ${unlocked} BADGES UNLOCKED</span><h2>${h(st.level<3?'The beginning is beautiful':st.level<6?'Momentum maker':st.level<10?'Consistency creator':'Keep becoming')}</h2><p>${st.xp.toLocaleString()} lifetime XP · ${300-st.nextXp} XP to your next level</p><div class="progress-track"><div class="progress-fill" style="width:${st.nextXp/300*100}%"></div></div></div><div class="level-hero-icon">${ico('trophy')}</div></div>
    <div class="reward-wallet"><div><span class="mini-eyebrow">AVAILABLE TO SPEND</span><h2>${availableXp().toLocaleString()} <small>XP</small></h2><p>Earned ${st.xp.toLocaleString()} − redeemed ${redeemedXp().toLocaleString()}</p></div><div class="reward-wallet-copy"><strong>One habit = a little more freedom.</strong><p>You can choose rewards that fit your values. Claiming a reward spends wallet XP without removing lifetime achievements.</p></div></div>
    <div class="section-header"><div><h2 class="section-title">Your reward shop</h2><p class="section-sub">You decide what makes the effort feel worthwhile.</p></div><button class="text-link" data-action="new-reward">Add your own ${ico('plus','i-sm')}</button></div>
    <div class="shop-grid">${all.map(r=>`<article class="card shop-item"><div class="shop-emoji">${h(r.emoji||'✨')}</div><h3>${h(r.title)}</h3><p>${h(r.description||'A meaningful celebration, chosen by you.')}</p><div class="shop-bottom"><strong>${r.cost} XP</strong><button class="btn ${availableXp()>=r.cost?'btn-primary':'btn-neutral'} btn-sm" ${availableXp()<r.cost?'disabled':''} data-redeem="${h(r.id)}">${availableXp()>=r.cost?'Claim reward':'Keep earning'}</button></div></article>`).join('')}</div>
    <div class="section-header section-spacer"><div><h2 class="section-title">Achievement shelf</h2><p class="section-sub">${unlocked} of ${rewards.length} lifetime milestones unlocked</p></div></div>
    <div class="rewards-grid">${rewards.map(([name,desc,achieved,icon,rule])=>`<div class="card reward ${achieved?'':'locked'}"><div class="reward-illustration">${ico(achieved?icon:'lock')}</div><h3>${name}</h3><p>${desc}</p><small>${achieved?'✓ UNLOCKED':`TO UNLOCK · ${rule}`}</small></div>`).join('')}</div>
    <div class="card redemption-card"><div class="section-header"><div><h3 class="section-title">Your celebration history</h3><p class="section-sub">Proof that your work adds up to something good.</p></div></div>${state.redemptions?.length?`<div class="redemption-list">${[...state.redemptions].reverse().slice(0,12).map(r=>`<div><span>🎉 ${h(r.title)} <small>· ${niceDate(r.date)}</small></span><b>−${r.cost} XP</b><button type="button" class="redemption-refund" data-refund-redemption="${h(r.id)}" aria-label="Refund ${h(r.title)} and restore ${r.cost} XP">Refund</button></div>`).join('')}</div>`:'<p class="section-sub">You haven’t redeemed anything yet. Your first treat is waiting for you.</p>'}</div>
    <div class="help-banner">${ico('heart','i-sm')} Habit XP depends on the value of each checklist item and quantitative progress. Perfect day +30 XP; project progress up to +20 XP; reflections up to +10 XP. Points are recalculated from your saved logs, not awarded repeatedly for tapping.</div>`;
  }
  
  function settingsPage(){const s=state.settings;return `${header('MAKE IT YOURS','Your settings','Everything is adjustable. Your data belongs to you.')}
    <div class="settings-grid"><section class="card settings-card"><h3>Personalize your space</h3><p>Set a name, theme, and the day your 90-day journey begins.</p><form id="settings-form"><div class="field"><label for="setting-name">Your display name</label><input id="setting-name" class="input" name="name" maxlength="35" required value="${h(s.name)}"></div><div class="field"><label for="setting-start">Challenge start date</label><input id="setting-start" class="input" type="date" name="startDate" required max="${dateLocal()}" value="${h(s.startDate)}"><small>Your challenge lasts 90 consecutive calendar days. Editing this does not delete past entries.</small></div><div class="field"><label for="setting-theme">Appearance</label><select id="setting-theme" class="input" name="theme"><option value="light" ${s.theme==='light'?'selected':''}>Light / airy</option><option value="dark" ${s.theme==='dark'?'selected':''}>Dark / calm</option></select></div><button class="btn btn-primary" type="submit">Save preferences</button></form></section>
    <section class="card settings-card"><h3>Reminders & notifications</h3><p>A two-layer reminder system: on-page alerts while running, and downloadable calendar reminders for alerts after closing the site.</p><div class="toggle-line"><div><b>Browser notifications</b><small>Requires permission and HTTPS or localhost.</small></div><input type="checkbox" class="switch" id="setting-notif" data-notification-toggle ${s.notifications?'checked':''} aria-label="Enable browser notifications"></div>
      <form id="reminder-form" style="margin-top:18px"><div class="field-inline"><div class="field"><label for="morning-time">Morning check-in</label><input id="morning-time" name="morning" type="time" class="input" value="${h(s.morning)}"></div><div class="field"><label for="evening-time">Evening reflection</label><input id="evening-time" name="evening" type="time" class="input" value="${h(s.evening)}"></div></div><button class="btn btn-neutral btn-sm" type="submit">Save reminder times</button></form>
      <div class="notification-health"><span class="status-pulse"></span><div><b>${h(notificationsStatus())}</b><small>On-page alerts require the site to be running and a supporting browser.</small></div></div><div class="setting-actions" style="margin:12px 0"><button class="btn btn-neutral btn-sm" type="button" data-action="test-notification">${ico('bell','i-sm')} Test notification</button></div><div class="divider"></div><button class="btn btn-ghost btn-wide" data-action="export-calendar">${ico('calendar','i-sm')} Download 90-day calendar reminders</button><p style="margin-top:13px">Calendar alerts can work after the site is closed, if your calendar app imports the file and has alerts enabled. Browser alerts only run while AVENORY is open; true closed-app push requires a separate server or native app. Re-importing the same .ics may create duplicate events in some calendar apps.</p></section>
    <section class="card settings-card"><h3>Back up & take your data</h3><p>No subscription or advertising. Guest mode saves on this device; signed-in mode can sync through a connected Supabase account.</p><div class="setting-actions"><button class="btn btn-neutral" data-action="export-json">${ico('download','i-sm')} Export backup</button><button class="btn btn-neutral" data-action="export-csv">${ico('chart','i-sm')} Export CSV</button><label class="btn btn-neutral" for="import-file" style="cursor:pointer">${ico('upload','i-sm')} Import backup</label><input type="file" accept="application/json,.json" id="import-file" style="display:none" data-import-file></div><div class="disclaimer" style="margin-top:22px">Clearing browser storage, switching devices, or using private mode may remove locally saved data. Export a backup regularly. Importing replaces the current data on this device.</div></section>
    <section class="card settings-card"><h3>Install & manage</h3><p>Once hosted on HTTPS, you can install AVENORY to your phone or desktop from your browser's “Add to Home Screen” or “Install app” menu.</p><div class="setting-actions"><button class="btn btn-neutral" data-action="install">${ico('download','i-sm')} Install website as app</button><button class="btn btn-danger" data-action="reset">${ico('trash','i-sm')} Reset all data</button></div><div class="divider"></div><p>Made to be accessible, adaptable, and free. Water and sleep targets are personal goals, not medical advice; adjust them to fit your needs.</p><div class="smallcaps">AVENORY · Edition Five · Private, cloud-ready PWA</div></section></div>`;}
  function render(){const theme=state.settings.theme==='dark'?'dark':'light';document.documentElement.dataset.theme=theme;document.querySelector('meta[name="theme-color"]').setAttribute('content',theme==='dark'?'#121524':'#f8f9fc');ui.date=clampDate(ui.date);
    const pages={overview,habits:habitsPage,projects:projectsPage,focus:focusPage,insights:insightsPage,rewards:rewardsPage,sanctuary:sanctuaryPage,settings:settingsPage,account:accountPage};
    if(ui.authGate && !account){document.getElementById('app').innerHTML=authPage();return;} const main=(pages[ui.page]||overview)();document.getElementById('app').innerHTML=`<a class="v4-skip" href="#main-content">Skip to main content</a><div class="shell">${sideNav()}<main id="main-content" class="main">${mobileTop()}<div class="content">${topbar()}${main}</div></main></div>${mobileNav()}`;updateTimerVisual();
  }
  function navigate(page){if(!nav.some(x=>x[0]===page))return;closeCommand();ui.page=page;render();window.scrollTo({top:0,behavior:'instant'});}
  function newId(prefix){return `${prefix}-${typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)}`;}
  const colorIcons = ['shield','leaf','heart','droplet','bed','brain','phone','book','clock','activity','sun','sparkles','target','coffee','pencil','checks'];
  let lastActiveElement=null;
  function modal(content){lastActiveElement=document.activeElement;const root=document.getElementById('modal-root');root.innerHTML=`<div class="modal-overlay" data-dismiss-overlay><div class="modal-panel" role="dialog" aria-modal="true" aria-label="Dialog window">${content}</div></div>`;const focusable=root.querySelectorAll('button:not([disabled]),input:not([type=hidden]):not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]');(focusable[0]||root.querySelector('.modal-panel'))?.focus();}
  function closeModal(){document.getElementById('modal-root').replaceChildren();if(lastActiveElement&&typeof lastActiveElement.focus==='function'){try{lastActiveElement.focus();}catch{}lastActiveElement=null;}}
  function habitModal(id=null){const current=state.habits.find(x=>x.id===id);const x=current||{title:'',caption:'',icon:'target',color:'blue',category:'Growth',kind:'binary',target:1,unit:'min',step:1,days:[0,1,2,3,4,5,6],startDate:dateLocal(),reminder:'',points:20};
    modal(`<div class="modal-titlebar"><h2>${current?'Edit habit':'Create a habit'}</h2><button class="icon-btn" data-action="close-modal" aria-label="Close">${ico('x')}</button></div>
    <form id="habit-form"><input type="hidden" name="id" value="${h(current?.id||'')}"><div class="field"><label for="habit-title">Habit name</label><input required name="title" id="habit-title" class="input" maxlength="70" placeholder="e.g. Practice English" value="${h(x.title)}"></div><div class="field"><label for="habit-caption">Little reminder / description</label><input name="caption" id="habit-caption" class="input" maxlength="120" placeholder="Why does this matter?" value="${h(x.caption)}"></div>
    <div class="field-inline"><div class="field"><label for="habit-kind">How to track</label><select id="habit-kind" name="kind" class="input"><option value="binary" ${x.kind==='binary'?'selected':''}>Yes / No</option><option value="min" ${x.kind==='min'?'selected':''}>At least (goal)</option><option value="max" ${x.kind==='max'?'selected':''}>At most (limit)</option></select></div><div class="field"><label for="habit-category">Category</label><select class="input" id="habit-category" name="category">${['Growth','Focus','Mindset','Wellness','Nutrition','Lifestyle'].map(cat=>`<option ${cat===x.category?'selected':''}>${cat}</option>`).join('')}</select></div></div>
    <div id="habit-number-fields" style="display:${x.kind==='binary'?'none':'block'}"><div class="field-inline"><div class="field"><label for="habit-target">Daily target</label><input name="target" id="habit-target" type="number" min="0.01" step="any" class="input" value="${x.kind==='binary'?1:x.target}"></div><div class="field"><label for="habit-unit">Unit</label><input name="unit" id="habit-unit" class="input" maxlength="16" value="${h(x.unit)}" placeholder="min, hr, L, pages"></div></div><div class="field"><label for="habit-step">Plus / minus button increment</label><input name="step" id="habit-step" type="number" min="0.01" step="any" class="input" value="${x.step||1}"></div></div>
    <div class="field-inline"><div class="field"><label for="habit-icon">Icon</label><select id="habit-icon" name="icon" class="input">${colorIcons.map(icon=>`<option value="${icon}" ${x.icon===icon?'selected':''}>${icon.charAt(0).toUpperCase()+icon.slice(1)}</option>`).join('')}</select></div><div class="field"><label for="habit-color">Accent</label><select class="input" name="color" id="habit-color">${['blue','green','orange'].map(color=>`<option ${x.color===color?'selected':''}>${color}</option>`).join('')}</select></div></div>
    <div class="field"><span class="field-label">Days of the week</span><div class="weekday-choices">${[1,2,3,4,5,6,0].map(d=>`<label class="weekday-choice"><input type="checkbox" name="days" value="${d}" ${x.days.includes(d)?'checked':''}><span>${DAYS[d].slice(0,2)}</span></label>`).join('')}</div><span class="form-hint">Choose any combination. Unscheduled days won't count against you.</span></div>
    <div class="field"><label for="habit-points">XP weight · per completed daily check</label><select name="points" class="input" id="habit-points">${[[10,'10 XP · Light'],[20,'20 XP · Normal'],[30,'30 XP · Important']].map(([v,label])=>`<option value="${v}" ${(x.points||20)===v?'selected':''}>${label}</option>`).join('')}</select><span class="form-hint">Quantitative habits earn partial XP as you make progress.</span></div><div class="field-inline"><div class="field"><label for="habit-start">Start on</label><input class="input" id="habit-start" name="startDate" type="date" required value="${h(x.startDate)}"></div><div class="field"><label for="habit-reminder">Optional reminder</label><input class="input" id="habit-reminder" name="reminder" type="time" value="${h(x.reminder)}"></div></div>
    <div class="modal-footer"><button type="button" class="btn btn-neutral" data-action="close-modal">Cancel</button><button type="submit" class="btn btn-primary">${current?'Save changes':'Create habit'}</button></div></form>`);
  }
  function projectModal(id=null){const current=state.projects.find(p=>p.id===id);const p=current||{title:'',description:'',category:'Learning',dailyMinutes:60,durationDays:30,startDate:dateLocal(),icon:'target'};
    modal(`<div class="modal-titlebar"><h2>${current?'Edit project':'New growth project'}</h2><button class="icon-btn" data-action="close-modal" aria-label="Close">${ico('x')}</button></div>
    <form id="project-form"><input name="id" type="hidden" value="${h(current?.id||'')}"><div class="field"><label for="project-title">What do you want to work on?</label><input name="title" id="project-title" class="input" required maxlength="80" placeholder="e.g. Master JavaScript" value="${h(p.title)}"></div>
    <div class="field"><label for="project-desc">Your outcome / why</label><textarea class="textarea" name="description" id="project-desc" maxlength="350" placeholder="What will be different when this project is done?">${h(p.description)}</textarea></div>
    <div class="field-inline"><div class="field"><label for="project-category">Focus area</label><select class="input" id="project-category" name="category">${['Learning','Career','Creative','Health','Personal','Other'].map(c=>`<option ${p.category===c?'selected':''}>${c}</option>`).join('')}</select></div><div class="field"><label for="project-start">Start date</label><input type="date" class="input" id="project-start" name="startDate" required value="${h(p.startDate)}"></div></div>
    <div class="field-inline"><div class="field"><label for="project-days">Duration in days (1–90)</label><input type="number" min="1" max="90" step="1" required class="input" id="project-days" name="durationDays" value="${p.durationDays}"></div><div class="field"><label for="project-minutes">Daily target in minutes</label><input type="number" min="5" max="1440" step="5" required class="input" id="project-minutes" name="dailyMinutes" value="${p.dailyMinutes}"></div></div>
    <div class="modal-footer"><button type="button" class="btn btn-neutral" data-action="close-modal">Cancel</button><button type="submit" class="btn btn-primary">${current?'Save project':'Start project'}</button></div></form>`);
  }
  function addTemplate(i){const t=templates[i];if(!t)return;const habit={...t,id:newId('habit'),days:[0,1,2,3,4,5,6],startDate:dateLocal(),reminder:'',points:20};state.habits.push(habit);save();render();toast(`${t.title} added. Make it yours!`);}
  function dataDownload(filename,body,type='text/plain'){const blob=new Blob([body],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),8000);}
  function exportJson(){dataDownload(`avenory-backup-${dateLocal()}.json`,JSON.stringify(state,null,2),'application/json');toast('Backup downloaded. Keep it somewhere safe.');}
  const csvCell=x=>{const v=String(x??'');const safe=/^[=+@\t\r]/.test(v.trimStart())?`'${v}`:v;return `"${safe.replaceAll('"','""')}"`;};
  function exportCsv(){const headers=['Date','Day','Completed','Scheduled','Completion %',...state.habits.map(x=>`${x.title} (${x.unit||'done'})`),...state.projects.map(x=>`${x.title} (project minutes)`),'Mood','Reflection'];const lines=[headers.map(csvCell).join(',')];
    for(let i=0;i<90;i++){const dt=shiftDay(state.settings.startDate,i),score=dayScore(dt),log=getLog(dt);const values=[dt,i+1,score.done,score.total,score.pct,...state.habits.map(habit=>{if(!scheduled(habit,dt))return 'off';const entry=habitEntry(habit,dt);return habit.kind==='binary'?(entry.done?'done':''):entry.logged?entry.value:'';}),...state.projects.map(p=>(log.projects||{})[p.id]||''),log.mood||'',log.note||''];lines.push(values.map(csvCell).join(','));}
    dataDownload(`avenory-progress-${dateLocal()}.csv`,lines.join('\r\n'),'text/csv;charset=utf-8');toast('90-day CSV report downloaded.');}
  function stamp(d){return `${d.replaceAll('-','')}T`;} // Floating local date-time for calendar compatibility
  function icsEscape(s){return String(s).replaceAll('\\','\\\\').replaceAll('\n','\\n').replaceAll(',','\\,').replaceAll(';','\\;');}
  function exportCalendar(){const entries=[];const now=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');const start=state.settings.startDate, end=endDate(),today=dateLocal();let count=0;
    const event=(date,time,title,description)=>{if(!/^\d\d:\d\d$/.test(time)||date<today||date>end)return;const [hh,mm]=time.split(':').map(Number);if(hh>23||mm>59)return;
      const base=stamp(date);const tick=base+time.replace(':','')+'00';const uid=`avenory-${date}-${count++}@local-tracker`;
      entries.push(['BEGIN:VEVENT',`UID:${uid}`,`DTSTAMP:${now}`,`DTSTART:${tick}`,`DURATION:PT10M`,`SUMMARY:${icsEscape(title)}`,`DESCRIPTION:${icsEscape(description)}`,'BEGIN:VALARM','ACTION:DISPLAY',`DESCRIPTION:${icsEscape(title)}`,'TRIGGER:-PT0M','END:VALARM','END:VEVENT'].join('\r\n'));
    };
    for(let i=0;i<90;i++){const d=shiftDay(start,i);event(d,state.settings.morning,'AVENORY · Start your day','Small wins start with showing up.');event(d,state.settings.evening,'AVENORY · Reflect and check in','Review your progress, even if the day was imperfect.');for(const habit of state.habits){if(habit.reminder&&scheduled(habit,d))event(d,habit.reminder,`AVENORY · ${habit.title}`,habit.caption||'A gentle habit reminder.');}}
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//AVENORY//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:AVENORY 90-day reminders',...entries,'END:VCALENDAR'];
    if(!entries.length){toast('There are no future challenge reminders to export.');return;}
    dataDownload(`avenory-reminders-${dateLocal()}.ics`,lines.join('\r\n'),'text/calendar;charset=utf-8');toast(`${entries.length} calendar reminders exported. Import the .ics file into your calendar.`);
  }
  async function enableNotification(value){if(!('Notification' in window)){toast('System notifications are not supported in this browser. Try calendar reminders.');return;}
    if(value){let permission;try{permission=await Notification.requestPermission();}catch(e){console.warn(e);}
      state.settings.notifications=permission==='granted';toast(permission==='granted'?'Reminders enabled while this website is open.':'Notification permission was not granted.');
    }else{state.settings.notifications=false;toast('Browser reminders turned off.');}save();render();}
  async function systemNotify(title,body){if(!('Notification' in window)||Notification.permission!=='granted')return;
    try{const reg='serviceWorker' in navigator?await navigator.serviceWorker.getRegistration():null;
      if(reg){await reg.showNotification(title,{body,icon:'./assets/icon-192.png',badge:'./assets/icon-192.png',tag:`avenory-${Date.now()}`});}
      else new Notification(title,{body,icon:'./assets/icon-192.png'});
    }catch(e){try{new Notification(title,{body});}catch{console.warn('Notification unavailable:',e);}}
  }
  function checkReminders(){if(!state.settings.notifications ||!('Notification' in window)||Notification.permission!=='granted')return;const now=new Date(),dt=dateLocal(now),time=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;if(dt<state.settings.startDate||dt>endDate())return;
    const reminders=[['morning',state.settings.morning,'A new chance starts today','Your daily habits are here whenever you need them.'],['evening',state.settings.evening,'Your evening check-in','Take a moment to reflect and check your progress.']];
    for(const habit of state.habits) if(habit.reminder&&scheduled(habit,dt)&&!completed(habit,dt))reminders.push([habit.id,habit.reminder,habit.title,habit.caption||'Take a small step now.']);
    for(const [id,at,title,body] of reminders){const [nowH,nowM]=time.split(':').map(Number),[atH,atM]=at.split(':').map(Number);const late=nowH*60+nowM-(atH*60+atM);if(late<0||late>15)continue;const key=`${dt}-${id}`;if(state.reminded[key])continue;state.reminded[key]=true;save();void systemNotify(`AVENORY · ${title}`,body);}
  }
  let deferredInstall=null;
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;});
  async function installApp(){if(deferredInstall){deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;}else toast('Use your browser menu → Install app / Add to Home Screen.');}

  function focusMomentumStrip(){const today=todayFocusMinutes();const goal=state.habits.find(x=>x.id==='deep-work');const hoursGoal=goal?Number(goal.target):6.5;const minutesGoal=Math.max(30,Math.round(hoursGoal*60));return `<section class="momentum-strip"><span class="momentum-icon">${ico('clock','i-lg')}</span><div><strong>Your attention is an investment.</strong><p>${today} focused minutes recorded today · ${Math.round(today/minutesGoal*100)}% of your ${minutesGoal}-minute deep-work target from timer sessions.</p></div><button class="btn btn-primary" data-nav="focus">${ico('play','i-sm')} Open Focus Studio</button></section>`;}
  function focusInsightPanel(){const days=Array.from({length:14},(_,i)=>shiftDay(dateLocal(),i-13)).map(d=>({date:d,min:todayFocusMinutes(d)}));const max=Math.max(30,...days.map(d=>d.min));const recent=days.slice(7).reduce((n,x)=>n+x.min,0),previous=days.slice(0,7).reduce((n,x)=>n+x.min,0);return `<section class="card focus-insight"><div class="section-header"><div><span class="mini-eyebrow">FOCUS ANALYTICS</span><h2 class="section-title">Your attention, measured.</h2><p class="section-sub">${recent} focused minutes this week vs ${previous} the previous week. Only completed sessions are recorded.</p></div><button class="btn btn-neutral btn-sm" data-nav="focus">View sessions</button></div><div class="focus-insight-grid" role="img" aria-label="Last 14 days' focus minutes">${days.map(d=>`<div class="focus-day" title="${niceDate(d.date)}: ${d.min} focus minutes"><b>${d.min?round(d.min):'·'}</b><i><span style="--height:${d.min?Math.max(5,Math.round(d.min/max*100)):0}%"></span></i><small>${DAYS[parseDate(d.date).getDay()].slice(0,1)}</small></div>`).join('')}</div></section>`;}
  // ─── 3.0 · Cloud account, optimistic concurrency and isolated local caches ───
  let authMethod='signin';
  function accountPage(){
    const online=navigator.onLine;
    return `${header('YOUR SPACE, EVERYWHERE','Account & cloud sync','Switch from local-only to your private cloud account when you are ready.')}
    <section class="account-layout">
      <div class="card account-identity"><div class="identity-emblem">${ico(account?'shield':'lock','i-lg')}</div><span class="mini-eyebrow">${account?'SIGNED IN · PRIVATE WORKSPACE':'LOCAL WORKSPACE'}</span><h2>${account?h(account.email):'Your progress, your choice'}</h2><p>${account?'Your check-ins, focus logs and rewards are associated with your Supabase account.':'You can use AVENORY offline for free, without giving an email. Cloud sign-in enables device syncing.'}</p>
        <div class="sync-status ${cloudError?'sync-warning':account?'sync-ready':''}" role="status"><span class="sync-light"></span><span>${h(account?(cloudError||cloudStatus):(cloudEnabled?'Cloud ready to connect':'Cloud requires setup'))}</span></div>
        ${account?`<div class="setting-actions"><button class="btn btn-primary" data-action="sync-now" ${!online?'disabled':''}>${ico('reset','i-sm')} Sync now</button><button class="btn btn-neutral" data-action="change-password">Change password</button><button class="btn btn-neutral" data-action="signout">Sign out</button></div>`:`<div class="setting-actions"><button class="btn btn-primary" data-action="open-login">${ico('lock','i-sm')} Sign in / create account</button></div>`}
        ${account&&cloudError?`<div class="sync-resolution"><strong>Resolve your unsynced edits</strong><p>Another device has changes. Nothing will be silently overwritten. First export a JSON backup from Settings.</p><button class="btn btn-neutral" data-action="resolve-cloud">Use cloud data</button><button class="btn btn-neutral" data-action="resolve-local">Keep this device’s data</button></div>`:''}
      </div>
      <div class="card account-guide"><span class="mini-eyebrow">YOUR DATA, YOUR RULES</span><h3>What's actually synced?</h3><div class="feature-lines"><div>✓ Habit check-ins & numerical goals</div><div>✓ 90-day progress, achievements & rewards</div><div>✓ Growth projects & completed focus sessions</div><div>✓ Preferences & journal entries</div><div>→ Active running timer stays on this device</div></div>
        <p class="privacy-warning">${cloudEnabled?'Cloud sync is configured, but requires a valid deployed Supabase database schema.':'Cloud sign-in is not enabled in this ZIP yet. Add your Supabase URL and publishable/anon key to <code>cloud-config.js</code>, and execute <code>supabase/schema.sql</code> in your project SQL editor.'}</p><p class="privacy-warning">Notes are private to your authenticated account through database row-level security, not end-to-end encrypted. Export regular backups. Free plans have usage limits.</p></div>
    </section>`;
  }
  function authPage(){
    const isSignup=authMethod==='signup';
    const isForgot=authMethod==='forgot';
    const isUpdate=authMethod==='update-password';
    const formTitle=!cloudEnabled?'Your becoming starts here.':isSignup?'Create your account':isForgot?'Reset your password':isUpdate?'Choose a new password':'Welcome back.';
    const formSubtitle=!cloudEnabled?'Start locally now, then connect your private account when you are ready.':isSignup?'Create a private space for your next chapter.':isForgot?'Enter your account email. We will send a secure password reset link.':isUpdate?'Enter at least 6 characters for your new private password.':'Your progress is still here. Pick up where you left off.';

    return `<div class="auth-shell"><div class="auth-aside v4-auth-aside"><div class="auth-mark"><span>✶</span> <b>AVENORY<span style="color:#d7ff8f">.</span></b></div><div class="auth-aside-content"><span class="auth-overline">WELCOME TO YOUR OWN EVOLUTION</span><h1>Become the person<br>you keep<br><em>promising to be.</em></h1><p>Ninety days. A beautifully deliberate life. Small actions, visible evolution, and room to begin again.</p>${!cloudEnabled?`<button class="v4-auth-hero-cta" data-action="guest-enter">Explore privately <span aria-hidden="true">↗</span></button>`:''}<div class="auth-mosaic" aria-hidden="true">${Array.from({length:90},(_,i)=>`<span class="${i<37?'lit':i<60?'half':''}" style="--i:${i%9}"></span>`).join('')}</div><div class="auth-quote">“You are not behind. You are becoming.” <span>YOUR STORY BEGINS WITH A SINGLE CHOICE</span></div></div><div class="auth-footer">PRIVATE BY DESIGN · YOUR PACE · 90 DAYS</div></div>
      <div class="auth-form-area"><div class="auth-form-wrap"><div class="auth-heading"><div class="auth-label">A PRIVATE WORLD CALLED AVENORY <span>✳</span></div><h2>${formTitle}</h2><p>${formSubtitle}</p></div>
      ${cloudEnabled?`
        <form id="auth-form" class="auth-form">
          ${!isUpdate?`<div class="field"><label for="auth-email">Email address</label><input id="auth-email" class="input" type="email" name="email" autocomplete="email" placeholder="you@example.com" required maxlength="254"></div>`:''}
          ${!isForgot?`<div class="field"><label for="auth-password">${isUpdate?'New password':'Password'}</label><input id="auth-password" class="input" type="password" name="password" autocomplete="${isSignup||isUpdate?'new-password':'current-password'}" minlength="6" required placeholder="At least 6 characters">${!isSignup&&!isUpdate?`<div style="display:flex;justify-content:flex-end;margin-top:6px"><button type="button" data-action="auth-mode" data-mode="forgot" style="border:0;background:none;color:var(--muted);font-size:11px;cursor:pointer;text-decoration:underline;">Forgot password?</button></div>`:''}</div>`:''}
          <button type="submit" class="btn btn-primary btn-wide auth-submit" ${authBusy?'disabled':''}>${authBusy?'Connecting…':isSignup?'Create account →':isForgot?'Send recovery link →':isUpdate?'Save new password →':'Sign in →'}</button>
        </form>
        <p class="auth-switch">
          ${isSignup?`Already have an account? <button type="button" data-action="auth-mode" data-mode="signin">Sign in</button>`:
            isForgot?`Remembered your password? <button type="button" data-action="auth-mode" data-mode="signin">Back to sign in</button>`:
            isUpdate?`<button type="button" data-action="auth-mode" data-mode="signin">Cancel and sign in</button>`:
            `New to AVENORY? <button type="button" data-action="auth-mode" data-mode="signup">Create one</button>`}
        </p>
        ${!isForgot&&!isUpdate?`
          <div class="auth-separator"><span>or continue with</span></div>
          <button type="button" class="btn btn-neutral btn-wide auth-google" data-action="google-login">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.28-2.09 3.66-5.17 3.66-9.14z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.36 7.31 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.26C.46 8.19 0 9.99 0 12s.46 3.81 1.26 5.41l4.02-3.13z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.64 1.26 6.59l4.02 3.13c.95-2.83 3.6-4.97 6.72-4.97z"/>
            </svg>
            <span>Continue with Google</span>
          </button>
        `:''}
      `:`<div class="auth-offline-info"><strong>Account setup is one step away.</strong><p>To use secure cloud accounts, connect your free Supabase project using the setup guide. Until then, explore the complete website locally.</p></div>`}
      <div class="auth-separator"><span>or</span></div><button class="btn btn-neutral btn-wide auth-guest" data-action="guest-enter">${ico('arrow-right','i-sm')} Continue privately on this device</button><p class="auth-smallprint">Zero subscriptions required. Guest data stays in this browser. Accounts use Supabase authentication; verify your email if requested.</p></div></div></div>`;
  }
  function initiateGoogleAuth(){
    if(!cloudEnabled){toast('Connect Supabase first. See setup guide.');return;}
    const origin=(window.location.origin&&window.location.origin!=='null'&&window.location.origin!=='file://')?(window.location.origin+window.location.pathname):'http://localhost:8000';
    window.location.href=cloudUrl(`/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(origin)}`);
  }
  function cloudUrl(path){return CONFIG.url.replace(/\/$/,'')+path;}
  async function cloudRequest(path,{method='GET',body,token,extra={}}={}){
    const headers={'apikey':CONFIG.anonKey,'Content-Type':'application/json',...extra};if(token)headers.Authorization=`Bearer ${token}`;
    const response=await fetch(cloudUrl(path),{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
    let payload=null;try{payload=await response.json()}catch{}
    if(!response.ok)throw Error(String(payload?.msg||payload?.error_description||payload?.message||payload?.error||`Network request failed (${response.status})`).slice(0,230));
    return payload;
  }
  function storeSession(session){
    cloudSession={
      ...cloudSession,
      ...session,
      user: session.user || cloudSession?.user,
      expires_at: session.expires_at || Math.floor(Date.now()/1000)+(session.expires_in||3600)
    };
    localStorage.setItem(SESSION_KEY,JSON.stringify(cloudSession));
  }
  async function ensureToken(){
    if(!cloudSession)throw Error('Not signed in');
    if(cloudSession.expires_at*1000>Date.now()+60000)return cloudSession.access_token;
    const data=await cloudRequest('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:cloudSession.refresh_token}});
    storeSession(data);
    return cloudSession.access_token;
  }
  function localCacheKey(uid){return `ninety-v3-user-${uid}`;}
  function metaKey(uid){return `ninety-v3-meta-${uid}`;}
  function cloudMeta(){try{return JSON.parse(localStorage.getItem(metaKey(account.id))||'{}')}catch{return {}}}
  function setCloudMeta(data){localStorage.setItem(metaKey(account.id),JSON.stringify(data));}
  async function remoteRow(){
    const token=await ensureToken();
    try{
      const rows=await cloudRequest('/rest/v1/ninety_profiles?select=revision,data&limit=1',{token});
      return rows?.[0]||null;
    }catch(e){
      if(String(e.message||'').includes('ninety_profiles')||String(e.message||'').includes('PGRST205')){
        throw Error('Database table "ninety_profiles" not found. Please run supabase/schema.sql in your Supabase SQL Editor.');
      }
      throw e;
    }
  }
  async function bootstrapAccount(user){
    account={id:user.id,email:user.email};currentStore=localCacheKey(user.id);ui.authGate=false;authBusy=false;
    const raw=localStorage.getItem(currentStore);let cached=null;
    if(raw){try{cached=sanitizeState(JSON.parse(raw))}catch{}}
    let row=await remoteRow();
    if(!row){
      const hasGuestEdits=Object.keys(state.logs).length>0||state.projects.length>0||state.customRewards.length>0||state.focusSessions?.length>0||state.habits.length!==habitDefaults(state.settings.startDate).length;
      if(cached)state=cached;
      else if(hasGuestEdits&&confirm('Import your current guest progress into this account? Choose Cancel to start with a clean tracker.'))state=sanitizeState(state);
      else state=freshState();
      cloudRevision=0;unsynced=true;cloudStatus='Setting up your private space';
      localStorage.setItem(currentStore,JSON.stringify(state));setCloudMeta({revision:0,dirty:true});await flushSync(true);
    }else{
      cloudRevision=row.revision;
      const meta=cloudMeta();
      if(cached&&meta.dirty){state=cached;cloudRevision=Number(meta.revision||0);unsynced=true;if(cloudRevision===Number(row.revision)){cloudError='';cloudStatus='Pending device changes';scheduleSync();}else{cloudError='Local edits need review before cloud sync';cloudStatus='Sync conflict — action needed';}}
      else {state=sanitizeState(row.data);localStorage.setItem(currentStore,JSON.stringify(state));setCloudMeta({revision:cloudRevision,dirty:false});unsynced=false;cloudError='';cloudStatus='Up to date on all devices';}
    }
    ui.date=dateLocal();render();toast(`Welcome back${state.settings.name&&state.settings.name!=='You'?', '+state.settings.name:''}!`);
  }
  async function handleAuth(vals){
    if(!cloudEnabled){toast('Connect Supabase first. See setup guide.');return;}
    if(authMethod==='update-password'){
      const password=String(vals.get('password')||'');
      if(password.length<6){toast('Password must be at least 6 characters.');return;}
      authBusy=true;render();
      try{
        const token=await ensureToken();
        const user=await cloudRequest('/auth/v1/user',{method:'PUT',token,body:{password}});
        toast('Password updated successfully! Welcome back.');
        authMethod='signin';
        if(user?.id)await bootstrapAccount(user);
        else{ui.authGate=false;render();}
      }catch(e){authBusy=false;toast(`Could not update password: ${e.message}`);render();}
      return;
    }
    const email=String(vals.get('email')||'').trim();
    if(authMethod==='forgot'){
      if(!email||!email.includes('@')){toast('Enter a valid email address.');return;}
      authBusy=true;render();
      try{
        await cloudRequest('/auth/v1/recover',{method:'POST',body:{email}});
        toast('Password recovery link sent! Check your email.');
        authMethod='signin';
      }catch(e){toast(`Recovery request failed: ${e.message}`);}
      finally{authBusy=false;render();}
      return;
    }
    const password=String(vals.get('password')||'');
    if(!email||password.length<6){toast('Enter a valid email and password (6+ characters).');return;}
    authBusy=true;render();
    try{
      const isUp=authMethod==='signup';
      const data=await cloudRequest(isUp?'/auth/v1/signup':'/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});
      if(!data.access_token){toast('Check your email to confirm your address, then sign in.');authMethod='signin';authBusy=false;render();return;}
      storeSession(data);await bootstrapAccount(data.user);
    }catch(e){
      authBusy=false;
      const msg=e.message||'';
      if(msg.includes('ninety_profiles')||msg.includes('PGRST205')){
        toast('Database table missing. Please run supabase/schema.sql in your Supabase SQL editor.');
      }else{
        toast(`Sign-in failed: ${msg}`);
      }
      render();
    }
  }
  async function handleAuthRedirect(){
    if(!cloudEnabled)return false;
    const hash=window.location.hash||'';
    const search=window.location.search||'';
    let params=null;
    if(hash.includes('access_token=')){
      params=new URLSearchParams(hash.replace(/^#/,''));
    }else if(search.includes('code=')){
      params=new URLSearchParams(search.replace(/^\?/,''));
    }
    if(!params)return false;
    const access_token=params.get('access_token');
    const refresh_token=params.get('refresh_token');
    const expires_in=Number(params.get('expires_in')||3600);
    const type=params.get('type');
    const errorDesc=params.get('error_description')||params.get('error');

    if(errorDesc){
      toast(`Authentication alert: ${decodeURIComponent(errorDesc)}`);
      try{if(window.history?.replaceState)window.history.replaceState(null,'',window.location.pathname||'/');}catch{}
      return false;
    }

    if(access_token){
      try{if(window.history?.replaceState)window.history.replaceState(null,'',window.location.pathname||'/');}catch{}
      const session={
        access_token,
        refresh_token:refresh_token||access_token,
        expires_at:Math.floor(Date.now()/1000)+expires_in
      };
      storeSession(session);
      if(type==='recovery'){
        ui.authGate=true;
        authMethod='update-password';
        toast('Recovery link verified. Please choose your new password.');
        render();
        return true;
      }
      try{
        const user=await cloudRequest('/auth/v1/user',{token:access_token});
        if(user?.id){
          toast('Signed in successfully. Welcome to AVENORY!');
          await bootstrapAccount(user);
          return true;
        }
      }catch(err){
        console.warn('Auth redirect user retrieval error:',err);
      }
    }
    return false;
  }
  async function resumeAuth(){
    if(!cloudEnabled)return;
    try{const saved=localStorage.getItem(SESSION_KEY);if(!saved)return;cloudSession=JSON.parse(saved);const token=await ensureToken();const user=await cloudRequest('/auth/v1/user',{token});if(user?.id)await bootstrapAccount(user);}
    catch(e){
      if(!navigator.onLine&&cloudSession?.user?.id){account={id:cloudSession.user.id,email:cloudSession.user.email};currentStore=localCacheKey(account.id);try{state=sanitizeState(JSON.parse(localStorage.getItem(currentStore)))}catch{state=freshState()}cloudRevision=Number(cloudMeta().revision||0);unsynced=!!cloudMeta().dirty;cloudStatus='Offline · signed-in cache';ui.authGate=false;render();return;}
      cloudSession=null;localStorage.removeItem(SESSION_KEY);cloudStatus='Session expired or account unavailable — sign in again';render();}
  }
  function scheduleSync(){if(!account||cloudError)return;clearTimeout(syncTimer);syncTimer=setTimeout(()=>void flushSync(),1400);}
  async function flushSync(showToast=false){
    if(!account||syncInFlight||cloudError)return;if(!navigator.onLine){cloudStatus='Offline · changes saved on device';return;}
    syncInFlight=true;const snapshot=JSON.stringify(state),startCount=syncCount,revision=cloudRevision;
    try{
      const token=await ensureToken();const reply=await cloudRequest('/rest/v1/rpc/ninety_write_state',{method:'POST',token,body:{p_document:JSON.parse(snapshot),p_expected_revision:revision}});
      if(!Array.isArray(reply)||reply.length!==1){cloudError='Cloud version changed on another device';cloudStatus='Sync conflict — action needed';setCloudMeta({revision,dirty:true});}
      else{cloudRevision=Number(reply[0].revision);cloudError='';unsynced=startCount!==syncCount;cloudStatus=unsynced?'More changes waiting':'Synced just now';setCloudMeta({revision:cloudRevision,dirty:unsynced});if(showToast)toast('Cloud sync complete.');if(unsynced)scheduleSync();}
    }catch(e){
      const errText=String(e.message||'');
      if(errText.includes('ninety_write_state')||errText.includes('PGRST202')){
        cloudStatus='Database function missing: run supabase/schema.sql in Supabase SQL editor';
      }else{
        cloudStatus=`Offline or sync error: ${errText}`;
      }
      unsynced=true;setCloudMeta({revision:cloudRevision,dirty:true});if(showToast)toast(cloudStatus);
    }
    finally{syncInFlight=false;renderSyncLabel();}
  }
  async function refreshCloud(){if(!account||unsynced||syncInFlight||!navigator.onLine)return;
    try{const row=await remoteRow();if(!row)return;if(Number(row.revision)>cloudRevision){state=sanitizeState(row.data);cloudRevision=Number(row.revision);localStorage.setItem(currentStore,JSON.stringify(state));setCloudMeta({revision:cloudRevision,dirty:false});cloudStatus='Updated from another device';render();}}
    catch(e){cloudStatus=`Cloud unreachable · using device data`;renderSyncLabel();}
  }
  function renderSyncLabel(){
    const el=document.querySelector('.sync-status span:last-child');
    if(el)el.textContent=cloudError||cloudStatus;
    const box=document.querySelector('.sync-status');
    if(box)box.className=`sync-status ${cloudError?'sync-warning':account?'sync-ready':''}`;
  }
  async function resolveConflict(choice){if(!account)return;
    try{
      const row=await remoteRow();if(choice==='cloud'){
        if(!confirm('Use cloud data? This device’s unsynced version will be downloaded as a backup first.'))return;
        exportJson();state=sanitizeState(row?.data||freshState());cloudRevision=Number(row?.revision||0);unsynced=false;cloudError='';cloudStatus='Cloud version restored';localStorage.setItem(currentStore,JSON.stringify(state));setCloudMeta({revision:cloudRevision,dirty:false});render();toast('Cloud data restored; previous data backed up.');return;
      }
      if(!confirm('Replace the cloud snapshot with THIS device’s data? Other devices will receive your changes when they refresh. Export a backup first.'))return;
    }catch(e){toast(`Could not resolve yet: ${e.message}`);}
  }
  async function signOut(){
    if(unsynced&&!confirm('Some account edits have not synced. They will remain in this browser and can be recovered by signing in here again. Sign out?'))return;
    const oldToken=cloudSession?.access_token;account=null;cloudSession=null;localStorage.removeItem(SESSION_KEY);currentStore=STORE;state=loadState();cloudRevision=0;cloudError='';cloudStatus='Local mode';ui.authGate=true;authMethod='signin';render();
    if(oldToken)cloudRequest('/auth/v1/logout',{method:'POST',token:oldToken}).catch(()=>{});
  }

  // ─── 3.0 · Focus Studio ───
  function focusDuration(mode){return (mode==='focus'?focusPrefs.focus:mode==='short'?focusPrefs.short:mode==='long'?focusPrefs.long:focusPrefs.focus)*60;}
  function formatClock(seconds){seconds=Math.max(0,Math.floor(seconds));const h=Math.floor(seconds/3600),m=Math.floor(seconds/60)%60,s=seconds%60;return `${h?String(h).padStart(2,'0')+':':''}${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
  function timerSetMode(mode){if(!['focus','short','long','stopwatch'].includes(mode))return;if(focusRun.running&&!confirm('Pause your current session and switch modes? The incomplete session will not be logged.'))return;focusRun.mode=mode;focusRun.running=false;focusRun.elapsed=0;focusRun.remaining=mode==='stopwatch'?0:focusDuration(mode);focusRun.duration=focusDuration(mode);focusRun.end=0;focusRun.startedAt=0;focusRun.startMs=0;persistFocus();render();}
  function timerLength(n){if(!Number.isInteger(n)||n<1||n>180)return;if(focusRun.running) {toast('Pause or reset your current session before changing duration.');return;}focusPrefs.focus=n;focusRun.mode='focus';focusRun.remaining=n*60;focusRun.duration=n*60;focusRun.elapsed=0;focusRun.startedAt=0;focusRun.end=0;focusRun.startMs=0;persistFocus();render();}
  function timerToggle(){
    if(focusRun.running){if(focusRun.mode==='stopwatch')focusRun.elapsed=Math.floor((Date.now()-focusRun.startMs)/1000);else focusRun.remaining=Math.max(0,Math.ceil((focusRun.end-Date.now())/1000));focusRun.running=false;focusRun.end=0;}
    else{if(focusRun.mode==='stopwatch'){focusRun.startMs=Date.now()-focusRun.elapsed*1000;focusRun.startedAt||=Date.now()}else{if(focusRun.remaining<=0)focusRun.remaining=focusRun.duration;focusRun.end=Date.now()+focusRun.remaining*1000;focusRun.startedAt||=Date.now()}focusRun.running=true;audioUnlock();}
    persistFocus();render();
  }
  function timerReset(){if(focusRun.running&&!confirm('Reset this session? Incomplete time will not be logged.'))return;focusRun.running=false;focusRun.remaining=focusRun.mode==='stopwatch'?0:focusDuration(focusRun.mode);focusRun.duration=focusDuration(focusRun.mode);focusRun.elapsed=0;focusRun.startedAt=0;focusRun.end=0;focusRun.startMs=0;persistFocus();render();}
  function timerSkip(){if(focusRun.mode==='stopwatch'){timerStopwatchDone();return;}if(focusRun.running&&!confirm('Skip this interval? Skipped focus time does not earn progress.'))return;
    if(focusRun.mode==='focus'){focusRun.mode=focusRun.round%focusPrefs.rounds===focusPrefs.rounds-1?'long':'short';}else focusRun.mode='focus';focusRun.running=false;focusRun.remaining=focusDuration(focusRun.mode);focusRun.duration=focusRun.remaining;focusRun.startedAt=0;focusRun.end=0;persistFocus();render();}
  function timerStopwatchDone(){if(focusRun.mode!=='stopwatch')return;const elapsed=focusRun.running?Math.floor((Date.now()-focusRun.startMs)/1000):focusRun.elapsed;const minutes=Math.floor(elapsed/60);if(minutes<1){toast('Complete at least 1 minute to log a stopwatch session.');return;}if(!confirm(`Finish and record ${minutes} focused minutes?`))return;recordFocus(minutes,'stopwatch');focusRun.running=false;focusRun.elapsed=0;focusRun.startedAt=0;focusRun.startMs=0;persistFocus();render();toast(`${minutes} minutes recorded. Great effort!`);}
  function finishEarly(){
    if(focusRun.mode!=='focus')return;
    const remaining=focusRun.running?Math.max(0,Math.ceil((focusRun.end-Date.now())/1000)):focusRun.remaining;
    const loggedSeconds=Math.max(0,Number(focusRun.duration||0)-remaining);
    const minutes=Math.floor(loggedSeconds/60);
    if(minutes<1){toast('Focus for at least one minute before saving.');return;}
    if(!confirm(`Save ${minutes} completed focus minutes? The rest of this interval will be discarded.`))return;
    focusRun.running=false;focusRun.end=0;recordFocus(minutes,'focus');focusRun.startedAt=0;focusRun.remaining=focusRun.duration;focusRun.elapsed=0;persistFocus();render();toast(`${minutes} focus minutes saved. Progress counts.`);
  }
  function presetSave(){
    if(focusRun.running){toast('Pause the timer before editing templates.');return;}
    const name=prompt('Name this focus template (e.g. Research, Study, Writing)');if(name===null)return;
    const title=String(name).trim().slice(0,28);
    if(!title){toast('Choose a template name.');return;}
    focusPrefs.presets=Array.isArray(focusPrefs.presets)?focusPrefs.presets.slice(0,11):[];
    focusPrefs.presets.push({name:title,minutes:focusPrefs.focus});persistFocus();render();toast('Focus template saved on this device.');
  }
  function tickTimer(){if(!focusRun.running)return;if(focusRun.mode==='stopwatch')focusRun.elapsed=Math.max(0,Math.floor((Date.now()-focusRun.startMs)/1000));else{focusRun.remaining=Math.max(0,Math.ceil((focusRun.end-Date.now())/1000));if(focusRun.remaining<=0){timerIntervalFinished();return;}}updateTimerVisual();}
  function recordFocus(minutes,mode){
    const today=dateLocal();const target=focusRun.target||'deep-work';
    if(target.startsWith('project:')){
      const p=state.projects.find(x=>x.id===target.slice(8));if(p&&projectEligible(p,today)){const log=editLog(today);log.projects[p.id]=round(Number(log.projects[p.id]||0)+minutes);}
      const growth=state.habits.find(x=>x.id==='self-growth');if(growth){const e=habitEntry(growth,today);editLog(today).habits[growth.id]={logged:true,value:round(Number(e.value||0)+minutes)};}
    }else{const habit=state.habits.find(x=>x.id===target);if(habit){const e=habitEntry(habit,today);editLog(today).habits[habit.id]={logged:true,value:round(Number(e.value||0)+(habit.unit==='hr'?minutes/60:minutes))};}}
    (state.focusSessions||=[]).push({id:newId('session'),date:today,minutes,startedAt:new Date(focusRun.startedAt||Date.now()).toISOString(),target,task:(focusRun.task||'').slice(0,160),mode});
    if(state.focusSessions.length>5000)state.focusSessions=state.focusSessions.slice(-5000);
    save();
  }
  function timerIntervalFinished(){
    if(!focusRun.running)return;const oldMode=focusRun.mode;focusRun.running=false;focusRun.end=0;
    if(oldMode==='focus'){recordFocus(focusRun.duration/60,'focus');focusRun.round=(focusRun.round+1)%Math.max(1,focusPrefs.rounds);focusRun.mode=focusRun.round===0?'long':'short';}
    else{focusRun.mode='focus';}
    focusRun.remaining=focusDuration(focusRun.mode);focusRun.duration=focusRun.remaining;focusRun.startedAt=0;
    persistFocus();playChime();void systemNotify('AVENORY · Interval complete',oldMode==='focus'?'Focus complete. A break is ready.':'Your break is over. Ready to focus again?');
    if(focusPrefs.autoNext&&document.visibilityState==='visible'){focusRun.running=true;focusRun.startedAt=Date.now();focusRun.end=Date.now()+focusRun.remaining*1000;persistFocus();}
    render();toast(oldMode==='focus'?'Session complete! Focus minutes added to your log.':'Break finished. You can start your next focus block.');
  }
  function finishTimer(){timerIntervalFinished();}
  function updateTimerVisual(){const count=document.getElementById('timer-counter');if(!count)return;const secs=focusRun.mode==='stopwatch'?(focusRun.elapsed||0):(focusRun.remaining||0);count.textContent=formatClock(secs);const dial=document.getElementById('timer-dial');if(dial)dial.style.setProperty('--deg',`${focusRun.mode==='stopwatch'?Math.min(360,(secs%3600)/3600*360):clamp((1-secs/Math.max(1,focusRun.duration))*360,0,360)}deg`);const live=document.getElementById('timer-aria');if(live)live.textContent=`${Math.floor(secs/60)} minutes ${secs%60} seconds ${focusRun.mode} ${focusRun.running?'running':'paused'}`;if(focusRun.running&&(document.title.startsWith('AVENORY')||document.title.startsWith('VOWMERA')))document.title=`${formatClock(secs)} · AVENORY`;else if(!focusRun.running)document.title='AVENORY · Become, one day at a time';}
  function todayFocusMinutes(date=dateLocal()){return (state.focusSessions||[]).filter(x=>x.date===date).reduce((n,x)=>n+Number(x.minutes||0),0);}
  function recentFocus(){return (state.focusSessions||[]).slice(-7).reverse().map(x=>`<div class="session-row"><span class="session-icon">${ico('clock')}</span><div><b>${h(x.task|| (x.mode==='stopwatch'?'Open focus session':'Deep focus'))}</b><small>${h(niceDate(x.date))} · ${x.mode==='stopwatch'?'Stopwatch':'Timer'}</small></div><strong>${round(x.minutes,1)} min</strong></div>`).join('')||'<p class="no-sessions">Your focus story starts with your first session.</p>';}
  function focusSettingsModal(){modal(`<div class="modal-titlebar"><h2>Customize focus and breaks</h2><button class="icon-btn" data-action="close-modal" aria-label="Close">${ico('x')}</button></div><form id="focus-settings-form"><p class="subhead">Every interval and preference is yours to choose.</p><div class="settings-fields"><div class="field"><label for="fs-focus">Focus minutes</label><input id="fs-focus" class="input" name="focus" type="number" min="1" max="180" required value="${focusPrefs.focus}"></div><div class="field"><label for="fs-short">Short break (minutes)</label><input id="fs-short" class="input" name="short" type="number" min="1" max="60" required value="${focusPrefs.short}"></div><div class="field"><label for="fs-long">Long break (minutes)</label><input id="fs-long" class="input" name="long" type="number" min="1" max="90" required value="${focusPrefs.long}"></div><div class="field"><label for="fs-rounds">Cycles before long break</label><input id="fs-rounds" class="input" name="rounds" type="number" min="1" max="12" required value="${focusPrefs.rounds}"></div></div><label class="toggle-line"><span><b>Auto-start next interval</b><small>Only when the website is open and active.</small></span><input class="switch" type="checkbox" name="autoNext" ${focusPrefs.autoNext?'checked':''}></label><label class="toggle-line"><span><b>Completion sound</b><small>A gentle chime when an interval ends.</small></span><input class="switch" type="checkbox" name="sound" ${focusPrefs.sound?'checked':''}></label><button class="btn btn-primary btn-wide" type="submit">Save timer preferences</button></form>`);}
  function applyFocusSettings(vals){if(focusRun.running){toast('Pause the running timer before editing durations.');return;}const checks=[['focus',1,180],['short',1,60],['long',1,90],['rounds',1,12]];for(const [field,lo,hi] of checks){const n=Number(vals.get(field));if(!Number.isInteger(n)||n<lo||n>hi){toast(`Choose a valid ${field} value (${lo}–${hi}).`);return;}focusPrefs[field]=n;}focusPrefs.autoNext=!!vals.get('autoNext');focusPrefs.sound=!!vals.get('sound');focusRun.remaining=focusDuration(focusRun.mode);focusRun.duration=focusRun.remaining;persistFocus();closeModal();render();toast('Focus Studio settings saved.');}
  function audioUnlock(){try{audioContext||=new (window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')void audioContext.resume()}catch{}}
  function playChime(){if(!focusPrefs.sound)return;try{audioUnlock();const now=audioContext.currentTime;for(let i=0;i<3;i++){const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.value=[523.25,659.25,783.99][i];g.gain.setValueAtTime(.0001,now+i*.13);g.gain.exponentialRampToValueAtTime(.1,now+i*.13+.03);g.gain.exponentialRampToValueAtTime(.0001,now+i*.13+.48);o.connect(g);g.connect(audioContext.destination);o.start(now+i*.13);o.stop(now+i*.13+.51);}if(navigator.vibrate)navigator.vibrate([70,40,70]);}catch{}}
  function toggleAmbient(which){const mode=focusPrefs.ambient===which?'off':which;focusPrefs.ambient=mode;try{if(ambientSource){ambientSource.stop();ambientSource.disconnect();ambientSource=null}if(mode!=='off'){audioUnlock();const sample=audioContext.sampleRate;const buffer=audioContext.createBuffer(1,sample*3,sample),data=buffer.getChannelData(0);let running=0;for(let i=0;i<data.length;i++){const white=Math.random()*2-1;running=(running+.017*white)/1.017;data[i]=mode==='rain'?white*.17:running*1.4;}ambientSource=audioContext.createBufferSource();ambientSource.buffer=buffer;ambientSource.loop=true;ambientGain=audioContext.createGain();ambientGain.gain.value=.15;ambientSource.connect(ambientGain);ambientGain.connect(audioContext.destination);ambientSource.start()}}catch{toast('Ambient audio unavailable in this browser.');}persistFocus();render();}
  function timerFullscreen(){const node=document.querySelector('.studio-primary');if(!node)return;try{if(document.fullscreenElement)void document.exitFullscreen();else if(node.requestFullscreen)void node.requestFullscreen()}catch{toast('Fullscreen not supported on this device.');}}
  function focusParking(){const thoughts=state.parkedThoughts||[];const goal=Number(state.settings.weeklyFocusHours||25),done=Array.from({length:7},(_,i)=>todayFocusMinutes(shiftDay(dateLocal(),-i))).reduce((n,x)=>n+x,0),pct=Math.round(Math.min(100,done/(goal*60)*100));return `<section class="card v4-parking"><span class="v4-micro-label">THE DISTRACTION PARKING LOT</span><h3>Set the thought down. Pick it up later.</h3><p>If something unrelated pops up during a session, park it here instead of changing tabs. This list is part of your saved tracker profile.</p><form id="park-form"><label class="sr-only" for="park-thought">Write a distracting thought to revisit later</label><input class="input" id="park-thought" name="thought" placeholder="Remember to email my teammate…" maxlength="180" required><button type="submit" class="btn btn-neutral">Park it ↗</button></form><div class="v4-park-list">${thoughts.length?thoughts.slice(-7).reverse().map(t=>`<div><span>${h(t.text)}</span><button data-park-remove="${h(t.id)}" aria-label="Clear parked thought">${ico('check','i-sm')}</button></div>`).join(''):'<div class="v4-park-empty">Nothing pulling your attention right now. Keep it that way.</div>'}</div><div class="v4-focus-goal"><div><span class="v4-micro-label">YOUR ROLLING 7-DAY GOAL</span><strong>${round(done/60,1)} <i>/ ${round(goal,1)} hours</i></strong></div><div class="v4-thin-progress"><i style="width:${pct}%"></i></div><form id="focus-goal-form"><label for="focus-goal">Adjust target (hours per week)</label><input id="focus-goal" class="input" name="hours" type="number" min="0.5" max="80" step="0.5" value="${goal}" required><button type="submit">Update</button></form></div></section>`; }
  function focusPage(){
    const focusOptions=[['focus','Focus'],['short','Short break'],['long','Long break'],['stopwatch','Stopwatch']];
    const active=focusRun.mode==='stopwatch'?(focusRun.elapsed||0):focusRun.remaining;
    const options=state.projects.map(p=>`<option value="project:${h(p.id)}" ${focusRun.target===`project:${p.id}`?'selected':''}>${h(p.title)}</option>`).join('');
    const todayMinutes=todayFocusMinutes(),last7=Array.from({length:7},(_,i)=>todayFocusMinutes(shiftDay(dateLocal(),-i))).reduce((a,b)=>a+b,0);
    return `${header('YOUR FOCUS SPACE','Make attention your advantage.','Protect your attention, make progress, and remember every meaningful session.',`<button class="btn btn-neutral" data-action="timer-settings">${ico('settings','i-sm')} Timer setup</button>`)}
    <div class="studio-layout"><section class="studio-primary card"><div class="studio-topline"><span><span class="studio-beacon"></span> ${focusRun.running?'IN THE ZONE':'YOUR FOCUS SPACE'}</span><button class="studio-icon-btn" data-action="timer-fullscreen" aria-label="Open focus fullscreen">${ico('grid','i-sm')} Expand</button></div>
      <div class="studio-mode" role="group" aria-label="Timer modes">${focusOptions.map(([key,label])=>`<button class="${focusRun.mode===key?'active':''}" data-timer-mode="${key}" aria-pressed="${focusRun.mode===key}">${label}</button>`).join('')}</div>
      <div class="studio-center"><div class="studio-orbit" id="timer-dial" style="--deg:${focusRun.mode==='stopwatch'?(active%3600)/3600*360:(1-active/Math.max(1,focusRun.duration))*360}deg"><div class="studio-orbit-inner"><span>${focusRun.mode==='focus'?'DEEP FOCUS':focusRun.mode==='short'?'RECHARGE':focusRun.mode==='long'?'REST DEEPLY':'FREE FLOW'}</span><div id="timer-counter" class="studio-time" role="timer">${formatClock(active)}</div><p>${focusRun.running?'● Your time is protected':'○ Your next chapter starts here'}</p></div></div><span id="timer-aria" class="sr-only" aria-live="off"></span></div>
      <div class="studio-presets" role="group" aria-label="Focus time presets">${[15,25,45,60,90].map(n=>`<button data-timer-length="${n}" class="${focusPrefs.focus===n&&focusRun.mode==='focus'?'active':''}" ${focusRun.running?'disabled':''}>${n}m</button>`).join('')}</div>
      <form class="v5-custom-time" id="custom-timer-form"><label for="v5-minutes">Set any focus time</label><div><input id="v5-minutes" name="minutes" type="number" inputmode="numeric" min="1" max="180" step="1" value="${focusPrefs.focus}" ${focusRun.running?'disabled':''} required aria-describedby="v5-minutes-hint"><span>min</span><button class="btn btn-neutral" type="submit" ${focusRun.running?'disabled':''}>Use time ↗</button></div><small id="v5-minutes-hint">1–180 minutes · saved for your next session</small></form>
      <div class="v5-focus-presets"><div class="v5-preset-head"><span>MY FOCUS TEMPLATES</span><button data-action="save-focus-preset" ${focusRun.running?'disabled':''} aria-label="Save current focus length as a template">＋ Save template</button></div><div class="v5-preset-list">${Array.isArray(focusPrefs.presets)&&focusPrefs.presets.length?focusPrefs.presets.map((p,i)=>`<span class="v5-preset-item"><button data-preset-use="${i}" ${focusRun.running?'disabled':''}>${h(p.name)} · ${p.minutes}m</button><button class="v5-preset-delete" data-preset-delete="${i}" aria-label="Delete ${h(p.name)} template">×</button></span>`).join(''):'<span class="v5-empty-inline">Create a study, work, or reading template.</span>'}</div></div>
      <div class="studio-controls"><button class="btn btn-primary studio-start" data-action="timer-toggle">${ico(focusRun.running?'pause':'play','i-sm')} ${focusRun.running?'Pause session':'Start session'}</button><button class="btn btn-neutral" data-action="timer-reset">${ico('reset','i-sm')} Reset</button><button class="btn btn-neutral" data-action="${focusRun.mode==='stopwatch'?'timer-finish':'timer-skip'}">${ico('arrow-right','i-sm')} ${focusRun.mode==='stopwatch'?'Finish & log':'Skip'}</button>${focusRun.mode==='focus'?`<button class="btn btn-quiet v5-partial" data-action="timer-finish-early" ${(!focusRun.startedAt&&!focusRun.running)?'disabled':''}>Finish early & log time</button>`:''}</div>
      <div class="studio-rounds"><span>FOCUS CYCLES</span><div>${Array.from({length:Math.max(1,focusPrefs.rounds)},(_,i)=>`<span class="${i<focusRun.round?'done':i===focusRun.round?'current':''}"></span>`).join('')}</div><strong>${focusRun.round+1} / ${focusPrefs.rounds}</strong></div>
      <p class="studio-footnote">Your running timer recovers on reload using device time. Notifications and sound depend on browser permissions, and no timer can guarantee uninterrupted real-world focus.</p>
    </section>
    <div class="studio-sidebar"><section class="card studio-intention"><span class="mini-eyebrow">BEFORE YOU BEGIN</span><h3>Give this session a purpose.</h3><div class="field"><label for="focus-task">What will you finish?</label><input id="focus-task" class="input" data-focus-task maxlength="160" placeholder="e.g. Study data structures chapter 4" value="${h(focusRun.task||'')}"></div><div class="field"><label for="focus-select">Count time toward</label><select id="focus-select" class="input" data-focus-target><option value="deep-work" ${focusRun.target==='deep-work'?'selected':''}>Deep work</option><option value="self-growth" ${focusRun.target==='self-growth'?'selected':''}>Self-improvement</option>${options}</select></div><p class="studio-intention-hint">Completed focus sessions automatically update the matching habit or growth project.</p></section>
    <section class="card studio-sound"><div class="section-header"><div><span class="mini-eyebrow">FIND YOUR FLOW</span><h3 class="section-title">Your soundscape</h3></div><button class="studio-icon-btn" data-action="timer-sound" aria-label="Play completion sound">${ico('bell','i-sm')} Test</button></div><div class="sound-pills"><button data-ambient="off" class="${focusPrefs.ambient==='off'?'active':''}">○ Silence</button><button data-ambient="rain" class="${focusPrefs.ambient==='rain'?'active':''}">♒ Rain</button><button data-ambient="brown" class="${focusPrefs.ambient==='brown'?'active':''}">◉ Brown noise</button></div><p class="studio-intention-hint">Generated locally in your browser. No external streams, ads or downloads.</p></section>
    <section class="card studio-analytics"><span class="mini-eyebrow">YOUR FOCUS MOMENTUM</span><div class="studio-stats"><div><strong>${round(todayMinutes,1)}<small>min</small></strong><span>Today</span></div><div><strong>${round(last7/60,1)}<small>hr</small></strong><span>Last 7 days</span></div><div><strong>${(state.focusSessions||[]).length}</strong><span>Sessions</span></div></div><div class="studio-history-top"><h3>Recent sessions</h3><span>HISTORY</span></div>${recentFocus()}<div class="studio-help">${ico('sparkles','i-sm')} Keyboard: Space to start/pause · R to reset · Escape to close dialogs</div></section></div></div>${focusParking()}${quoteInlay('focus')}`;
  }

  function handleClick(e){const b=e.target.closest('button,[data-template],[data-quick-qty]');if(!b)return;
    if(b.dataset.nav){navigate(b.dataset.nav);return;}
    if(b.dataset.quickQty){
      const habit=state.habits.find(x=>x.id===b.dataset.quickQty);
      if(habit){
        const prev=habitEntry(habit,chosenDate());
        const currentVal=prev.logged?Number(prev.value||0):habit.target;
        const input=prompt(`Enter ${habit.title} (${habit.unit||'amount'}):`,currentVal);
        if(input!==null&&input.trim()!==''){
          const n=Number(input);
          if(!Number.isNaN(n)&&n>=0){
            writeQuantity(habit.id,n);
            toast(`${habit.title} updated to ${durationLabel(n,habit.unit)}`);
          }else toast('Please enter a valid positive number.');
        }
      }
      return;
    }
    if(b.dataset.refundRedemption){
      const id=b.dataset.refundRedemption;
      const item=(state.redemptions||[]).find(r=>r.id===id);
      if(item&&confirm(`Refund “${item.title}” and restore ${item.cost} XP to your wallet?`)){
        state.redemptions=state.redemptions.filter(r=>r.id!==id);
        save();render();
        toast(`Refunded ${item.title}: +${item.cost} XP restored to wallet.`);
      }
      return;
    }
    if(b.dataset.quickHabit){const habit=state.habits.find(x=>x.id===b.dataset.quickHabit);if(!habit)return;if(habit.kind==='binary'){toggleHabit(habit.id);}else{navigate('overview');const row=document.querySelector(`[data-habit-row="${habit.id}"]`);row?.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});row?.querySelector('input,button[data-qty],[data-quick-qty]')?.focus({preventScroll:true});toast('Use the controls to record your progress.');}return;}
    if(b.dataset.presetUse!==undefined){const preset=(focusPrefs.presets||[])[Number(b.dataset.presetUse)];if(preset&&!focusRun.running){timerLength(Number(preset.minutes));toast(`${preset.name} time loaded.`);}return;}
    if(b.dataset.presetDelete!==undefined){if(focusRun.running){toast('Pause the timer first.');return;}focusPrefs.presets=(focusPrefs.presets||[]).filter((_,i)=>i!==Number(b.dataset.presetDelete));persistFocus();render();return;}
    if(b.dataset.jumpDay){ui.date=clampDate(b.dataset.jumpDay);navigate('overview');return;}
    if(b.dataset.parkRemove!==undefined){state.parkedThoughts=(state.parkedThoughts||[]).filter(x=>x.id!==b.dataset.parkRemove);save();render();toast('Thought cleared from your parking lot.');return;}
    if(b.dataset.favoriteQuote!==undefined){const i=Number(b.dataset.favoriteQuote),f=state.settings.favoriteQuotes||[];state.settings.favoriteQuotes=f.includes(i)?f.filter(x=>x!==i):[...f,i];save();render();toast(f.includes(i)?'Thought removed from your collection.':'Saved to your collection.');return;}
    if(b.dataset.nav){closeCommand();}
    if(b.dataset.toggle){toggleHabit(b.dataset.toggle);return;}
    if(b.dataset.qty){addQuantity(b.dataset.qty,Number(b.dataset.change));return;}
    if(b.dataset.mood){editLog(chosenDate()).mood=b.dataset.mood;save();render();toast('+5 XP for showing up and checking in.');return;}
    if(b.dataset.range){ui.insightPeriod=b.dataset.range;ui.insightPick='';render();return;}
    if(b.dataset.pick){ui.insightPick=b.dataset.pick;render();return;}
    if(b.dataset.redeem){redeemReward(b.dataset.redeem);return;}
    if(b.dataset.editHabit){habitModal(b.dataset.editHabit);return;}
    if(b.dataset.deleteHabit){const habit=state.habits.find(x=>x.id===b.dataset.deleteHabit);if(habit&&confirm(`Remove “${habit.title}” from your routine? Its old logs remain in your local backup until reset.`)){state.habits=state.habits.filter(x=>x.id!==habit.id);save();render();toast('Habit removed.');}return;}
    if(b.dataset.editProject){projectModal(b.dataset.editProject);return;}
    if(b.dataset.deleteProject){const project=state.projects.find(x=>x.id===b.dataset.deleteProject);if(project&&confirm(`Delete “${project.title}”?`)){state.projects=state.projects.filter(x=>x.id!==project.id);save();render();toast('Project removed.');}return;}
    if(b.dataset.template){addTemplate(Number(b.dataset.template));return;}
    if(b.dataset.projectToggle){const p=state.projects.find(x=>x.id===b.dataset.projectToggle),dt=chosenDate();if(p&&projectEligible(p,dt)){const log=editLog(dt),minutes=Number(log.projects[p.id]||0);log.projects[p.id]=minutes>=p.dailyMinutes?0:p.dailyMinutes;save();render();toast(minutes>=p.dailyMinutes?'Project log unchecked.':'+20 XP • Project day complete!');}return;}
    if(b.dataset.projectMin){const p=state.projects.find(x=>x.id===b.dataset.projectMin),dt=chosenDate();if(p&&projectEligible(p,dt)){const log=editLog(dt);log.projects[p.id]=round(Number(log.projects[p.id]||0)+Number(b.dataset.minutes||15));save();render();toast('Time logged. Keep going!');}return;}
    if(b.dataset.projectFocus){ui.focusTarget=`project:${b.dataset.projectFocus}`;focusRun.target=ui.focusTarget;persistFocus();navigate('focus');return;}
    if(b.dataset.timerLength){timerLength(Number(b.dataset.timerLength));return;}
    if(b.dataset.timerMode){timerSetMode(b.dataset.timerMode);return;}
    if(b.dataset.ambient){toggleAmbient(b.dataset.ambient);return;}
    if(!b.dataset.action)return;
    switch(b.dataset.action){
      case 'prev-day':ui.date=clampDate(shiftDay(chosenDate(),-1));render();break;
      case 'next-day':ui.date=clampDate(shiftDay(chosenDate(),1));render();break;
      case 'add-habit':habitModal();break;
      case 'add-project':projectModal();break;
      case 'close-modal':closeModal();break;
      case 'theme':state.settings.theme=state.settings.theme==='dark'?'light':'dark';save();render();break;
      case 'notifications':navigate('settings');break;
      case 'timer-toggle':timerToggle();break;
      case 'timer-reset':timerReset();break;
      case 'timer-skip':timerSkip();break;
      case 'timer-finish':timerStopwatchDone();break;
      case 'timer-fullscreen':timerFullscreen();break;
      case 'timer-settings':focusSettingsModal();break;
      case 'timer-sound':playChime();toast('Sound test played if audio is enabled.');break;
      case 'save-focus-preset':presetSave();break;
      case 'timer-finish-early':finishEarly();break;
      case 'next-quote':ui.quoteOffset=(ui.quoteOffset+1)%QUOTES.length;render();break;
      case 'open-login':ui.authGate=true;render();break;
      case 'switch-auth':authMethod=authMethod==='signup'?'signin':'signup';render();break;
      case 'auth-mode':authMethod=b.dataset.mode||'signin';render();break;
      case 'google-login':initiateGoogleAuth();break;
      case 'change-password':{
        if(!account){toast('Sign in first to change password.');break;}
        const newPass=prompt('Enter a new password for your AVENORY account (at least 6 characters):');
        if(newPass===null)break;
        if(newPass.length<6){toast('Password must be at least 6 characters.');break;}
        (async()=>{
          try{
            const token=await ensureToken();
            await cloudRequest('/auth/v1/user',{method:'PUT',token,body:{password:newPass}});
            toast('Password updated successfully.');
          }catch(err){toast(`Could not update password: ${err.message}`);}
        })();
        break;
      }
      case 'open-command':openCommand();break;
      case 'close-command':closeCommand();break;
      case 'breathe':breathModal();break;
      case 'breath-finish':clearInterval(breathHandle);closeModal();toast('You made space. Choose the next kind action.');break;
      case 'guest-enter':localStorage.setItem(GUEST_KEY,'yes');ui.authGate=false;render();window.scrollTo(0,0);break;
      case 'signout':void signOut();break;
      case 'sync-now':void flushSync(true);break;
      case 'resolve-cloud':void resolveConflict('cloud');break;
      case 'resolve-local':void resolveConflict('local');break;
      case 'export-json':exportJson();break;
      case 'export-csv':exportCsv();break;
      case 'export-calendar':exportCalendar();break;
      case 'test-notification':testNotification();break;
      case 'new-reward':customRewardModal();break;
      case 'install':void installApp();break;
      case 'reset':if(confirm('Reset your entire 90-day tracker? This permanently removes local entries, habits, and projects on this device. Export a backup first.')){localStorage.removeItem(STORE);state=freshState();ui.date=dateLocal();ui.page='overview';focusRun.running=false;focusRun.remaining=focusDuration(focusRun.mode);focusRun.elapsed=0;persistFocus();render();toast('A fresh journey begins.');}break;
    }
  }
  function handleSubmit(e){const form=e.target;if(!['habit-form','project-form','settings-form','reminder-form','reward-form','auth-form','focus-settings-form','northstar-form','park-form','focus-goal-form','custom-timer-form'].includes(form.getAttribute('id')))return;e.preventDefault();const vals=new FormData(form);
    if(form.getAttribute('id')==='custom-timer-form'){const n=Number(vals.get('minutes'));if(!Number.isInteger(n)||n<1||n>180){toast('Enter a whole number from 1 to 180 minutes.');return;}timerLength(n);toast(`Focus length set to ${n} minutes.`);return;}
    if(form.getAttribute('id')==='park-form'){const thought=String(vals.get('thought')||'').trim().slice(0,180);if(!thought)return;(state.parkedThoughts||=[]).push({id:newId('thought'),text:thought,date:dateLocal()});save();render();toast('Parked for later. Your focus is protected.');return;}
    if(form.getAttribute('id')==='focus-goal-form'){const hours=Number(vals.get('hours'));if(!Number.isFinite(hours)||hours<.5||hours>80){toast('Choose a weekly target between 0.5 and 80 hours.');return;}state.settings.weeklyFocusHours=hours;save();render();toast('Focus target updated.');return;}
    if(form.getAttribute('id')==='northstar-form'){state.settings.northStar=String(vals.get('northStar')||'').trim().slice(0,150);save();render();toast('North star saved. Return to it when your day gets loud.');return;}
    if(form.getAttribute('id')==='auth-form'){void handleAuth(vals);return;}
    if(form.getAttribute('id')==='focus-settings-form'){applyFocusSettings(vals);return;}
    if(form.getAttribute('id')==='reward-form'){const title=String(vals.get('title')||'').trim();const cost=Number(vals.get('cost'));if(!title||!Number.isInteger(cost)||cost<50||cost>10000){toast('Enter a reward name and XP cost from 50 to 10,000.');return;}(state.customRewards||=[]).push({id:newId('custom'),title:title.slice(0,80),description:String(vals.get('description')||'').slice(0,180),cost});save();closeModal();render();toast('Your personal reward is ready!');return;}
    if(form.getAttribute('id')==='habit-form'){
      const id=String(vals.get('id')||'');const old=state.habits.find(x=>x.id===id);
      const title=String(vals.get('title')||'').trim(),days=vals.getAll('days').map(Number);if(!title||!days.length){toast('Add a name and choose at least one weekday.');return;}
      const kind=String(vals.get('kind')||'binary');const target=kind==='binary'?1:Number(vals.get('target'));const step=kind==='binary'?1:Number(vals.get('step'));if(!['binary','min','max'].includes(kind)||!(target>0)||!(step>0)){toast('Please enter a positive target and increment.');return;}
      const item={id:old?.id||newId('habit'),title:title.slice(0,70),caption:String(vals.get('caption')||'').slice(0,120),icon:ICONS.has(vals.get('icon'))?vals.get('icon'):'target',color:['blue','green','orange'].includes(vals.get('color'))?vals.get('color'):'blue',category:String(vals.get('category')||'Growth'),kind,target:round(target),unit:kind==='binary'?'':String(vals.get('unit')||'min').slice(0,16),step:round(step),days,startDate:String(vals.get('startDate')||dateLocal()),reminder:String(vals.get('reminder')||''),points:[10,20,30].includes(Number(vals.get('points')))?Number(vals.get('points')):20};
      if(old)Object.assign(old,item);else state.habits.push(item);save();closeModal();render();toast(old?'Habit updated.':'New habit added!');return;
    }
    if(form.getAttribute('id')==='project-form'){
      const id=String(vals.get('id')||'');const old=state.projects.find(x=>x.id===id);
      const title=String(vals.get('title')||'').trim(),durationDays=Number(vals.get('durationDays')),dailyMinutes=Number(vals.get('dailyMinutes'));
      if(!title||!Number.isInteger(durationDays)||durationDays<1||durationDays>90||dailyMinutes<5||dailyMinutes>1440){toast('Check the project title, days, and minutes.');return;}
      const item={id:old?.id||newId('project'),title:title.slice(0,80),description:String(vals.get('description')||'').slice(0,350),category:String(vals.get('category')||'Learning'),durationDays,dailyMinutes,startDate:String(vals.get('startDate')||dateLocal()),icon:old?.icon||'target'};
      if(old)Object.assign(old,item);else state.projects.push(item);save();closeModal();render();toast(old?'Project updated.':'Your new project is ready.');return;
    }
    if(form.getAttribute('id')==='settings-form'){
      const date=String(vals.get('startDate')||'');if(!/^\d{4}-\d\d-\d\d$/.test(date)||date>dateLocal()){toast('Start date cannot be in the future.');return;}
      state.settings.name=String(vals.get('name')||'You').trim().slice(0,35)||'You';state.settings.startDate=date;state.settings.theme=vals.get('theme')==='dark'?'dark':'light';ui.date=clampDate(dateLocal());save();render();toast('Preferences saved.');return;
    }
    if(form.getAttribute('id')==='reminder-form'){state.settings.morning=String(vals.get('morning')||'08:00');state.settings.evening=String(vals.get('evening')||'21:00');save();render();toast('Reminder times updated.');}
  }
  document.addEventListener('click',handleClick);
  document.addEventListener('submit',handleSubmit);
  document.addEventListener('change',async e=>{
    const el=e.target;
    if(el.dataset.qtyInput){writeQuantity(el.dataset.qtyInput,el.value);return;}
    if(el.dataset.lensHabit){ui.habitDetail=el.value;render();return;}
    if(el.dataset.focusTarget){ui.focusTarget=el.value;focusRun.target=el.value;persistFocus();return;}
    if(el.dataset.focusTask!==undefined){focusRun.task=el.value.slice(0,160);persistFocus();return;}
    if(el.dataset.notificationToggle!==undefined){await enableNotification(el.checked);return;}
    if(el.id==='northstar'){state.settings.northStar=String(el.value||'').trim().slice(0,150);save();toast('North star saved.');return;}
    if(el.dataset.importFile!==undefined){const file=el.files&&el.files[0];if(!file)return;try{
        if(file.size>5_000_000)throw Error('Backup too large');const obj=JSON.parse(await file.text());
        if(!obj||!Array.isArray(obj.habits)||!Array.isArray(obj.projects)||!obj.settings||!obj.logs||!/^\d{4}-\d\d-\d\d$/.test(obj.settings.startDate))throw Error('Not a valid backup file');
        if(!confirm('Replace all current local data with this backup? We recommend exporting a backup first.')){el.value='';return;}
        state=sanitizeState(obj);ui.date=dateLocal();save();render();toast('Backup imported successfully.');
      }catch(err){toast(`Could not import: ${err.message}`);}finally{el.value='';}return;}
    if(el.id==='habit-kind'){const area=document.getElementById('habit-number-fields');if(area)area.style.display=el.value==='binary'?'none':'block';return;}
    if(el.dataset.note!==undefined){editLog(chosenDate()).note=el.value.slice(0,1200);save();render();toast('Reflection saved.');return;}
  });
  document.addEventListener('click',e=>{if(e.target.matches('[data-dismiss-overlay]')){clearInterval(breathHandle);closeModal();} if(e.target.matches('[data-command-close]'))closeCommand();});
  document.addEventListener('keydown',e=>{
    const modalRoot=document.getElementById('modal-root'),panel=modalRoot?.querySelector('.modal-panel');
    const cmdRoot=document.getElementById('command-root'),cmdPanel=cmdRoot?.querySelector('.v4-command-modal');
    const activeDialog=panel||cmdPanel;
    if(activeDialog){
      if(e.key==='Escape'){clearInterval(breathHandle);closeModal();closeCommand();return;}
      if(e.key==='Tab'){
        const focusables=Array.from(activeDialog.querySelectorAll('button:not([disabled]),input:not([type=hidden]):not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]'));
        if(focusables.length>0){
          const first=focusables[0],last=focusables[focusables.length-1];
          if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
          else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
        }
      }
      return;
    }
    if(e.key==='Escape'){clearInterval(breathHandle);closeModal();closeCommand();}
    if(e.key==='/'&&!e.target.closest('input,textarea,select,[contenteditable]')){e.preventDefault();openCommand();}
    if(e.key==='Enter'&&e.target.matches('[data-quick-qty]')){e.preventDefault();e.target.click();}
    if(ui.page==='focus'&&!ui.authGate&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.target.closest('input,textarea,select,button,[contenteditable]')){
      if(e.code==='Space'){e.preventDefault();timerToggle();}
      else if(e.key.toLowerCase()==='r'){timerReset();}
      else if(e.key.toLowerCase()==='f'){timerFullscreen();}
    }
  });
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){tickTimer();checkReminders();if(account)void refreshCloud();}});
  window.addEventListener('online',()=>{if(account)void flushSync();});
  if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('Offline cache unavailable:',e)));
  }
  setInterval(()=>{tickTimer();checkReminders();},1000);
  setInterval(()=>{if(account&&!unsynced&&!syncInFlight)void refreshCloud()},45000);
  render();
  (async()=>{
    const handled=await handleAuthRedirect();
    if(!handled)await resumeAuth();
  })();
  tickTimer();
  checkReminders();
})();
