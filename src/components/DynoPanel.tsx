import {useState} from 'react'
import {CartesianGrid,Line,LineChart,ResponsiveContainer,XAxis,YAxis,Legend} from 'recharts'
import {Btn,H,Row} from './ui'
import {EngineConfig,peaks} from '../data/engines'
import {Sim,Snap} from '../sim/Sim'
export function Chart({data,lines,h=150}:{data:any[];lines:{k:string;n:string;c:string;d?:string}[];h?:number}){
const t={fontSize:9,fill:'#808080'}
return <ResponsiveContainer width="100%" height={h}><LineChart data={data} margin={{top:6,right:8,left:-12,bottom:0}}><CartesianGrid stroke="#F2F2F2"/><XAxis dataKey="rpm" type="number" domain={['dataMin','dataMax']} tick={t} stroke="#808080"/><YAxis tick={t} stroke="#808080"/>
{lines.length>1&&<Legend iconSize={8} wrapperStyle={{fontSize:10}}/>}
{lines.map(l=><Line key={l.k} dataKey={l.k} name={l.n} stroke={l.c} strokeDasharray={l.d} dot={false} isAnimationActive={false} strokeWidth={1.5}/>)}</LineChart></ResponsiveContainer>}
interface Saved{id:number;engine:string;date:string;tq:number;tqR:number;hp:number;hpR:number}
const load=():Saved[]=>{try{return JSON.parse(localStorage.getItem('enginelab.dyno')??'[]')}catch{return[]}}
export default function DynoPanel({sim,s,cfg,refresh,onStart}:{sim:Sim;s:Snap;cfg:EngineConfig;refresh:()=>void;onStart:()=>void}){
const [saved,setSaved]=useState<Saved[]>(load),pts=s.dyno.pts,pk=peaks(pts)
const put=(l:Saved[])=>{setSaved(l);try{localStorage.setItem('enginelab.dyno',JSON.stringify(l))}catch{}}
return <div><H>Dyno test</H><div className="flex gap-2 mb-3"><Btn a={s.dyno.active} disabled={s.dyno.active} onClick={()=>{onStart();sim.startDyno();refresh()}}>Start test</Btn><Btn disabled={!s.dyno.active} onClick={()=>{sim.endDyno();refresh()}}>End</Btn>
<Btn disabled={!pts.length||s.dyno.active} onClick={()=>put([{id:Date.now(),engine:cfg.name,date:new Date().toLocaleString(),...pk},...saved])}>Save</Btn></div>
<div className="h-[2px] bg-mist mb-3"><div className="h-full bg-black" style={{width:`${s.dyno.p*100}%`}}/></div>
<Row k="Peak torque (EST)" v={pts.length?`${pk.tq.toFixed(0)} Nm @ ${pk.tqR}`:'—'}/><Row k="Peak power (EST)" v={pts.length?`${pk.hp.toFixed(0)} HP @ ${pk.hpR}`:'—'}/>
<div className="text-[10px] uppercase tracking-widest text-mid mt-3">RPM / Torque (Nm)</div><Chart data={pts} lines={[{k:'tq',n:'Torque',c:'#000000'}]}/>
<div className="text-[10px] uppercase tracking-widest text-mid mt-2">RPM / Horsepower (HP)</div><Chart data={pts} lines={[{k:'hp',n:'HP',c:'#808080'}]}/>
<H>Saved results</H>{saved.length===0&&<p className="text-xs text-mid">저장된 결과가 없습니다.</p>}
{saved.map(r=><div key={r.id} className="border-b border-mist py-2 text-xs flex justify-between gap-2"><div><div>{r.engine}</div><div className="text-mid font-mono text-[10px]">{r.date}</div><div className="font-mono">{r.tq.toFixed(0)} Nm · {r.hp.toFixed(0)} HP</div></div><button className="underline text-[10px] uppercase" onClick={()=>put(saved.filter(x=>x.id!==r.id))}>Delete</button></div>)}</div>}
