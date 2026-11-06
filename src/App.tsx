import {useCallback,useEffect,useMemo,useRef,useState} from 'react'
import Viewer from './components/Viewer'
import {LeftPanel,DataPanel,CylPanel,PartPanel,ControlBar} from './components/Panels'
import DynoPanel from './components/DynoPanel'
import LabPanel,{type Hist} from './components/LabPanel'
import {Library,Compare,SettingsPage,Settings,DEFAULT_SETTINGS} from './components/Pages'
import {Btn} from './components/ui'
import {Sim} from './sim/Sim'
import {EngineAudio} from './sim/audio'
import {ENGINES,getEngine} from './data/engines'
import {PartType} from './data/parts'
type Page='sim'|'lib'|'cmp'|'set';type Tab='data'|'cyl'|'part'|'dyno'|'lab'
const NAV:[Page,string][]=[['sim','Simulator'],['lib','Engine Library'],['cmp','Compare'],['set','Settings']]
const TABS:[Tab,string][]=[['data','Data'],['cyl','Cylinders'],['part','Part'],['dyno','Dyno'],['lab','Lab']]
const SKEY='enginelab.settings'
const loadSt=():Settings=>{try{return {...DEFAULT_SETTINGS,...JSON.parse(localStorage.getItem(SKEY)??'{}')}}catch{return DEFAULT_SETTINGS}}
const initId=()=>{const h=location.hash.slice(1);return ENGINES.some(e=>e.id===h)?h:'v8'}
export default function App(){
const [page,setPage]=useState<Page>('sim'),[eid,setEid]=useState(initId),[sel,setSel]=useState<string|null>(null),[hidden,setHidden]=useState<PartType[]>([]),[tab,setTab]=useState<Tab>('data'),[reset,setReset]=useState(0),[spin,setSpin]=useState(false)
const [st,setSt]=useState<Settings>(loadSt)
const sim=useMemo(()=>{const s=new Sim();s.setEngine(getEngine(eid));return s},[]),audio=useMemo(()=>new EngineAudio(),[])
const [snap,setSnap]=useState(()=>sim.snap()),refresh=useCallback(()=>setSnap(sim.snap()),[sim]),cfg=getEngine(eid)
const hist=useRef<Hist[]>([]),t0=useRef(performance.now()),view=useRef<HTMLElement>(null),fpsEl=useRef<HTMLSpanElement>(null)
const rec=(n:ReturnType<Sim['snap']>)=>{const h=hist.current;h.push({t:+((performance.now()-t0.current)/1000).toFixed(2),rpm:Math.round(n.rpm),thr:Math.round(n.thr*100),tq:Math.round(n.tq),hp:Math.round(n.hp)});if(h.length>600)h.shift()}
useEffect(()=>{try{localStorage.setItem(SKEY,JSON.stringify(st))}catch{}},[st])
useEffect(()=>{audio.setRoute(st.mode,st.view)},[st.mode,st.view,audio])
useEffect(()=>{const id=setInterval(()=>{const n=sim.snap();setSnap(n);rec(n);audio.update(sim,st.sound&&!document.hidden,st.volume)},80);return()=>clearInterval(id)},[st.sound,st.volume,sim,audio])
const pick=useCallback((id:string)=>{setEid(id);sim.setEngine(getEngine(id));setSel(null);setReset(r=>r+1);history.replaceState(null,'','#'+id);refresh()},[sim,refresh])
const select=useCallback((id:string|null)=>{setSel(id);if(id)setTab('part')},[])
const toggle=useCallback((t:PartType)=>setHidden(h=>h.includes(t)?h.filter(x=>x!==t):[...h,t]),[])
const showAll=useCallback(()=>setHidden([]),[])
const start=()=>{void audio.resume();sim.start();refresh()}
const ex=(t:number)=>{sim.exp.t=t;refresh()}
const shot=()=>{view.current?.querySelector('canvas')?.toBlob(b=>{if(!b)return;const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`enginelab_${cfg.id}.png`;a.click();URL.revokeObjectURL(a.href)})}
useEffect(()=>{const f=(e:KeyboardEvent)=>{if(page!=='sim'||e.metaKey||e.ctrlKey||e.altKey)return;const el=e.target as HTMLElement;if(/INPUT|SELECT|TEXTAREA/.test(el.tagName))return
if(e.code==='Space'){e.preventDefault();sim.paused=!sim.paused}
else if(e.code==='KeyS'){if(sim.running||sim.starting>0)sim.stop();else{void audio.resume();sim.start()}}
else if(e.code==='KeyE')sim.exp.t=sim.exp.t>.5?0:1
else if(e.code==='KeyR')setReset(r=>r+1)
else if(e.code==='KeyO')setSpin(v=>!v)
else if(e.code==='KeyM')setSt(s=>({...s,sound:!s.sound}))
else if(e.key==='Escape')setSel(null)
else return
if(el.tagName==='BUTTON')el.blur();refresh()}
addEventListener('keydown',f);return()=>removeEventListener('keydown',f)},[page,sim,audio,refresh])
return <div className="h-full flex flex-col bg-white text-black">
<header className="h-12 shrink-0 border-b border-black flex items-center justify-between px-4"><div className="font-semibold tracking-[.25em] text-sm">ENGINE LAB</div>
<nav className="flex gap-1 sm:gap-4 text-[11px] sm:text-xs uppercase tracking-[.1em]">{NAV.map(([k,n])=><button key={k} onClick={()=>setPage(k)} className={`px-1 py-1 border-b ${page===k?'border-black':'border-transparent text-mid hover:text-black'}`}>{n}</button>)}</nav></header>
<main className="flex-1 min-h-0 overflow-y-auto">
{page==='lib'&&<Library open={id=>{pick(id);setPage('sim')}}/>}{page==='cmp'&&<Compare/>}{page==='set'&&<SettingsPage st={st} set={setSt} audio={audio}/>}
{page==='sim'&&<div className="flex flex-col lg:h-full lg:grid lg:grid-cols-[260px_minmax(0,1fr)_330px] lg:grid-rows-[minmax(0,1fr)_auto]">
<section ref={view} className="relative h-[60vh] lg:h-auto lg:col-start-2 lg:row-start-1 border-b border-black">
<Viewer sim={sim} cfg={cfg} sel={sel} hidden={hidden} onSelect={select} bg={st.bg} reset={reset} spin={spin} quality={st.quality} fpsEl={fpsEl}/>
<div className="absolute top-3 left-3 right-3 flex flex-wrap items-center gap-2 pointer-events-none [&>*]:pointer-events-auto">
<Btn onClick={()=>ex(1)}>Explode</Btn><Btn onClick={()=>ex(0)}>Assemble</Btn>
<div className="bg-white border border-black px-3 py-1 w-44"><div className="flex justify-between text-[10px] uppercase tracking-widest"><span>Exploded</span><span className="font-mono">{Math.round(snap.exp*100)}%</span></div>
<input type="range" min={0} max={100} value={Math.round(snap.exp*100)} onChange={e=>{sim.exp.v=sim.exp.t=+e.target.value/100;refresh()}}/></div>
<Btn onClick={()=>setSt({...st,bg:st.bg==='black'?'light':'black'})}>{st.bg==='black'?'Light':'Dark'}</Btn><Btn onClick={()=>setReset(r=>r+1)}>Reset view</Btn><Btn a={spin} onClick={()=>setSpin(v=>!v)}>Orbit</Btn><Btn onClick={shot}>Snapshot</Btn></div>
{st.fps&&<span ref={fpsEl} className="absolute bottom-2 right-3 font-mono text-[11px] text-mid"/>}</section>
<div className="lg:col-start-2 lg:row-start-2"><ControlBar sim={sim} s={snap} refresh={refresh} onStart={start}/></div>
<div className="lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:overflow-y-auto border-t lg:border-t-0 lg:border-r border-black"><LeftPanel cfg={cfg} pick={pick} sel={sel} select={select} hidden={hidden} toggle={toggle} showAll={showAll}/></div>
<aside className="lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:overflow-y-auto border-t lg:border-t-0 lg:border-l border-black bg-white">
<div className="flex border-b border-black sticky top-0 bg-white z-10">{TABS.map(([k,n])=><button key={k} onClick={()=>setTab(k)} className={`flex-1 h-10 text-[10px] uppercase tracking-[.06em] ${tab===k?'bg-black text-white':'hover:bg-mist'}`}>{n}</button>)}</div>
<div className="p-4">{tab==='data'&&<DataPanel s={snap} cfg={cfg}/>}{tab==='cyl'&&<CylPanel s={snap} cfg={cfg} sim={sim} refresh={refresh}/>}{tab==='part'&&<PartPanel sel={sel} hidden={hidden} toggle={toggle} clear={()=>setSel(null)}/>}{tab==='lab'&&<LabPanel sim={sim} s={snap} refresh={refresh} onStart={()=>void audio.resume()} hist={hist.current} clear={()=>{hist.current.length=0}}/>}{tab==='dyno'&&<DynoPanel sim={sim} s={snap} cfg={cfg} refresh={refresh} onStart={()=>void audio.resume()}/>}</div></aside></div>}
</main></div>}
