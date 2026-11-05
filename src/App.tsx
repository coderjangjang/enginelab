import {useEffect,useMemo,useState} from 'react'
import Viewer from './components/Viewer'
import {LeftPanel,DataPanel,CylPanel,PartPanel,ControlBar} from './components/Panels'
import DynoPanel from './components/DynoPanel'
import {Library,Compare,SettingsPage,Settings} from './components/Pages'
import {Btn} from './components/ui'
import {Sim} from './sim/Sim'
import {EngineAudio} from './sim/audio'
import {getEngine} from './data/engines'
import {PartType} from './data/parts'
type Page='sim'|'lib'|'cmp'|'set';type Tab='data'|'cyl'|'part'|'dyno'
const NAV:[Page,string][]=[['sim','Simulator'],['lib','Engine Library'],['cmp','Compare'],['set','Settings']]
const TABS:[Tab,string][]=[['data','Data'],['cyl','Cylinders'],['part','Part'],['dyno','Dyno']]
export default function App(){
const [page,setPage]=useState<Page>('sim'),[eid,setEid]=useState('v8'),[sel,setSel]=useState<string|null>(null),[hidden,setHidden]=useState<PartType[]>([]),[tab,setTab]=useState<Tab>('data'),[reset,setReset]=useState(0)
const [st,setSt]=useState<Settings>({bg:'black',sound:true,volume:.5})
const sim=useMemo(()=>{const s=new Sim();s.setEngine(getEngine('v8'));return s},[]),audio=useMemo(()=>new EngineAudio(),[])
const [snap,setSnap]=useState(()=>sim.snap()),refresh=()=>setSnap(sim.snap()),cfg=getEngine(eid)
useEffect(()=>{const id=setInterval(()=>{setSnap(sim.snap());audio.update(sim,st.sound,st.volume)},80);return()=>clearInterval(id)},[st,sim,audio])
const pick=(id:string)=>{setEid(id);sim.setEngine(getEngine(id));setSel(null);setReset(r=>r+1);refresh()}
const select=(id:string|null)=>{setSel(id);if(id)setTab('part')}
const toggle=(t:PartType)=>setHidden(h=>h.includes(t)?h.filter(x=>x!==t):[...h,t])
const start=()=>{audio.resume();sim.start();refresh()}
const ex=(t:number)=>{sim.exp.t=t;refresh()}
return <div className="h-full flex flex-col bg-white text-black">
<header className="h-12 shrink-0 border-b border-black flex items-center justify-between px-4"><div className="font-semibold tracking-[.25em] text-sm">ENGINE LAB</div>
<nav className="flex gap-1 sm:gap-4 text-[11px] sm:text-xs uppercase tracking-[.1em]">{NAV.map(([k,n])=><button key={k} onClick={()=>setPage(k)} className={`px-1 py-1 border-b ${page===k?'border-black':'border-transparent text-mid hover:text-black'}`}>{n}</button>)}</nav></header>
<main className="flex-1 min-h-0 overflow-y-auto">
{page==='lib'&&<Library open={id=>{pick(id);setPage('sim')}}/>}{page==='cmp'&&<Compare/>}{page==='set'&&<SettingsPage st={st} set={setSt}/>}
{page==='sim'&&<div className="flex flex-col lg:h-full lg:grid lg:grid-cols-[260px_minmax(0,1fr)_330px] lg:grid-rows-[minmax(0,1fr)_auto]">
<section className="relative h-[60vh] lg:h-auto lg:col-start-2 lg:row-start-1 border-b border-black">
<Viewer sim={sim} cfg={cfg} sel={sel} hidden={hidden} onSelect={select} bg={st.bg} reset={reset}/>
<div className="absolute top-3 left-3 right-3 flex flex-wrap items-center gap-2 pointer-events-none [&>*]:pointer-events-auto">
<Btn onClick={()=>ex(1)}>Explode</Btn><Btn onClick={()=>ex(0)}>Assemble</Btn>
<div className="bg-white border border-black px-3 py-1 w-44"><div className="flex justify-between text-[10px] uppercase tracking-widest"><span>Exploded</span><span className="font-mono">{Math.round(snap.exp*100)}%</span></div>
<input type="range" min={0} max={100} value={Math.round(snap.exp*100)} onChange={e=>{sim.exp.v=sim.exp.t=+e.target.value/100;refresh()}}/></div>
<Btn onClick={()=>setSt({...st,bg:st.bg==='black'?'light':'black'})}>{st.bg==='black'?'Light':'Dark'}</Btn><Btn onClick={()=>setReset(r=>r+1)}>Reset view</Btn></div></section>
<div className="lg:col-start-2 lg:row-start-2"><ControlBar sim={sim} s={snap} refresh={refresh} onStart={start}/></div>
<div className="lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:overflow-y-auto border-t lg:border-t-0 lg:border-r border-black"><LeftPanel cfg={cfg} pick={pick} sel={sel} select={select} hidden={hidden} toggle={toggle} showAll={()=>setHidden([])}/></div>
<aside className="lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:overflow-y-auto border-t lg:border-t-0 lg:border-l border-black bg-white">
<div className="flex border-b border-black sticky top-0 bg-white z-10">{TABS.map(([k,n])=><button key={k} onClick={()=>setTab(k)} className={`flex-1 h-10 text-[11px] uppercase tracking-[.1em] ${tab===k?'bg-black text-white':'hover:bg-mist'}`}>{n}</button>)}</div>
<div className="p-4">{tab==='data'&&<DataPanel s={snap} cfg={cfg}/>}{tab==='cyl'&&<CylPanel s={snap} cfg={cfg}/>}{tab==='part'&&<PartPanel sel={sel} hidden={hidden} toggle={toggle} clear={()=>setSel(null)}/>}{tab==='dyno'&&<DynoPanel sim={sim} s={snap} cfg={cfg} refresh={refresh} onStart={()=>audio.resume()}/>}</div></aside></div>}
</main></div>}
