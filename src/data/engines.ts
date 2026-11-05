export type Layout='inline'|'v'|'flat'|'w'
export interface EngineConfig{id:string;name:string;cyl:number;layout:Layout;banks:number[];dispL:number;firing:number[];idle:number;redline:number;tqRpm:number;snd:number[];note:string}
const mk=(id:string,name:string,layout:Layout,banks:number[],cyl:number,dispL:number,firing:number[],idle:number,redline:number,tqRpm:number,snd:number[],note:string):EngineConfig=>({id,name,layout,banks,cyl,dispL,firing,idle,redline,tqRpm,snd,note})
export const ENGINES:EngineConfig[]=[
mk('i3','Inline-3','inline',[0],3,1.5,[1,2,3],900,6500,3800,[1,.5,.1,4,450],'가볍고 작지만 1차 불균형 진동이 있어 밸런스 샤프트를 쓰기도 합니다.'),
mk('i4','Inline-4','inline',[0],4,2.0,[1,3,4,2],850,7000,4500,[1,.4,.15,3,480],'가장 보편적인 구성. 구조가 단순하고 효율적이며 2차 진동이 있습니다.'),
mk('i5','Inline-5','inline',[0],5,2.5,[1,2,4,5,3],850,7000,4200,[1,.45,.25,5,500],'4기통과 6기통 사이의 독특한 음색. 점화 간격 144°.'),
mk('i6','Inline-6','inline',[0],6,3.0,[1,5,3,6,2,4],800,7200,4800,[1,.3,.2,2,520],'1·2차 진동이 모두 상쇄되는 완전 밸런스 구조. 매우 부드럽습니다.'),
mk('v6','V6','v',[-30,30],6,3.5,[1,4,2,5,3,6],800,7000,5000,[1,.5,.3,6,500],'60° V 배치로 짧은 길이. 소형 차량부터 스포츠카까지 폭넓게 사용됩니다.'),
mk('v8','V8','v',[-45,45],8,5.0,[1,8,4,3,6,5,7,2],750,7000,4600,[1,.6,.35,9,380],'90° V. 불규칙한 배기 맥동에서 나오는 깊은 저음과 풍부한 토크가 특징입니다.'),
mk('v10','V10','v',[-36,36],10,5.2,[1,6,5,10,2,7,3,8,4,9],900,8500,6500,[1,.35,.5,6,650],'72° V. 높은 회전수에서 날카로운 사운드를 내는 고회전형 구성.'),
mk('v12','V12','v',[-30,30],12,6.5,[1,7,5,11,3,9,6,12,2,8,4,10],700,8500,6000,[1,.3,.45,4,700],'60° V. 완전 밸런스에 가깝고 매우 매끄러운 출력, 점화 간격 60°.'),
mk('v16','V16','v',[-30,30],16,8.0,[1,9,2,10,3,11,4,12,5,13,6,14,7,15,8,16],650,6500,4500,[1,.25,.5,4,720],'극히 드문 초대형 구성. 거의 연속적인 출력 전달을 보여 줍니다.'),
mk('f4','Flat-4','flat',[-90,90],4,2.0,[1,3,2,4],850,7500,4800,[1,.7,.1,12,420],'수평대향. 낮은 무게중심과 독특한 불규칙 배기음을 갖습니다.'),
mk('f6','Flat-6','flat',[-90,90],6,3.8,[1,6,2,4,3,5],800,8000,5600,[1,.65,.2,10,460],'수평대향 6기통. 낮은 무게중심과 부드러운 회전 질감.'),
mk('w12','W12','w',[-30,0,30],12,6.0,[1,7,5,11,3,9,6,12,2,8,4,10],700,6500,4500,[1,.4,.4,7,640],'3뱅크 배치로 V12보다 짧은 길이. 본 모델은 단순화된 배치입니다.'),
mk('w16','W16','w',[-45,-15,15,45],16,8.0,[1,9,5,13,3,11,7,15,2,10,6,14,4,12,8,16],650,6800,4800,[1,.35,.5,8,720],'4뱅크 배치의 초고출력 구성. 본 모델은 단순화된 배치입니다.')]
export const getEngine=(id:string)=>ENGINES.find(e=>e.id===id)??ENGINES[0]
export const torqueAt=(c:EngineConfig,rpm:number)=>{const x=rpm/c.redline,p=c.tqRpm/c.redline;return c.dispL*118*Math.max(.3,1-2.2*(x-p)**2)}
export const hpOf=(tq:number,rpm:number)=>tq*rpm/7127
export const curve=(c:EngineConfig)=>{const o=[];for(let r=1000;r<=c.redline;r+=250){const tq=torqueAt(c,r);o.push({rpm:r,tq,hp:hpOf(tq,r)})}return o}
export const peaks=(pts:{rpm:number;tq:number;hp:number}[])=>pts.reduce((a,p)=>({tq:p.tq>a.tq?p.tq:a.tq,tqR:p.tq>a.tq?p.rpm:a.tqR,hp:p.hp>a.hp?p.hp:a.hp,hpR:p.hp>a.hp?p.rpm:a.hpR}),{tq:0,tqR:0,hp:0,hpR:0})
export interface CylInfo{i:number;bank:number;a:number;z:number;off:number}
export function cylLayout(c:EngineConfig){const B=c.banks.length,p=1.15
const cyls:CylInfo[]=Array.from({length:c.cyl},(_,i)=>{const bank=i%B,row=Math.floor(i/B),k=c.firing.indexOf(i+1)
return{i,bank,a:c.banks[bank],z:(row*B+bank)*p/B,off:(((360-k*720/c.cyl)%720)+720)%720}})
const zs=cyls.map(q=>q.z),z0=Math.min(...zs),z1=Math.max(...zs);return{cyls,zc:(z0+z1)/2,len:z1-z0+1.2}}
