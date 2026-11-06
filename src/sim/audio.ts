import {Sim} from './Sim'
export type AudioMode='stereo'|'binaural'|'surround'
export type Listener='cabin'|'exterior'|'bay'
/* 4채널 음원: [0]=배기 뱅크1, [1]=배기 뱅크2, [2]=엔진 블록(기계음·시동 모터), [3]=흡기
 * 점화 순서에서 계산한 압력 펄스를 배기관(지연선+감쇠 피드백)에 주입하는 물리 모델 합성. */
const CODE=`
const H=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x)};
class EngineProc extends AudioWorkletProcessor{
constructor(){super();
this.c={cyl:4,fo:[0,2,3,1],B:1,f0:180,br:480,jit:3,skew:1.05};
this.t={rpm:0,thr:0,ld:0,fire:0,st:0,max:7000};
this.rpm=0;this.thr=0;this.ld=0;this.st=0;this.ph=0;this.k=0;
this.buf=[new Float32Array(4096),new Float32Array(4096)];this.wp=[0,0];this.lp=[0,0];
this.env=[0,0];this.e1=[0,0];this.ep=[0,0];this.dc=[0,0,0];this.s=[0,0];
this.n1=0;this.n2=0;this.np=0;this.tk=0;this.sp=0;
this.port.onmessage=e=>{if(e.data.c)this.c=e.data.c;else Object.assign(this.t,e.data)}}
fire(){const c=this.c,t=this.t,ci=c.fo[this.k%c.cyl];this.k++;if(t.cut&&t.cut[ci])return;
let amp=t.fire?(.12+.88*Math.pow(this.thr,.8))*(.72+.28*this.ld):.1+.04*Math.random();
amp*=1+(H(ci)-.5)*.18+(Math.random()-.5)*c.jit*.012;
if(t.fire&&this.rpm>t.max*.985&&(this.k&1))amp*=.12;
if(c.B===1){this.env[0]+=amp;this.env[1]+=amp*.8}else this.env[(ci%c.B)%2]+=amp;
this.tk+=amp*.5}
process(_i,o){const out=o[0],n=out[0].length,c=this.c,t=this.t,sr=sampleRate,s=this.s;
const a=1-Math.exp(-n/(sr*.07));
this.rpm+=(t.rpm-this.rpm)*a;this.thr+=(t.thr-this.thr)*a;this.ld+=(t.ld-this.ld)*a;this.st+=(t.st-this.st)*a;
const rn=Math.min(1,this.rpm/t.max),step=720/c.cyl,dps=this.rpm*6/sr,tau=.0005+.0007*(1-rn),dec=Math.exp(-1/(sr*tau));
const lpC=Math.min(.92,.1+c.br/1600+rn*.22),fb=.8,D0=Math.max(8,Math.round(sr/c.f0)),D1=Math.max(8,Math.round(D0*c.skew));
const drive=1+1.6*this.thr,pop=(this.thr<.12&&rn>.3&&t.fire)?(10*rn)/sr:0,g=(this.rpm>20||this.st>.01)?1:0;
for(let i=0;i<n;i++){
this.ph+=dps;while(this.ph>=step){this.ph-=step;this.fire()}
if(pop&&Math.random()<pop)this.env[Math.random()<.5?1:0]+=.5+Math.random()*.8;
for(let b=0;b<2;b++){
this.env[b]*=dec;this.e1[b]+=(this.env[b]-this.e1[b])*.3;
const d=(this.e1[b]-this.ep[b])*6;this.ep[b]=this.e1[b];
const x=d*(1+(Math.random()*2-1)*.35*this.thr),D=b?D1:D0,y=this.buf[b][(this.wp[b]-D+4096)&4095];
this.lp[b]+=(y-this.lp[b])*lpC;this.buf[b][this.wp[b]]=x+this.lp[b]*fb;this.wp[b]=(this.wp[b]+1)&4095;
s[b]=y*.9+x*.5+this.e1[b]*.35}
const nz=Math.random()*2-1;this.n1+=(nz-this.n1)*.12;this.n2+=(this.n1-this.n2)*.02;
const intake=(this.n1-this.n2)*this.thr*(.015+.05*rn)*(this.rpm>40?1:0);
this.tk*=.992;const tick=(nz-this.np)*this.tk*.06;this.np=nz;
this.sp+=(70+this.rpm*.18)/sr;const sw=this.st*.045*(Math.sin(6.2832*this.sp)+.5*Math.sin(12.5664*this.sp));
for(let b=0;b<2;b++){const u=s[b]*.8*g,w=u-this.dc[b];this.dc[b]+=(u-this.dc[b])*.0015;out[b][i]=Math.tanh(w*drive*1.2)*.7}
const eb=((this.e1[0]+this.e1[1])*.2+tick*1.5+sw)*g,w2=eb-this.dc[2];this.dc[2]+=(eb-this.dc[2])*.0015;out[2][i]=Math.tanh(w2*1.2)*.6;
out[3][i]=intake*3*g}
return true}}
registerProcessor('engine-proc',EngineProc);`
interface Src{az:number;d:number}
/* az: 청취자 기준 방위각(0=정면, +우, ±180=후방), d: 거리 */
const VIEWS:Record<Listener,{src:Src[];lp:number[];g:number[];rv:number}>={
cabin:{src:[{az:-145,d:2.5},{az:145,d:2.5},{az:0,d:1.8},{az:20,d:1.6}],lp:[1500,1500,2800,3500],g:[.85,.85,1,.9],rv:.1},
exterior:{src:[{az:-10,d:4},{az:10,d:4},{az:0,d:5.8},{az:5,d:5.6}],lp:[9000,9000,5500,6500],g:[1,1,.7,.7],rv:.22},
bay:{src:[{az:-60,d:1.2},{az:60,d:1.2},{az:0,d:.8},{az:25,d:.9}],lp:[6500,6500,9000,8000],g:[.6,.6,1.1,1],rv:.06}}
/* 5.1 채널 순서: L, R, C, LFE, Ls, Rs */
const RING:[number,number][]=[[-110,4],[-30,0],[0,2],[30,1],[110,5],[250,4]]
function pan51(az:number){const a=((az+180)%360+360)%360-180,x=a<-110?a+360:a,g=[0,0,0,0,0,0]
for(let i=0;i<RING.length-1;i++){const [a0,c0]=RING[i],[a1,c1]=RING[i+1];if(x>=a0&&x<=a1){const t=(x-a0)/(a1-a0);g[c0]=Math.cos(t*Math.PI/2);g[c1]=Math.sin(t*Math.PI/2);break}}
return g}
export class EngineAudio{
private ctx?:AudioContext;private node?:AudioWorkletNode;private sp?:ChannelSplitterNode;private m?:GainNode;private bus?:GainNode;private ir?:AudioBuffer;private lfeIn?:AudioNode
private nodes:AudioNode[]=[];private spat?:(az:number,d:number)=>AudioNode;private cid='';private ready=false;private initP?:Promise<void>
mode:AudioMode='stereo';view:Listener='cabin';eff:AudioMode='stereo';maxCh=0
setRoute(m:AudioMode,v:Listener){this.mode=m;this.view=v;if(this.ready)this.route()}
resume():Promise<void>{if(this.ctx){void this.ctx.resume();return this.initP??Promise.resolve()}this.initP=this.init();return this.initP}
private mkIR(c:AudioContext){const len=Math.floor(c.sampleRate*.5),b=c.createBuffer(2,len,c.sampleRate)
for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(len*.22))}return b}
private async init(){
try{const c=this.ctx=new AudioContext({latencyHint:'interactive'});await c.resume()
const url=URL.createObjectURL(new Blob([CODE],{type:'application/javascript'}));await c.audioWorklet.addModule(url);URL.revokeObjectURL(url)
const n=this.node=new AudioWorkletNode(c,'engine-proc',{numberOfInputs:0,outputChannelCount:[4]})
const bq=(type:BiquadFilterType,f:number,g=0,q=1)=>{const b=c.createBiquadFilter();b.type=type;b.frequency.value=f;b.gain.value=g;b.Q.value=q;return b}
const sp=this.sp=c.createChannelSplitter(4);n.connect(sp)
const m=this.m=c.createGain();m.gain.value=0;m.connect(c.destination)
const bus=this.bus=c.createGain(),ls=bq('lowshelf',140,5),pk=bq('peaking',2400,-3,.8)
const comp=c.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;comp.attack.value=.005;comp.release.value=.15
bus.connect(ls);ls.connect(pk);pk.connect(comp);comp.connect(m)
this.ir=this.mkIR(c);this.maxCh=c.destination.maxChannelCount;this.ready=true;this.route()}
catch(e){console.warn('Engine audio unavailable (AudioWorklet needs a secure context)',e)}}
private route(){const c=this.ctx!,sp=this.sp!,V=VIEWS[this.view];sp.disconnect()
this.nodes.forEach(n=>{try{n.disconnect()}catch{}});this.nodes=[]
const keep=<T extends AudioNode>(n:T)=>{this.nodes.push(n);return n}
const mode:AudioMode=this.mode==='surround'&&c.destination.maxChannelCount<6?'binaural':this.mode,sur=mode==='surround';this.eff=mode
try{c.destination.channelCountMode='explicit';c.destination.channelCount=sur?6:2;c.destination.channelInterpretation=sur?'discrete':'speakers'}catch{}
const rv=keep(c.createGain());rv.gain.value=V.rv;const conv=keep(c.createConvolver());conv.buffer=this.ir!;rv.connect(conv)
let mer:ChannelMergerNode|undefined
if(sur){mer=keep(c.createChannelMerger(6));mer.connect(this.m!)
const s2=keep(c.createChannelSplitter(2));conv.connect(s2);s2.connect(mer,0,4);s2.connect(mer,1,5)
const lp=keep(c.createBiquadFilter());lp.type='lowpass';lp.frequency.value=90;const lg=keep(c.createGain());lg.gain.value=.7;lp.connect(lg);lg.connect(mer,0,3);this.lfeIn=lp}
else conv.connect(this.bus!)
const spat=(az:number,d:number):AudioNode=>{const dg=1/(1+.25*Math.max(0,d-1)),r=az*Math.PI/180
if(mode==='binaural'){const p=keep(c.createPanner());p.panningModel='HRTF';p.distanceModel='inverse';p.refDistance=1;p.rolloffFactor=.5;p.positionX.value=Math.sin(r)*d;p.positionY.value=0;p.positionZ.value=-Math.cos(r)*d;p.connect(this.bus!);return p}
if(sur){const inp=keep(c.createGain()),g=pan51(az);[0,1,2,4,5].forEach(ch=>{if(g[ch]>.001){const gn=keep(c.createGain());gn.gain.value=g[ch]*dg;inp.connect(gn);gn.connect(mer!,0,ch)}})
const l=keep(c.createGain());l.gain.value=.5*dg;inp.connect(l);l.connect(this.lfeIn!);return inp}
const gn=keep(c.createGain());gn.gain.value=dg;const pn=keep(c.createStereoPanner());pn.pan.value=Math.sin(r);gn.connect(pn);pn.connect(this.bus!);return gn}
this.spat=spat
for(let i=0;i<4;i++){const lp=keep(c.createBiquadFilter());lp.type='lowpass';lp.frequency.value=V.lp[i];const g=keep(c.createGain());g.gain.value=V.g[i]
sp.connect(lp,i);lp.connect(g);g.connect(spat(V.src[i].az,V.src[i].d));g.connect(rv)}}
async test(){await this.resume();if(!this.ready||!this.spat||!this.ctx)return;const c=this.ctx
const azs=this.eff==='surround'?[-30,0,30,110,-110]:this.eff==='binaural'?[-90,0,90,180]:[-90,90]
azs.forEach((az,i)=>{const t=c.currentTime+.05+i*.6,o=c.createOscillator(),g=c.createGain();o.frequency.value=600;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.3,t+.02);g.gain.linearRampToValueAtTime(0,t+.4)
o.connect(g);g.connect(this.spat!(az,2));o.start(t);o.stop(t+.45)})}
update(s:Sim,on:boolean,vol:number){if(!this.ready||!this.node||!this.m||!this.ctx)return;const cfg=s.cfg
if(cfg.id!==this.cid){this.cid=cfg.id;this.node.port.postMessage({c:{cyl:cfg.cyl,fo:cfg.firing.map(k=>k-1),B:cfg.banks.length,f0:180*Math.pow(2/cfg.dispL,.35),br:cfg.snd[4],jit:cfg.snd[3],skew:cfg.layout==='flat'?1.09:1.04}})}
this.node.port.postMessage({rpm:s.paused?0:s.rpm*Math.min(s.speed,1.5),thr:s.throttle,ld:s.load,fire:s.running?1:0,st:s.starting>0?1:0,max:s.max,cut:s.cut})
this.m.gain.setTargetAtTime(on?vol*.7:0,this.ctx.currentTime,.05)}}
