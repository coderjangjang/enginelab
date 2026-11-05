import {useState} from 'react'
import {Btn,H,Row,Slider} from './ui'
import {Chart} from './DynoPanel'
import {ENGINES,EngineConfig,curve,getEngine,peaks} from '../data/engines'
export interface Settings{bg:'black'|'light';sound:boolean;volume:number}
const Glyph=({c}:{c:EngineConfig})=><svg width="64" height="64" viewBox="-32 -32 64 64" stroke="#000" fill="none"><circle r="3"/>{c.banks.map((a,i)=><line key={i} x1="0" y1="0" x2={Math.sin(a*Math.PI/180)*28} y2={-Math.cos(a*Math.PI/180)*28} strokeWidth="6"/>)}</svg>
export function Library({open}:{open:(id:string)=>void}){
return <div className="p-6 max-w-6xl mx-auto"><H>Engine Library</H><div className="grid gap-px bg-mid border border-mid sm:grid-cols-2 lg:grid-cols-3">
{ENGINES.map(e=><div key={e.id} className="bg-white p-5 flex flex-col gap-3"><div className="flex justify-between items-start"><div><div className="text-lg">{e.name}</div><div className="font-mono text-[11px] text-mid">{e.cyl} cyl · {e.dispL.toFixed(1)} L · {(720/e.cyl).toFixed(0)}° interval</div></div><Glyph c={e}/></div>
<p className="text-xs leading-relaxed flex-1">{e.note}</p><div className="font-mono text-[11px] text-mid">Order {e.firing.join('-')}</div><Btn onClick={()=>open(e.id)}>Open in simulator</Btn></div>)}</div></div>}
export function Compare(){
const [a,setA]=useState('v8'),[b,setB]=useState('v12'),A=getEngine(a),B=getEngine(b),ca=curve(A),cb=curve(B),pa=peaks(ca),pb=peaks(cb)
const data:any[]=[];for(let r=1000;r<=Math.max(A.redline,B.redline);r+=250){const x=ca.find(p=>p.rpm===r),y=cb.find(p=>p.rpm===r);data.push({rpm:r,tqA:x?.tq,tqB:y?.tq,hpA:x?.hp,hpB:y?.hp})}
const sel=(v:string,f:(s:string)=>void)=><select value={v} onChange={e=>f(e.target.value)} className="h-9 border border-black px-2 text-sm w-full">{ENGINES.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select>
const rows:[string,(e:EngineConfig,p:typeof pa)=>string][]=[['Cylinders',e=>e.cyl+''],['Layout',e=>e.layout==='inline'?'Inline':e.layout.toUpperCase()+' · '+e.banks.length+' banks'],['Displacement',e=>e.dispL.toFixed(1)+' L'],['Firing interval',e=>(720/e.cyl).toFixed(1)+'°'],['Firings / revolution',e=>(e.cyl/2).toFixed(1)],['Firing order',e=>e.firing.join('-')],['Peak torque (EST)',(e,p)=>`${p.tq.toFixed(0)} Nm @ ${p.tqR}`],['Peak power (EST)',(e,p)=>`${p.hp.toFixed(0)} HP @ ${p.hpR}`],['Redline',e=>e.redline+' rpm'],['Character',e=>e.note]]
return <div className="p-6 max-w-5xl mx-auto"><H>Compare</H><div className="grid grid-cols-[1fr_1fr_1fr] gap-4 mb-4"><div/>{sel(a,setA)}{sel(b,setB)}</div>
{rows.map(([k,f])=><div key={k} className="grid grid-cols-[1fr_1fr_1fr] gap-4 py-2 border-b border-mist text-xs"><span className="text-mid">{k}</span><span className="font-mono">{f(A,pa)}</span><span className="font-mono">{f(B,pb)}</span></div>)}
<div className="grid md:grid-cols-2 gap-6 mt-8"><div><div className="text-[10px] uppercase tracking-widest text-mid">Torque (Nm)</div><Chart h={220} data={data} lines={[{k:'tqA',n:A.name,c:'#000000'},{k:'tqB',n:B.name,c:'#808080',d:'4 3'}]}/></div>
<div><div className="text-[10px] uppercase tracking-widest text-mid">Horsepower (HP)</div><Chart h={220} data={data} lines={[{k:'hpA',n:A.name,c:'#000000'},{k:'hpB',n:B.name,c:'#808080',d:'4 3'}]}/></div></div></div>}
export function SettingsPage({st,set}:{st:Settings;set:(s:Settings)=>void}){
return <div className="p-6 max-w-xl mx-auto space-y-6"><H>Settings</H>
<div><div className="text-xs text-mid mb-2">3D viewer background</div><div className="flex gap-2"><Btn a={st.bg==='black'} onClick={()=>set({...st,bg:'black'})}>Black</Btn><Btn a={st.bg==='light'} onClick={()=>set({...st,bg:'light'})}>Light gray</Btn></div></div>
<div><div className="text-xs text-mid mb-2">Engine sound</div><div className="flex gap-2"><Btn a={st.sound} onClick={()=>set({...st,sound:true})}>On</Btn><Btn a={!st.sound} onClick={()=>set({...st,sound:false})}>Off</Btn></div></div>
<Slider label="Master volume" value={Math.round(st.volume*100)} min={0} max={100} unit=" %" onChange={v=>set({...st,volume:v/100})}/>
<Row k="Data" v="토크·출력·온도·유압은 단순화된 추정 모델입니다"/></div>}
