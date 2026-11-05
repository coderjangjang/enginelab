export type PartType='block'|'piston'|'rod'|'crank'|'cam'|'ivalve'|'evalve'|'plug'|'imanifold'|'emanifold'
export const PART_TYPES:PartType[]=['block','piston','rod','crank','cam','ivalve','evalve','plug','imanifold','emanifold']
export const PARTS:Record<PartType,{name:string;desc:string}>={
block:{name:'Cylinder Block',desc:'엔진의 뼈대. 실린더 보어(슬리브)와 크랭크케이스를 포함하며 모든 가동 부품을 지지하고 냉각수·오일 통로를 제공합니다. 분해 시 기준 위치로 남습니다.'},
piston:{name:'Piston',desc:'연소 압력을 받아 실린더 안을 왕복하는 부품. 흡입·압축·폭발·배기 4행정 동안 상하 운동을 하며 폭발력을 커넥팅 로드로 전달합니다.'},
rod:{name:'Connecting Rod',desc:'피스톤의 직선 왕복 운동을 크랭크샤프트의 회전 운동으로 바꿔 주는 연결 부품. 작은 쪽은 피스톤 핀, 큰 쪽은 크랭크 핀에 물립니다.'},
crank:{name:'Crankshaft',desc:'각 실린더의 힘을 모아 회전 토크로 출력하는 축. 크랭크 핀의 각도 배치가 점화 간격과 엔진의 진동·사운드 특성을 결정합니다.'},
cam:{name:'Camshaft',desc:'크랭크샤프트 속도의 절반으로 회전하며 캠 로브로 흡기·배기 밸브를 정확한 타이밍에 열고 닫습니다.'},
ivalve:{name:'Intake Valve',desc:'흡입 행정에서 열려 공기와 연료 혼합기를 연소실로 들이고, 압축·폭발 동안에는 닫혀 연소실을 밀폐합니다.'},
evalve:{name:'Exhaust Valve',desc:'배기 행정에서 열려 연소 가스를 배기 매니폴드로 내보냅니다. 고온에 노출되어 흡기 밸브보다 내열 설계가 중요합니다.'},
plug:{name:'Spark Plug',desc:'압축 행정 끝(상사점 직전)에 전기 불꽃을 일으켜 혼합기를 점화합니다. 점화 시기는 엔진 출력과 효율에 직접 영향을 줍니다.'},
imanifold:{name:'Intake Manifold',desc:'스로틀을 통과한 공기를 각 실린더의 흡기 포트로 고르게 분배하는 관. 길이와 형상이 흡입 효율에 영향을 줍니다.'},
emanifold:{name:'Exhaust Manifold',desc:'각 실린더의 배기 가스를 모아 배기 계통으로 보내는 관. 배기 맥동과 배압이 출력과 사운드에 영향을 줍니다.'}}
