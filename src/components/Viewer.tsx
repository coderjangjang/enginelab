import {Canvas,useFrame,useThree} from '@react-three/fiber'
import {OrbitControls,Edges} from '@react-three/drei'
import * as THREE from 'three'
import {ReactNode,useEffect,useMemo,useRef} from 'react'
import {EngineConfig,CylInfo,cylLayout} from '../data/engines'
import {PartType} from '../data/parts'
import {Sim} from '../sim/Sim'
const R=.3,L=1.1,D=Math.PI/180,HP=Math.PI/2
const SH:Record<string,Record<PartType,string>>={
black:{block:'#808080',piston:'#F2F2F2',rod:'#808080',crank:'#FFFFFF',cam:'#F2F2F2',ivalve:'#FFFFFF',evalve:'#808080',plug:'#FFFFFF',imanifold:'#F2F2F2',emanifold:'#808080'},
light:{block:'#808080',piston:'#000000',rod:'#808080',crank:'#000000',cam:'#000000',ivalve:'#808080',evalve:'#000000',plug:'#000000',imanifold:'#808080',emanifold:'#000000'}}
export interface Ctx{sim:Sim;sel:string|null;hidden:PartType[];bg:'black'|'light';onSelect:(id:string|null)=>void;reg:Map<string,THREE.Object3D>}
const mp=(x:Ctx,id:string,t:PartType)=>{const on=x.sel===id,dim=!!x.sel&&!on
return{color:on?(x.bg==='black'?'#FFFFFF':'#000000'):SH[x.bg][t],emissive:'#FFFFFF',emissiveIntensity:on&&x.bg==='black'?.45:0,transparent:dim,opacity:dim?.16:1,metalness:.5,roughness:.4,depthWrite:!dim}}
type V3=[number,number,number]
function Part({id,t,off,win,x,children}:{id:string;t:PartType;off:V3;win:[number,number];x:Ctx;children:ReactNode}){
const ref=useRef<THREE.Group>(null),hide=x.hidden.includes(t)
useEffect(()=>{const o=ref.current;if(o)x.reg.set(id,o);return()=>{x.reg.delete(id)}},[id,hide])
useFrame(()=>{const g=ref.current;if(!g)return;const k=Math.min(1,Math.max(0,(x.sim.exp.v-win[0])/(win[1]-win[0]))),e=k*k*(3-2*k);g.position.set(off[0]*e,off[1]*e,off[2]*e)})
if(hide)return null
return <group ref={ref} onClick={ev=>{ev.stopPropagation();x.onSelect(id)}}>{children}</group>}
function Cyl({c,x}:{c:CylInfo;x:Ctx}){
const pis=useRef<THREE.Group>(null),rod=useRef<THREE.Group>(null),iv=useRef<THREE.Group>(null),ev=useRef<THREE.Group>(null),pm=useRef<THREE.MeshStandardMaterial>(null)
const i=c.i,plugSel=x.sel===`plug-${i}`
useFrame(()=>{const ph=(((x.sim.crank+c.off)%720)+720)%720,r=ph*D,s=Math.sin(r),k=Math.cos(r),u=R*k+Math.sqrt(L*L-R*R*s*s)
pis.current?.position.set(0,u,0)
if(rod.current){rod.current.position.set(R*s/2,(R*k+u)/2,0);rod.current.rotation.z=Math.atan2(R*s,u-R*k)}
iv.current?.position.set(0,-.14*(ph<200?Math.sin(Math.PI*ph/200):0),0)
ev.current?.position.set(0,-.14*(ph>=520?Math.sin(Math.PI*(ph-520)/200):0),0)
if(pm.current)pm.current.emissiveIntensity=ph>352&&ph<382?2.5:(plugSel?.45:0)})
const M=(id:string,t:PartType)=><meshStandardMaterial {...mp(x,id,t)}/>
return <group position={[0,0,c.z]}>
<Part id={`piston-${i}`} t="piston" off={[0,1.5,0]} win={[.4,.9]} x={x}><group ref={pis}>
<mesh position={[0,.1,0]}><cylinderGeometry args={[.46,.46,.42,28]}/>{M(`piston-${i}`,'piston')}</mesh>
<mesh rotation={[HP,0,0]}><cylinderGeometry args={[.07,.07,.7,12]}/>{M(`piston-${i}`,'piston')}</mesh></group></Part>
<Part id={`rod-${i}`} t="rod" off={[0,.7,0]} win={[.5,.95]} x={x}><group ref={rod}>
<mesh><boxGeometry args={[.12,L,.08]}/>{M(`rod-${i}`,'rod')}</mesh>
<mesh position={[0,-L/2,0]} rotation={[HP,0,0]}><cylinderGeometry args={[.15,.15,.14,16]}/>{M(`rod-${i}`,'rod')}</mesh>
<mesh position={[0,L/2,0]} rotation={[HP,0,0]}><cylinderGeometry args={[.09,.09,.12,12]}/>{M(`rod-${i}`,'rod')}</mesh></group></Part>
{([['ivalve',-.3,iv],['evalve',.3,ev]] as const).map(([t,vx,rf])=><group key={t} position={[vx,1.78,0]}>
<Part id={`${t}-${i}`} t={t} off={[0,2.4,0]} win={[.25,.7]} x={x}><group ref={rf}>
<mesh position={[0,.3,0]}><cylinderGeometry args={[.035,.035,.6,8]}/>{M(`${t}-${i}`,t)}</mesh>
<mesh><cylinderGeometry args={[.17,.17,.04,20]}/>{M(`${t}-${i}`,t)}</mesh></group></Part></group>)}
<group position={[0,1.8,0]}><Part id={`plug-${i}`} t="plug" off={[0,3.8,0]} win={[0,.45]} x={x}>
<mesh position={[0,.22,0]}><cylinderGeometry args={[.06,.06,.45,12]}/><meshStandardMaterial ref={pm} {...mp(x,`plug-${i}`,'plug')}/></mesh>
<mesh position={[0,.3,0]}><cylinderGeometry args={[.1,.1,.1,6]}/>{M(`plug-${i}`,'plug')}</mesh></Part></group></group>}
function Bank({a,b,cs,x}:{a:number;b:number;cs:CylInfo[];x:Ctx}){
const zs=cs.map(c=>c.z),z0=Math.min(...zs),z1=Math.max(...zs),zm=(z0+z1)/2,zl=z1-z0+.9,cam=useRef<THREE.Group>(null)
useFrame(()=>{if(cam.current)cam.current.rotation.z=-x.sim.crank*D/2})
const M=(id:string,t:PartType)=><meshStandardMaterial {...mp(x,id,t)}/>
return <group rotation={[0,0,-a*D]}>{cs.map(c=><Cyl key={c.i} c={c} x={x}/>)}
<Part id={`cam-${b}`} t="cam" off={[1.4,2.8,0]} win={[.05,.5]} x={x}><group position={[0,2.55,zm]}><group ref={cam}>
<mesh rotation={[HP,0,0]}><cylinderGeometry args={[.09,.09,zl,16]}/>{M(`cam-${b}`,'cam')}</mesh>
{cs.map(c=><mesh key={c.i} position={[.12,0,c.z-zm]}><boxGeometry args={[.3,.16,.15]}/>{M(`cam-${b}`,'cam')}</mesh>)}</group></group></Part>
<Part id={`imanifold-${b}`} t="imanifold" off={[-2.1,.5,0]} win={[.1,.55]} x={x}><mesh position={[-.78,2.05,zm]} rotation={[HP,0,0]}><cylinderGeometry args={[.2,.2,zl,20]}/>{M(`imanifold-${b}`,'imanifold')}</mesh></Part>
<Part id={`emanifold-${b}`} t="emanifold" off={[2.1,.5,0]} win={[.1,.55]} x={x}><mesh position={[.78,2.05,zm]} rotation={[HP,0,0]}><cylinderGeometry args={[.2,.2,zl,20]}/>{M(`emanifold-${b}`,'emanifold')}</mesh></Part></group>}
function Model({cfg,x}:{cfg:EngineConfig;x:Ctx}){
const {cyls,zc,len}=useMemo(()=>cylLayout(cfg),[cfg]),g=useRef<THREE.Group>(null),ln=x.bg==='black'?'#FFFFFF':'#000000'
useFrame((_,dt)=>x.sim.step(dt))
const pb=mp(x,'block','block'),pc=mp(x,'crank','crank')
return <group position={[0,-.6,-zc]}>
<Part id="block" t="block" off={[0,0,0]} win={[0,1]} x={x}>
<mesh position={[0,-.3,zc]}><boxGeometry args={[2,1.6,len]}/><meshStandardMaterial {...pb} transparent opacity={pb.transparent?.08:.25} depthWrite={false}/><Edges color={ln}/></mesh>
{cfg.banks.map((a,b)=><group key={b} rotation={[0,0,-a*D]}>{cyls.filter(c=>c.bank===b).map(c=><mesh key={c.i} position={[0,1.2,c.z]}><cylinderGeometry args={[.52,.52,1.4,28,1,true]}/><meshStandardMaterial {...pb} side={THREE.DoubleSide} transparent opacity={pb.transparent?.05:.3} depthWrite={false}/></mesh>)}</group>)}</Part>
<Part id="crank" t="crank" off={[0,-2.8,0]} win={[.5,1]} x={x}><CrankBody cyls={cyls} zc={zc} len={len} x={x} p={pc}/></Part>
{cfg.banks.map((a,b)=><Bank key={b} a={a} b={b} cs={cyls.filter(c=>c.bank===b)} x={x}/>)}</group>}
function CrankBody({cyls,zc,len,x,p}:{cyls:CylInfo[];zc:number;len:number;x:Ctx;p:ReturnType<typeof mp>}){
const g=useRef<THREE.Group>(null);useFrame(()=>{if(g.current)g.current.rotation.z=-x.sim.crank*D})
return <group ref={g}><mesh position={[0,0,zc]} rotation={[HP,0,0]}><cylinderGeometry args={[.15,.15,len+.3,20]}/><meshStandardMaterial {...p}/></mesh>
{cyls.map(c=>{const o=(c.off+c.a)*D,sx=Math.sin(o),cx=Math.cos(o);return <group key={c.i}>
<mesh position={[R*sx,R*cx,c.z]} rotation={[HP,0,0]}><cylinderGeometry args={[.12,.12,.3,16]}/><meshStandardMaterial {...p}/></mesh>
{[-.2,.2].map(d=><mesh key={d} position={[R*sx/2,R*cx/2,c.z+d]} rotation={[0,0,-o]}><boxGeometry args={[.3,R+.3,.1]}/><meshStandardMaterial {...p}/></mesh>)}</group>})}</group>}
function Rig({cfg,sel,reg,reset}:{cfg:EngineConfig;sel:string|null;reg:Map<string,THREE.Object3D>;reset:number}){
const ctl=useRef<any>(null),{camera}=useThree(),on=useRef(0),v=useMemo(()=>new THREE.Vector3(),[]),len=cylLayout(cfg).len
useEffect(()=>{camera.position.set(len*.7+4,3+len*.25,len*.5+4);ctl.current?.target.set(0,.4,0);ctl.current?.update()},[cfg.id,reset])
useEffect(()=>{on.current=sel?2.2:0},[sel])
useFrame((_,dt)=>{const c=ctl.current;if(!c||on.current<=0||!sel)return;const o=reg.get(sel);if(!o)return;on.current-=dt;o.getWorldPosition(v)
const k=1-Math.exp(-dt*5),off=camera.position.clone().sub(c.target),d=off.length();c.target.lerp(v,k);camera.position.copy(c.target).add(off.setLength(THREE.MathUtils.lerp(d,Math.min(d,6),k)));c.update()})
return <OrbitControls ref={ctl} makeDefault enableDamping dampingFactor={.1} minDistance={2} maxDistance={60}/>}
export default function Viewer({sim,cfg,sel,hidden,onSelect,bg,reset}:{sim:Sim;cfg:EngineConfig;sel:string|null;hidden:PartType[];onSelect:(id:string|null)=>void;bg:'black'|'light';reset:number}){
const reg=useRef(new Map<string,THREE.Object3D>()).current,x:Ctx={sim,sel,hidden,bg,onSelect,reg}
return <Canvas camera={{fov:35,near:.1,far:300}} dpr={[1,2]} onPointerMissed={()=>onSelect(null)}>
<color attach="background" args={[bg==='black'?'#000000':'#F2F2F2']}/>
<ambientLight intensity={.7}/><directionalLight position={[6,10,8]} intensity={1.8}/><directionalLight position={[-8,-3,-6]} intensity={.7}/>
<gridHelper args={[40,40,'#808080','#808080']} position={[0,-4.4,0]}/>
<Rig cfg={cfg} sel={sel} reg={reg} reset={reset}/><Model cfg={cfg} x={x}/></Canvas>}
