import {useEffect,useRef,useState} from 'react'
import {CartesianGrid,Line,LineChart,ReferenceDot,ResponsiveContainer,XAxis,YAxis,Legend} from 'recharts'
import {Btn,H,Row,Slider} from './ui'
import {EngineConfig,peaks} from '../data/engines'
import {Sim,Snap} from '../sim/Sim'
export function Chart({data,lines,h=150,x='rpm',dots=[]}:{data:any[];lines:{k:string;n:string;c:string;d?:string}[];h?:number;x?:string;dots?:{x:number;y:number}[]}){
const t={fontSize:9,fill:'#808080'}
return <ResponsiveContainer width="100%" height={h}><LineChart data={data} margin={{top:6,right:8,left:-12,bottom:0}}><CartesianGrid stroke="#F2F2F2"/><XAxis dataKey={x} type="number" domain={['dataMin','dataMax']} tick={t} stroke="#808080"/><YAxis tick={t} stroke="#808080"/>
{lines.length>1&&<Legend iconSize={8} wrapperStyle={{fontSize:10}}/>}
{lines.map(l=><Line key={l.k} dataKey={l.k} name={l.n} stroke={l.c} strokeDasharray={l.d} dot={false} connectNulls isAnimationActive={false} strokeWidth={1.5}/>)}
{dots.map((d,i)=><ReferenceDot key={i} x={d.x} y={d.y} r={3} fill="#000000" stroke="#FFFFFF"/>)}</LineChart></ResponsiveContainer>}
export const csv=(rows:(string|number)[][])=>rows.map(r=>r.join(',')).join('\n')
export const download=(name:string,text:string)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/csv'}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
type Pt={rpm:number;tq:number;hp:number}
interface Run{id:number;name:string;engine:string;date:string;pts:Pt[]}
const KEY='enginelab.dyno2'
const load=():Run[]=>{try{return JSON.parse(localStorage.getItem(KEY)??'[]')}catch{return[]}}
export default function DynoPanel({sim,s,cfg,refresh,onStart}:{sim:Sim;s:Snap;cfg:EngineConfig;refresh:()=>void;onStart:()=>void}){
const [runs,setRuns]=useState<Run[]>(load),[ov,setOv]=useState<number|null>(null),[u,setU]=useState({tq:'nm',pw:'hp'}),[auto,setAuto]=useState(true),was=useRef(false)
const put=(l:Run[])=>{setRuns(l);try{localStorage.setItem(KEY,JSON.stringify(l))}catch{}}
const ft=u.tq==='nm'?1:.7376,fp=u.pw==='hp'?1:.7457,tu=u.tq==='nm'?'Nm':'lb-ft',pu=u.pw==='hp'?'HP':'kW'
const cv=(p:Pt)=>({rpm:p.rpm,tq:p.tq*ft,hp:p.hp*fp})
const pts=s.dyno.pts.map(cv),pk=peaks(pts),D=s.dyno.set,act=s.dyno.active
const save=()=>put([{id:Date.now(),name:`${cfg.name} #${runs.filter(r=>r.engine===cfg.name).length+1}`,engine:cfg.name,date:new Date().toLocaleString(),pts:s.dyno.pts},...runs].slice(0,20))
useEffect(()=>{if(was.current&&!act&&auto&&s.dyno.pts.length>3)save();was.current=act},[act])
const ref=runs.find(r=>r.id===ov),rows=new Map<number,any>()
pts.forEach(p=>rows.set(p.rpm,{rpm:p.rpm,tq:p.tq,hp:p.hp}))
ref?.pts.map(cv).forEach(p=>rows.set(p.rpm,{...rows.get(p.rpm),rpm:p.rpm,tqR:p.tq,hpR:p.hp}))
const data=[...rows.values()].sort((a,b)=>a.rpm-b.rpm)
const exp=(name:string,p:Pt[])=>download(name+'.csv',csv([['rpm',`torque_${tu}`,`power_${pu}`],...p.map(cv).map(q=>[q.rpm,q.tq.toFixed(1),q.hp.toFixed(1)])]))
const set=(f:()=>void)=>()=>{f();refresh()}
const tqL=[{k:'tq',n:'Current',c:'#000000'},...(ref?[{k:'tqR',n:ref.name,c:'#808080',d:'4 3'}]:[])],hpL=[{k:'hp',n:'Current',c:'#000000'},...(ref?[{k:'hpR',n:ref.name,c:'#808080',d:'4 3'}]:[])]
return <div><H>Dyno test</H>
<div className="flex gap-2 mb-3"><Btn a={act} disabled={act} onClick={()=>{onStart();sim.startDyno();refresh()}}>Start test</Btn><Btn disabled={!act} onClick={set(()=>sim.endDyno())}>End</Btn><Btn disabled={!pts.length||act} onClick={save}>Save</Btn></div>
<div className="h-[2px] bg-mist mb-2"><div className="h-full bg-black" style={{width:`${s.dyno.p*100}%`}}/></div>
{act&&<div className="font-mono text-xs flex justify-between mb-2"><span>{Math.round(s.rpm)} rpm</span><span>{(s.tq*ft).toFixed(0)} {tu}</span><span>{(s.hp*fp).toFixed(0)} {pu}</span><span>{(D.dur*(1-s.dyno.p)).toFixed(1)}s</span></div>}
<details className="border border-mid mb-3"><summary className="cursor-pointer text-[11px] uppercase tracking-[.1em] px-2 py-2">Test settings</summary><div className="p-3 space-y-3">
<Slider label="Start RPM" value={D.from} min={500} max={9500} step={100} disabled={act} onChange={v=>{sim.dynoSet.from=Math.min(v,sim.dynoSet.to-500);refresh()}}/>
<Slider label="End RPM" value={D.to} min={1000} max={10000} step={100} disabled={act} onChange={v=>{sim.dynoSet.to=Math.max(v,sim.dynoSet.from+500);refresh()}}/>
<Slider label="Duration" value={D.dur} min={5} max={40} step={1} unit=" s" disabled={act} onChange={v=>{sim.dynoSet.dur=v;refresh()}}/>
<Btn disabled={act} onClick={set(()=>{sim.dynoSet={from:sim.idle,to:sim.max,dur:14}})}>Reset range</Btn></div></details>
<div className="flex flex-wrap gap-2 mb-3"><Btn a={u.tq==='nm'} onClick={()=>setU({...u,tq:'nm'})}>Nm</Btn><Btn a={u.tq==='lbft'} onClick={()=>setU({...u,tq:'lbft'})}>lb-ft</Btn><Btn a={u.pw==='hp'} onClick={()=>setU({...u,pw:'hp'})}>HP</Btn><Btn a={u.pw==='kw'} onClick={()=>setU({...u,pw:'kw'})}>kW</Btn><Btn a={auto} onClick={()=>setAuto(!auto)}>Auto-save</Btn></div>
<Row k="Peak torque (EST)" v={pts.length?`${pk.tq.toFixed(0)} ${tu} @ ${pk.tqR}`:'—'}/><Row k="Peak power (EST)" v={pts.length?`${pk.hp.toFixed(0)} ${pu} @ ${pk.hpR}`:'—'}/>
<div className="text-[10px] uppercase tracking-widest text-mid mt-3">RPM / Torque ({tu})</div><Chart data={data} lines={tqL} dots={pts.length?[{x:pk.tqR,y:pk.tq}]:[]}/>
<div className="text-[10px] uppercase tracking-widest text-mid mt-2">RPM / Power ({pu})</div><Chart data={data} lines={hpL} dots={pts.length?[{x:pk.hpR,y:pk.hp}]:[]}/>
<Btn className="mt-2" disabled={!pts.length} onClick={()=>exp(`dyno_${cfg.id}`,s.dyno.pts)}>Export CSV</Btn>
<div className="flex justify-between items-center mt-6"><H>Saved results</H>{runs.length>0&&<button className="text-[10px] uppercase tracking-widest underline mb-2" onClick={()=>{if(confirm('저장된 결과를 모두 삭제할까요?')){put([]);setOv(null)}}}>Clear all</button>}</div>
{runs.length===0&&<p className="text-xs text-mid">저장된 결과가 없습니다. 테스트가 끝나면 자동 저장됩니다(Auto-save).</p>}
{runs.map(r=>{const p=peaks(r.pts.map(cv));return <div key={r.id} className="border-b border-mist py-2 text-xs"><div className="flex justify-between"><span>{r.name}</span><span className="font-mono text-[10px] text-mid">{r.date}</span></div>
<div className="font-mono">{p.tq.toFixed(0)} {tu} @ {p.tqR} · {p.hp.toFixed(0)} {pu} @ {p.hpR}</div>
<div className="flex gap-3 mt-1 text-[10px] uppercase tracking-widest"><button className={ov===r.id?'underline font-bold':'underline'} onClick={()=>setOv(ov===r.id?null:r.id)}>{ov===r.id?'Overlay on':'Overlay'}</button><button className="underline" onClick={()=>{const n=prompt('이름',r.name);if(n)put(runs.map(x=>x.id===r.id?{...x,name:n}:x))}}>Rename</button><button className="underline" onClick={()=>exp(r.name.replace(/\W+/g,'_'),r.pts)}>CSV</button><button className="underline" onClick={()=>{put(runs.filter(x=>x.id!==r.id));if(ov===r.id)setOv(null)}}>Delete</button></div></div>})}</div>}
