import {Sim} from './Sim'
/* 물리 모델 기반 엔진 사운드 합성 (AudioWorklet)
 * - 크랭크 위상에서 점화 시점을 계산하고, 실린더마다 압력 펄스를 배기관(지연선+감쇠 피드백)에 주입
 * - 뱅크별 배기관을 좌/우로 분리, 점화 순서·불균일 간격이 그대로 음색에 반영됨
 * - 흡기 노이즈, 밸브트레인 틱, 감속 시 백파이어, 시동 모터음, 레브 리미터 포함
 * - 이후 EQ·컴프레서·짧은 룸 리버브로 마무리 */
const CODE=`
const H=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x)};
class EngineProc extends AudioWorkletProcessor{
constructor(){super();
this.c={cyl:4,fo:[0,2,3,1],B:1,f0:180,br:480,jit:3,skew:1.05};
this.t={rpm:0,thr:0,ld:0,fire:0,st:0,max:7000};
this.rpm=0;this.thr=0;this.ld=0;this.st=0;this.ph=0;this.k=0;
this.buf=[new Float32Array(4096),new Float32Array(4096)];this.wp=[0,0];this.lp=[0,0];
this.env=[0,0];this.e1=[0,0];this.ep=[0,0];this.dc=[0,0];this.s=[0,0];
this.n1=0;this.n2=0;this.np=0;this.tk=0;this.sp=0;
this.port.onmessage=e=>{if(e.data.c)this.c=e.data.c;else Object.assign(this.t,e.data)}}
fire(){const c=this.c,t=this.t,ci=c.fo[this.k%c.cyl];this.k++;if(t.cut&&t.cut[ci])return;
let amp=t.fire?(.12+.88*Math.pow(this.thr,.8))*(.72+.28*this.ld):.1+.04*Math.random();
amp*=1+(H(ci)-.5)*.18+(Math.random()-.5)*c.jit*.012;
if(t.fire&&this.rpm>t.max*.985&&(this.k&1))amp*=.12;
if(c.B===1){this.env[0]+=amp;this.env[1]+=amp*.8}else this.env[(ci%c.B)%2]+=amp;
this.tk+=amp*.5}
process(_i,o){const out=o[0],L=out[0],R=out[1]||out[0],n=L.length,c=this.c,t=this.t,sr=sampleRate,s=this.s;
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
for(let b=0;b<2;b++){const u=(s[b]*.8+intake+tick+sw)*g,w=u-this.dc[b];this.dc[b]+=(u-this.dc[b])*.0015;
const v=Math.tanh(w*drive*1.2)*.7;(b?R:L)[i]=v}}
return true}}
registerProcessor('engine-proc',EngineProc);`
export class EngineAudio{
private ctx?:AudioContext;private node?:AudioWorkletNode;private m?:GainNode;private cid='';private ready=false;private busy=false
resume(){if(this.ctx)void this.ctx.resume();else void this.init()}
private ir(c:AudioContext){const len=Math.floor(c.sampleRate*.5),b=c.createBuffer(2,len,c.sampleRate)
for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(len*.22))}return b}
private async init(){if(this.busy)return;this.busy=true
try{const c=this.ctx=new AudioContext({latencyHint:'interactive'});await c.resume()
const url=URL.createObjectURL(new Blob([CODE],{type:'application/javascript'}));await c.audioWorklet.addModule(url);URL.revokeObjectURL(url)
const n=this.node=new AudioWorkletNode(c,'engine-proc',{numberOfInputs:0,outputChannelCount:[2]})
const bq=(type:BiquadFilterType,f:number,g=0,q=1)=>{const b=c.createBiquadFilter();b.type=type;b.frequency.value=f;b.gain.value=g;b.Q.value=q;return b}
const hp=bq('highpass',28),ls=bq('lowshelf',140,5),pk=bq('peaking',2400,-3,.8),lp=bq('lowpass',7500)
const comp=c.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;comp.attack.value=.005;comp.release.value=.15
const conv=c.createConvolver();conv.buffer=this.ir(c);const wet=c.createGain();wet.gain.value=.14
const m=this.m=c.createGain();m.gain.value=0
n.connect(hp);hp.connect(ls);ls.connect(pk);pk.connect(lp);lp.connect(comp);comp.connect(m);lp.connect(conv);conv.connect(wet);wet.connect(m);m.connect(c.destination)
this.ready=true}catch(e){console.warn('Engine audio unavailable (AudioWorklet needs a secure context)',e)}}
update(s:Sim,on:boolean,vol:number){if(!this.ready||!this.node||!this.m||!this.ctx)return;const cfg=s.cfg
if(cfg.id!==this.cid){this.cid=cfg.id;this.node.port.postMessage({c:{cyl:cfg.cyl,fo:cfg.firing.map(k=>k-1),B:cfg.banks.length,f0:180*Math.pow(2/cfg.dispL,.35),br:cfg.snd[4],jit:cfg.snd[3],skew:cfg.layout==='flat'?1.09:1.04}})}
this.node.port.postMessage({rpm:s.paused?0:s.rpm*Math.min(s.speed,1.5),thr:s.throttle,ld:s.load,fire:s.running?1:0,st:s.starting>0?1:0,max:s.max,cut:s.cut})
this.m.gain.setTargetAtTime(on?vol*.7:0,this.ctx.currentTime,.05)}}
