import {Btn,Slider,Row,H} from './ui'
import {EngineConfig,ENGINES,cylLayout} from '../data/engines'
import {PARTS,PART_TYPES,PartType} from '../data/parts'
import {Sim,Snap} from '../sim/Sim'
const STROKES=['Intake','Compression','Power','Exhaust']
const first=(t:PartType)=>t==='block'||t==='crank'?t:`${t}-0`
export function LeftPanel({cfg,pick,sel,select,hidden,toggle,showAll}:{cfg:EngineConfig;pick:(id:string)=>void;sel:string|null;select:(id:string)=>void;hidden:PartType[];toggle:(t:PartType)=>void;showAll:()=>void}){
const info=cfg.layout==='inline'?'Inline':cfg.banks.length>1?`${cfg.layout.toUpperCase()} · ${cfg.banks.length} banks`:''
return <aside className="p-4 space-y-6 bg-white">
<section><H>Engine</H><div className="grid grid-cols-2 gap-px bg-mid border border-mid">{ENGINES.map(e=><button key={e.id} onClick={()=>pick(e.id)} className={`h-9 text-xs last:col-span-2 ${e.id===cfg.id?'bg-black text-white':'bg-white hover:bg-mist'}`}>{e.name}</button>)}</div></section>
<section><H>Configuration</H><Row k="Cylinders" v={cfg.cyl}/><Row k="Layout" v={info}/><Row k="Displacement" v={cfg.dispL.toFixed(1)+' L'}/><Row k="Firing interval" v={(720/cfg.cyl).toFixed(1)+'°'}/><Row k="Firing order" v={cfg.firing.join('-')}/>
<p className="text-[11px] leading-relaxed text-mid mt-2">{cfg.note}</p></section>
<section><div className="flex justify-between items-center"><H>Parts</H><button onClick={showAll} className="text-[10px] uppercase tracking-widest underline mb-2">Show all</button></div>
{PART_TYPES.map(t=>{const h=hidden.includes(t),on=sel===t||sel?.startsWith(t+'-')
return <div key={t} className="flex items-center border-b border-mist"><button onClick={()=>select(first(t))} className={`flex-1 text-left text-xs py-2 px-1 ${on?'bg-black text-white':h?'text-mid line-through':''}`}>{PARTS[t].name}</button>
<button onClick={()=>toggle(t)} title={h?'Show':'Hide'} className="w-8 h-8 flex items-center justify-center"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#000" strokeWidth="1"><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/>{h&&<path d="M2 14L14 2"/>}</svg></button></div>})}</section></aside>}
const G=({k,tag,v,p}:{k:string;tag:string;v:string;p:number})=><div className="py-2 border-b border-mist"><div className="flex justify-between items-baseline"><span className="text-[11px] uppercase tracking-[.1em] text-mid">{k}<span className="ml-2 text-[9px] border border-mid px-1">{tag}</span></span><span className="font-mono text-sm tabular-nums">{v}</span></div>
<div className="h-[2px] bg-mist mt-2"><div className="h-full bg-black" style={{width:`${Math.max(0,Math.min(1,p))*100}%`}}/></div></div>
export function DataPanel({s,cfg}:{s:Snap;cfg:EngineConfig}){const tp=cfg.dispL*118,hpm=tp*cfg.redline/7127
const st=s.dyno.active?'DYNO TEST':s.starting?'CRANKING':s.paused?'PAUSED':s.running?'RUNNING':'STOPPED'
return <div><div className="mb-4"><div className="text-[10px] uppercase tracking-[.14em] text-mid">{st}</div><div className="font-mono text-5xl tabular-nums">{Math.round(s.rpm)}<span className="text-xs text-mid ml-2">RPM</span></div></div>
<G k="RPM" tag="SIM" v={Math.round(s.rpm)+''} p={s.rpm/s.max}/><G k="Torque" tag="EST" v={s.tq.toFixed(0)+' Nm'} p={s.tq/tp}/><G k="Horsepower" tag="EST" v={s.hp.toFixed(0)+' HP'} p={s.hp/hpm}/>
<G k="Engine Temp" tag="EST" v={s.temp.toFixed(0)+' °C'} p={s.temp/120}/><G k="Oil Pressure" tag="EST" v={s.oil.toFixed(1)+' bar'} p={s.oil/5.5}/>
<G k="Throttle" tag="INPUT" v={(s.thr*100).toFixed(0)+' %'} p={s.thr}/><G k="Engine Load" tag="INPUT" v={(s.load*100).toFixed(0)+' %'} p={s.load}/><G k="Firing Freq" tag="CALC" v={s.freq.toFixed(1)+' Hz'} p={s.freq/(s.max/120*cfg.cyl)}/>
<p className="text-[10px] text-mid mt-3 leading-relaxed">EST = 시뮬레이션 추정값(실측 아님) · CALC = 입력값에서 계산 · INPUT/SIM = 조작값/시뮬레이션 상태</p></div>}
export function CylPanel({s,cfg,sim,refresh}:{s:Snap;cfg:EngineConfig;sim:Sim;refresh:()=>void}){const {cyls}=cylLayout(cfg)
return <div><H>Firing order {cfg.firing.join('-')}</H><p className="text-[10px] text-mid mb-2">행을 클릭하면 해당 실린더의 점화를 차단(Cylinder cut)합니다.</p><table className="w-full text-xs"><thead><tr className="text-left text-mid text-[10px] uppercase tracking-wider"><th className="py-1">Cyl</th><th>Bank</th><th>Stroke</th><th>IN/EX</th></tr></thead><tbody>
{cyls.map(c=>{const ph=(((s.crank+c.off)%720)+720)%720,k=Math.floor(ph/180),pw=k===2
const cut=s.cut[c.i];return <tr key={c.i} onClick={()=>{sim.cut[c.i]=!sim.cut[c.i];refresh()}} className={`border-t border-mist cursor-pointer ${cut?'text-mid line-through':pw&&s.rpm>20?'bg-black text-white':''}`}><td className="py-1.5 font-mono">{c.i+1}</td><td className="font-mono">{c.bank+1}</td><td>{cut?'CUT OFF':STROKES[k]}</td><td className="font-mono">{ph<200?'IN':ph>=520?'EX':'—'}</td></tr>})}</tbody></table></div>}
export function PartPanel({sel,hidden,toggle,clear}:{sel:string|null;hidden:PartType[];toggle:(t:PartType)=>void;clear:()=>void}){
if(!sel)return <p className="text-xs text-mid leading-relaxed">3D 뷰어 또는 Parts 목록에서 부품을 선택하면 이름·역할이 표시되고 카메라가 해당 부품으로 이동합니다.</p>
const [t0,n]=sel.split('-'),t=t0 as PartType,p=PARTS[t],bank=t==='cam'||t==='imanifold'||t==='emanifold'
return <div><H>Selected part</H><div className="text-xl">{p.name}</div>{n!==undefined&&<div className="font-mono text-xs text-mid mb-3">{bank?'Bank':'Cylinder'} {+n+1}</div>}
<p className="text-xs leading-relaxed mt-2">{p.desc}</p><div className="flex gap-2 mt-4"><Btn onClick={()=>toggle(t)}>{hidden.includes(t)?'Show type':'Hide type'}</Btn><Btn onClick={clear}>Deselect</Btn></div></div>}
export function ControlBar({sim,s,refresh,onStart}:{sim:Sim;s:Snap;refresh:()=>void;onStart:()=>void}){
const set=(f:()=>void)=>(v:number)=>{void v;f();refresh()}
const on=s.running||s.starting
return <div className="p-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-4 items-end bg-white">
<div className="flex flex-wrap gap-2 xl:col-span-4"><Btn a={on} disabled={on} onClick={onStart}>Engine Start</Btn><Btn disabled={!on} onClick={()=>{sim.stop();refresh()}}>Engine Stop</Btn>
<Btn a={s.paused} onClick={()=>{sim.paused=!sim.paused;refresh()}}>{s.paused?'Resume':'Pause'}</Btn></div>
<Slider label="RPM" value={s.cmd} min={0} max={10000} step={50} disabled={s.auto.on&&s.auto.target!=='throttle'} onChange={v=>{sim.cmd=v;refresh()}}/>
<Slider label="Throttle" value={Math.round(s.thr*100)} min={0} max={100} unit=" %" disabled={s.dyno.active||(s.auto.on&&s.auto.target!=='rpm')} onChange={v=>{sim.throttle=v/100;refresh()}}/>
<Slider label="Engine Load" value={Math.round(s.load*100)} min={0} max={100} unit=" %" onChange={v=>{sim.load=v/100;refresh()}}/>
<Slider label="Sim Speed" value={s.speed} min={.1} max={3} step={.1} unit="×" onChange={v=>{sim.speed=v;refresh()}}/>
<Slider label="Idle RPM" value={s.idle} min={500} max={1500} step={50} onChange={v=>{sim.idle=Math.min(v,sim.max-500);refresh()}}/>
<Slider label="Maximum RPM" value={s.max} min={3000} max={10000} step={100} onChange={v=>{sim.max=Math.max(v,sim.idle+500);refresh()}}/></div>}
