import {Btn,H,Slider} from './ui'
import {Sim,Snap,AutoMode,AutoTarget} from '../sim/Sim'
const MODES:[AutoMode,string,string][]=[['ramp','Ramp','최소→최대로 올린 뒤 처음으로 복귀'],['pingpong','Ping-pong','최소↔최대를 왕복'],['sine','Sine','사인파로 부드럽게 반복'],['step','Staircase','5단계 계단식 증가'],['blip','Rev blip','짧게 밟았다 떼는 레브 블립']]
const TARGETS:[AutoTarget,string][]=[['throttle','Throttle'],['rpm','RPM'],['both','Both']]
export default function LabPanel({sim,s,refresh,onStart}:{sim:Sim;s:Snap;refresh:()=>void;onStart:()=>void}){
const A=s.auto,up=(f:()=>void)=>{f();refresh()}
const run=(p:Partial<typeof sim.auto>={})=>up(()=>{onStart();Object.assign(sim.auto,p,{t:0,on:true});if(!sim.running&&sim.starting<=0)sim.start()})
const state=!A.on?'OFF':!s.running?'WAITING FOR ENGINE':'RUNNING'
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
<div className="flex flex-wrap gap-2 mt-3"><Btn a={A.loop} onClick={()=>up(()=>{sim.auto.loop=!sim.auto.loop})}>Loop</Btn><Btn a={A.on} disabled={A.on} onClick={()=>run()}>Start</Btn><Btn disabled={!A.on} onClick={()=>up(()=>{sim.auto.on=false})}>Stop</Btn></div>
<div className="mt-3 text-xs flex justify-between"><span className="text-mid">{state}</span><span className="font-mono">{Math.round(A.v*100)} %</span></div>
<div className="h-[2px] bg-mist mt-1"><div className="h-full bg-black" style={{width:`${A.on?(A.t%A.period)/A.period*100:0}%`}}/></div>
<p className="text-[10px] text-mid mt-2 leading-relaxed">Throttle: 스로틀을 min~max 사이로 자동 조절 · RPM: 명령 RPM을 아이들~최대 RPM 범위에서 조절 · Both: 둘 다. 자동 조절 중인 슬라이더는 잠깁니다.</p></section>
<section><H>Presets</H><div className="grid gap-2">
<Btn onClick={()=>run({mode:'ramp',target:'throttle',min:0,max:1,period:10,loop:false})}>Full sweep 0→100% (1회)</Btn>
<Btn onClick={()=>run({mode:'blip',target:'both',min:.1,max:1,period:2.5,loop:true})}>Rev blips</Btn>
<Btn onClick={()=>run({mode:'pingpong',target:'rpm',min:0,max:1,period:12,loop:true})}>Idle ↔ Redline</Btn>
<Btn onClick={()=>run({mode:'step',target:'both',min:.2,max:1,period:10,loop:false})}>Staircase run-up (1회)</Btn></div></section>
<section><H>Cylinder cut</H><div className="font-mono text-xs mb-2">{s.cut.filter(x=>!x).length} / {s.cut.length} cylinders firing</div>
<div className="flex flex-wrap gap-2"><Btn onClick={()=>up(()=>{sim.cut.fill(false)})}>All on</Btn><Btn onClick={()=>up(()=>{sim.cut=sim.cut.map((_,i)=>i%2===1)})}>Cut half</Btn><Btn onClick={()=>up(()=>{sim.cut=sim.cut.map((_,i)=>i===0)})}>Cut #1</Btn></div>
<p className="text-[10px] text-mid mt-2 leading-relaxed">차단된 실린더는 점화하지 않아 토크·출력이 줄고 사운드와 점화 간격이 달라집니다. Cylinders 탭에서 행을 눌러 개별 차단도 가능합니다.</p></section></div>}
