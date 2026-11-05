import {EngineConfig,torqueAt,hpOf} from '../data/engines'
export interface DynoPoint{rpm:number;tq:number;hp:number}
export class Sim{
cfg!:EngineConfig;running=false;starting=0;paused=false;speed=1;throttle=.35;load=.3;cmd=1500;idle=900;max=7000
rpm=0;crank=0;temp=25;oil=0;exp={v:0,t:0}
dyno={active:false,done:false,t:0,dur:14,points:[] as DynoPoint[]};private saved=.35
setEngine(c:EngineConfig){this.cfg=c;this.idle=c.idle;this.max=c.redline;this.cmd=Math.max(c.idle,1500);this.running=false;this.starting=0;this.rpm=0;this.dyno={active:false,done:false,t:0,dur:14,points:[]}}
start(){if(!this.running&&this.starting<=0)this.starting=1.4}
stop(){if(this.dyno.active)this.endDyno();this.running=false;this.starting=0}
startDyno(){this.running=true;this.starting=0;this.paused=false;if(!this.dyno.active)this.saved=this.throttle;this.throttle=1;this.dyno={active:true,done:false,t:0,dur:14,points:[]}}
endDyno(){if(!this.dyno.active)return;this.dyno.active=false;this.dyno.done=true;this.throttle=this.saved}
step(raw:number){const dt=Math.min(raw,.05),e=this.exp
e.v+=Math.sign(e.t-e.v)*Math.min(Math.abs(e.t-e.v),dt*.55)
if(this.paused)return
const d=this.dyno
if(this.starting>0){this.starting-=dt;this.rpm+=(240-this.rpm)*(1-Math.exp(-dt*5));if(this.starting<=0)this.running=true}
else if(this.running){
if(d.active){d.t+=dt;const f=Math.min(1,d.t/d.dur);this.rpm=this.idle+(this.max-this.idle)*f
const last=d.points[d.points.length-1]
if(!last||this.rpm-last.rpm>=100){const tq=torqueAt(this.cfg,this.rpm);d.points.push({rpm:Math.round(this.rpm),tq,hp:hpOf(tq,this.rpm)})}
if(f>=1)this.endDyno()}
else{let t=this.idle+(Math.min(this.cmd,this.max)-this.idle)*Math.sqrt(this.throttle);t-=(t-this.idle)*this.load*.2;t=Math.max(this.idle,t)
this.rpm+=(t-this.rpm)*(1-Math.exp(-dt*(1.5+3*this.throttle)))}}
else{this.rpm*=Math.exp(-dt*1.6);if(this.rpm<5)this.rpm=0}
this.crank=(this.crank+this.rpm*6*dt*this.speed)%720
const tt=this.running?88+22*this.load*(this.rpm/this.max)+6*this.throttle:25
this.temp+=(tt-this.temp)*(1-Math.exp(-dt*(this.running?.06:.015)))
this.oil=this.rpm<30?0:(.8+this.rpm/10000*4.2)*(this.temp<60?1.15:1)}
snap(){const r=this.rpm,c=this.cfg,full=r<50?0:torqueAt(c,r)
const tq=this.dyno.active?full:this.running?full*(.12+.88*this.throttle):0
return{rpm:r,tq,hp:hpOf(tq,r),temp:this.temp,oil:this.oil,thr:this.throttle,load:this.load,freq:r/120*c.cyl,crank:this.crank,running:this.running,starting:this.starting>0,paused:this.paused,exp:this.exp.v,speed:this.speed,idle:this.idle,max:this.max,cmd:this.cmd,
dyno:{active:this.dyno.active,done:this.dyno.done,p:Math.min(1,this.dyno.t/this.dyno.dur),pts:this.dyno.points.slice()}}}}
export type Snap=ReturnType<Sim['snap']>
