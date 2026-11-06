import {useState} from 'react'
import {Btn,H,Slider} from './ui'
import {Chart,csv,download} from './DynoPanel'
import {Sim,Snap,AutoMode,AutoTarget} from '../sim/Sim'
export interface Hist{t:number;rpm:number;thr:number;tq:number;hp:number}
interface Preset{name:string;mode:AutoMode;target:AutoTarget;min:number;max:number;period:number;loop:boolean}
const KEY='enginelab.labpresets'
const load=():Preset[]=>{try{return JSON.parse(localStorage.getItem(KEY)??'[]')}catch{return[]}}
const MODES:[AutoMode,string,string][]=[['ramp','Ramp','최소→최대로 올린 뒤 처음으로 복귀'],['pingpong','Ping-pong','최소↔최대를 왕복'],['sine','Sine','사인파로 부드럽게 반복'],['step','Staircase','5단계 계단식 증가'],['blip','Rev blip','짧게 밟았다 떼는 레브 블립']]
const TARGETS:[AutoTarget,string][]=[['throttle','Throttle'],['rpm','RPM'],['both','Both']]
const BUILT:Preset[]=[{name:'Full sweep 0→100% (1회)',mode:'ramp',target:'throttle',min:0,max:1,period:10,loop:false},{name:'Rev blips',mode:'blip',target:'both',min:.1,max:1,period:2.5,loop:true},{name:'Idle ↔ Redline',mode:'pingpong',target:'rpm',min:0,max:1,period:12,loop:true},{name:'Staircase run-up (1회)',mode:'step',target:'both',min:.2,max:1,period:10,loop:false}]
export default function LabPanel({sim,s,refresh,onStart,hist,clear}:{sim:Sim;s:Snap;refresh:()=>void;onStart:()=>void;hist:Hist[];clear:()=>void}){
const [pre,setPre]=useState<Preset[]>(load),A=s.auto,up=(f:()=>void)=>{f();refresh()}
const put=(l:Preset[])=>{setPre(l);try{localStorage.setItem(KEY,JSON.stringify(l))}catch{}}
const run=(p:Partial<typeof sim.auto>={})=>up(()=>{onStart();Object.assign(sim.auto,p,{t:0,on:true,hold:false});if(!sim.running&&sim.starting<=0)sim.start()})
const apply=(p:Preset)=>run({mode:p.mode,target:p.target,min:p.min,max:p.max,period:p.period,loop:p.loop})
const state=!A.on?'OFF':!s.running?'WAITING FOR ENGINE':A.hold?'HOLD':'RUNNING'
const w=hist.slice(-375).filter((_,i)=>i%3===0),end=w.length?w[w.length-1].t:0,data=w.map(p=>({...p,t:+(p.t-end).toFixed(1)}))
return <div className="space-y-6">
<section><H>Auto throttle</H>
<div className="text-[10px] uppercase tracking-[.14em] text-mid mb-1">Target</div>
<div className="grid grid-cols-3 gap-px bg-mid border border-mid mb-3">{TARGETS.map(([k,n])=><button key={k} onClick={()=>up(()=>{sim.auto.target=k})} className={`h-8 text-xs ${A.target===k?'bg-black text-white':'bg-white hover:bg-mist'}`}>{n}</button>)}</div>
<div className="text-[10px] uppercase tracking-[.14em] text-mid mb-1">Pattern</div>
<div className="border border-mid mb-3">{MODES.map(([k,n,d])=><button key={k} onClick={()=>up(()=>{sim.auto.mode=k})} className={`w-full text-left px-2 py-1.5 border-b last:border-b-0 border-mist ${A.mode===k?'bg-black text-white':'hover:bg-mist'}`}><div className="text-xs">{n}</div><div className={`text-[10px] ${A.mode===k?'text-white':'text-mid'}`}>{d}</div></button>)}</div>
<div className="space-y-3">
<Slider label="Min" value={Math.round(A.min*100)} min={0} max={100} unit=" %" onChange={v=>up(()=>{sim.auto.min=Math.min(v/100,sim.auto.max-.05)})}/>
<Slider label="Max" value={Math.round(A.max*100)} min={0} max={100} unit=" %" onChange={v=>up(()=>{sim.auto.max=Math.max(v/100,sim.auto.min+.05)})}/>
<Slider label="Period" value={A.period} min={1} max={30} step={.5} unit=" s" onChange={v=>up(()=>{sim.auto.period=v})}/></div>
<div className="flex flex-wrap gap-2 mt-3"><Btn a={A.loop} onClick={()=>up(()=>{sim.auto.loop=!sim.auto.loop})}>Loop</Btn><Btn a={A.on} disabled={A.on} onClick={()=>run()}>Start</Btn><Btn a={A.hold} disabled={!A.on} onClick={()=>up(()=>{sim.auto.hold=!sim.auto.hold})}>{A.hold?'Resume':'Hold'}</Btn><Btn disabled={!A.on} onClick={()=>up(()=>{sim.auto.on=false})}>Stop</Btn></div>
<div className="mt-3 text-xs flex justify-between"><span className="text-mid">{state}</span><span className="font-mono">{A.on?`${(A.t%A.period).toFixed(1)} / ${A.period.toFixed(1)} s · `:''}{Math.round(A.v*100)} %</span></div>
<div className="h-[2px] bg-mist mt-1"><div className="h-full bg-black" style={{width:`${A.on?(A.t%A.period)/A.period*100:0}%`}}/></div>
<p className="text-[10px] text-mid mt-2 leading-relaxed">Hold: 현재 값을 유지 · 자동 조절 중인 슬라이더는 잠기지만 값은 계속 움직입니다.</p></section>
<section><H>Scope (last 30 s)</H><div className="text-[10px] uppercase tracking-widest text-mid">RPM</div><Chart x="t" h={90} data={data} lines={[{k:'rpm',n:'RPM',c:'#000000'}]}/>
<div className="text-[10px] uppercase tracking-widest text-mid">Throttle (%)</div><Chart x="t" h={90} data={data} lines={[{k:'thr',n:'Throttle',c:'#808080'}]}/>
<div className="flex gap-2 mt-2"><Btn disabled={!hist.length} onClick={()=>download('enginelab_log.csv',csv([['t_s','rpm','throttle_pct','torque_nm_est','power_hp_est'],...hist.map(p=>[p.t,p.rpm,p.thr,p.tq,p.hp])]))}>Export log CSV</Btn><Btn onClick={clear}>Clear</Btn></div></section>
<section><H>Presets</H><div className="grid gap-2">{BUILT.map(p=><Btn key={p.name} onClick={()=>apply(p)}>{p.name}</Btn>)}</div>
{pre.map((p,i)=><div key={i} className="flex items-center border-b border-mist"><button className="flex-1 text-left text-xs py-2 hover:bg-mist px-1" onClick={()=>apply(p)}>{p.name}<span className="ml-2 font-mono text-[10px] text-mid">{p.mode} · {p.target} · {Math.round(p.min*100)}–{Math.round(p.max*100)}% · {p.period}s</span></button><button className="text-[10px] uppercase tracking-widest underline px-2" onClick={()=>put(pre.filter((_,j)=>j!==i))}>Del</button></div>)}
<Btn className="mt-2" onClick={()=>{const n=prompt('프리셋 이름','My preset');if(n)put([...pre,{name:n,mode:A.mode,target:A.target,min:A.min,max:A.max,period:A.period,loop:A.loop}])}}>Save current as preset</Btn></section>
<section><H>Cylinder cut</H><div className="font-mono text-xs mb-2">{s.cut.filter(x=>!x).length} / {s.cut.length} cylinders firing</div>
<div className="flex flex-wrap gap-2"><Btn onClick={()=>up(()=>{sim.cut.fill(false)})}>All on</Btn><Btn onClick={()=>up(()=>{sim.cut=sim.cut.map((_,i)=>i%2===1)})}>Cut half</Btn><Btn onClick={()=>up(()=>{sim.cut=sim.cut.map((_,i)=>i===0)})}>Cut #1</Btn><Btn onClick={()=>up(()=>{sim.cut=sim.cut.map(x=>!x)})}>Invert</Btn></div>
<p className="text-[10px] text-mid mt-2 leading-relaxed">차단된 실린더는 점화하지 않아 토크·출력이 줄고 사운드가 달라집니다. Cylinders 탭에서 행을 눌러 개별 차단도 가능합니다.</p>
<Btn className="mt-3" onClick={()=>up(()=>{Object.assign(sim.auto,{on:false,hold:false,mode:'pingpong',target:'throttle',min:0,max:1,period:8,loop:true,t:0});sim.cut.fill(false)})}>Reset lab</Btn></section></div>}
