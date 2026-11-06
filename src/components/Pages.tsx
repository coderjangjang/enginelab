import {useState} from 'react'
import {Btn,H,Row,Slider} from './ui'
import type {AudioMode,Listener,EngineAudio} from '../sim/audio'
import {Chart} from './DynoPanel'
import {ENGINES,EngineConfig,curve,getEngine,peaks} from '../data/engines'
export interface Settings{bg:'black'|'light';sound:boolean;volume:number;mode:AudioMode;view:Listener;quality:'low'|'high';fps:boolean}
export const DEFAULT_SETTINGS:Settings={bg:'black',sound:true,volume:.5,mode:'stereo',view:'cabin',quality:'high',fps:false}
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
function Seg<T extends string>({label,v,opts,on}:{label:string;v:T;opts:[T,string][];on:(v:T)=>void}){return <div><div className="text-xs text-mid mb-2">{label}</div><div className="flex flex-wrap gap-2">{opts.map(([k,n])=><Btn key={k} a={v===k} onClick={()=>on(k)}>{n}</Btn>)}</div></div>}
const KEYS:[string,string][]=[['Space','Pause / Resume'],['S','Engine Start / Stop'],['E','Explode / Assemble'],['R','Reset view'],['O','Auto orbit'],['M','Sound on / off'],['Esc','Deselect part']]
export function SettingsPage({st,set,audio}:{st:Settings;set:(s:Settings)=>void;audio:EngineAudio}){
const fb=st.mode==='surround'&&audio.maxCh>0&&audio.eff!=='surround'
return <div className="p-6 max-w-xl mx-auto space-y-6"><H>Settings</H>
<Seg label="3D viewer background" v={st.bg} opts={[['black','Black'],['light','Light gray']]} on={bg=>set({...st,bg})}/>
<Seg label="Render quality (Low = 저사양 기기용)" v={st.quality} opts={[['high','High'],['low','Low']]} on={quality=>set({...st,quality})}/>
<Seg label="FPS counter" v={st.fps?'on':'off'} opts={[['on','On'],['off','Off']]} on={v=>set({...st,fps:v==='on'})}/>
<div className="border-t border-mist pt-6 space-y-6"><H>Sound</H>
<Seg label="Engine sound" v={st.sound?'on':'off'} opts={[['on','On'],['off','Off']]} on={v=>set({...st,sound:v==='on'})}/>
<Slider label="Master volume" value={Math.round(st.volume*100)} min={0} max={100} unit=" %" onChange={v=>set({...st,volume:v/100})}/>
<Seg label="Output" v={st.mode} opts={[['stereo','Stereo'],['binaural','Binaural 3D'],['surround','Surround 5.1']]} on={mode=>set({...st,mode})}/>
<p className="text-[11px] text-mid leading-relaxed -mt-3">Binaural 3D는 헤드폰용 HRTF 입체 음향, Surround 5.1은 5.1 출력 장치가 필요합니다. 배기(좌/우), 엔진 블록, 흡기가 별도 음원으로 배치됩니다.</p>
<Seg label="Listener position" v={st.view} opts={[['cabin','Cabin'],['exterior','Exterior'],['bay','Engine bay']]} on={view=>set({...st,view})}/>
<div className="flex items-center gap-3"><Btn onClick={()=>void audio.test()}>Test channels</Btn><span className="font-mono text-[11px] text-mid">Output: {audio.eff} · {audio.maxCh?audio.maxCh+' ch max':'오디오 시작 전'}</span></div>
{fb&&<p className="text-[11px] leading-relaxed">출력 장치가 5.1 채널을 지원하지 않아 Binaural 3D로 대체되었습니다. OS 사운드 설정에서 5.1을 켜면 사용할 수 있습니다.</p>}</div>
<div className="border-t border-mist pt-6"><H>Keyboard shortcuts</H>{KEYS.map(([k,v])=><Row key={k} k={v} v={k}/>)}</div>
<Row k="Data" v="토크·출력·온도·유압은 단순화된 추정 모델입니다"/></div>}
