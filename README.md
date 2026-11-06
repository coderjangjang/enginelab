# ENGINE LAB

3D 자동차 엔진 시뮬레이터. 엔진 내부 구조를 관찰하고, 분해·조립하고, 시동을 걸어 4행정 작동을 확인할 수 있습니다.

## 실행

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 타입 검사 + 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

Node.js 18 이상을 권장합니다. 사운드는 AudioWorklet을 쓰므로 `localhost` 또는 HTTPS에서만 동작하며, 브라우저 정책상 **Engine Start**나 **Start test**를 누른 뒤부터 재생됩니다.

## 기술 스택

React 18 · TypeScript · Vite · Three.js · React Three Fiber · Drei · Tailwind CSS · Recharts · Web Audio API

## 주요 기능

- **엔진 13종**: Inline-3/4/5/6, V6/V8/V10/V12/V16, Flat-4/6, W12/W16 (실린더 배치와 점화 순서 반영)
- **3D 시뮬레이션**: 블록, 피스톤, 커넥팅 로드, 크랭크샤프트, 캠샤프트, 흡·배기 밸브, 점화 플러그, 흡·배기 매니폴드를 각각 독립 오브젝트로 구현
- **Exploded View**: Explode / Assemble 버튼, 0~100% 슬라이더, 조립 순서를 따르는 분해 애니메이션, 부품 선택·강조·숨김, 선택 시 카메라 이동과 부품 설명
- **4행정 표시**: 실린더별 Intake / Compression / Power / Exhaust 상태와 밸브 개폐 (Cylinders 탭)
- **조작 패널**: Start, Stop, Pause, Resume, RPM, Throttle, Load, Idle RPM, Max RPM, Sim Speed
- **계기판**: RPM, 토크, 마력, 온도, 유압, 스로틀, 부하, 점화 주파수 (SIM / EST / CALC / INPUT 태그로 구분)
- **사운드**: AudioWorklet 기반 물리 모델 합성. 점화 순서에 따른 배기 펄스, 뱅크별 좌우 배기관, 흡기음, 시동 모터·크랭킹, 감속 백파이어, 레브 리미터, 룸 리버브. ON/OFF·볼륨
- **Dyno**: RPM 스윕 측정, 토크·마력 그래프, 최대값 표시, 결과 저장(localStorage)
- **Lab (실험 기능)**: 자동 스로틀(Throttle / RPM / Both를 min~max로 자동 조절, Ramp·Ping-pong·Sine·Staircase·Rev blip 패턴, 주기·반복 설정, 프리셋), 실린더 차단(Cylinder cut) — 토크·사운드·점화 간격 변화 관찰
- **Compare**: 두 엔진의 사양 표와 토크·마력 곡선 비교
- **Engine Library / Settings**: 엔진 카드 목록, 뷰어 배경(검정/밝은 회색)·사운드 설정

## 사용법

| 동작 | 방법 |
| --- | --- |
| 회전 / 확대·축소 / 이동 | 마우스 드래그 / 휠 / 우클릭 드래그 |
| 분해·조립 | 뷰어 상단의 Explode, Assemble 버튼 또는 슬라이더 |
| 부품 선택 | 3D 모델 클릭 또는 왼쪽 Parts 목록 (빈 곳 클릭 시 해제) |
| 부품 숨김 | Parts 목록의 눈 아이콘 (Show all로 복구) |
| 시동 | 하단 Engine Start 후 RPM·Throttle 조절 |
| 자동 스로틀 | 우측 Lab 탭 → 대상·패턴·min/max·주기 설정 → Start |
| 실린더 차단 | Cylinders 탭에서 행 클릭 또는 Lab 탭의 Cylinder cut |
| 다이노 | 우측 Dyno 탭 → Start test → Save |

## 프로젝트 구조

```
src/
├─ data/
│  ├─ engines.ts      # 엔진별 설정, 토크 곡선, 실린더 배치 계산
│  └─ parts.ts        # 부품 종류와 설명
├─ sim/
│  ├─ Sim.ts          # 시뮬레이션 상태·물리 (UI와 분리, 시간 기반)
│  └─ audio.ts        # AudioWorklet 엔진 사운드 합성
├─ components/
│  ├─ Viewer.tsx      # R3F 3D 모델, 분해 애니메이션, 카메라
│  ├─ Panels.tsx      # 좌/우 패널, 계기판, 조작 바
│  ├─ DynoPanel.tsx   # Dyno 탭과 공용 차트
│  ├─ LabPanel.tsx    # 자동 스로틀·실린더 차단 실험
│  ├─ Pages.tsx       # Library, Compare, Settings
│  └─ ui.tsx          # 버튼, 슬라이더 등 공용 요소
├─ App.tsx            # 상태 연결과 레이아웃
└─ main.tsx
```

## 설계 메모

- **시간 기반 계산**: `Sim.step(dt)`가 프레임 간 시간차로 크랭크 각도와 RPM을 갱신하므로 프레임 속도에 영향받지 않습니다. 3D 모델은 매 프레임 `Sim`을 직접 읽고, 패널은 약 80ms 간격의 스냅샷을 사용합니다.
- **분해 위치**: 각 부품은 조립 위치 기준의 오프셋 벡터와 진행 구간(window)을 가집니다. 분해 정도(0~1)에서 위치를 계산하므로 0으로 돌리면 항상 원위치입니다.
- **크랭크 위상**: 점화 순서에서 실린더별 4행정 위상을 계산하고, 크랭크 핀 각도에 반영합니다.
- **디자인 제약**: `tailwind.config.js`의 색상표를 `#FFFFFF` `#000000` `#808080` `#F2F2F2`로 제한했습니다.

## 한계

- 토크 곡선, 온도, 유압은 단순화한 **추정 모델**이며 실측값이 아닙니다.
- W형 엔진과 V16은 단순화한 배치이고, 일부 점화 순서는 임의로 구성했습니다.
- 엔진 블록은 분해 때 기준 위치로 남습니다.
- 사운드는 샘플 없이 실시간 합성하는 모델이라 실제 녹음과는 차이가 있습니다.
