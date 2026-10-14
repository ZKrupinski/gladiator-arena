# GLADIATOR Avatar Resource Specification v1.6

## 목적
최종 승인된 3개 병과의 SD 3D 애니메이션풍 아바타 디자인 시트(무르밀로/트라에키스/레티아리우스)에 기반하여, **레티아리우스의 체형을 공통 기준으로 삼은** 데이터/경로/장비/애니메이션 규격을 확정합니다.

**본 문서는 실제 파츠 이미지 또는 3D 모델이 이미 생성되었다는 의미가 아닙니다.** 개별 파츠와 애니메이션 프레임 제작에는 3D 모델링/리깅/베이킹 또는 일관된 뷰/프레임별 이미지 제작이 필요합니다.

## 신규 파일

| 파일 | 내용 |
|---|---|
| `public/assets/data/avatar-rig.shared.json` | 320x320 공통 좌표, 발 기준점 [160,300], 키 고정, 14개 파츠 슬롯, 장착점 초기값 |
| `public/assets/data/avatar-animations.json` | idle/walk/dash/guard/parry/hit_react/high/mid/low/special/finisher/equip/unequip/drop/pickup/stagger/knockback/defeat 공통 상태·타이밍 규격 |
| `public/assets/avatars/murmillo/manifest.json` | 무르밀로 장비 11부위×5단계 =55개 제작 항목 |
| `public/assets/avatars/thraex/manifest.json` | 트라에키스 장비 11부위×5단계 =55개 제작 항목 |
| `public/assets/avatars/retiarius/manifest.json` | 레티아리우스 장비 11부위×5단계 =55개 제작 항목 |
| `public/js/avatar-resource-registry.js` | 브라우저용 JSON 로더/검사기 + Node 테스트 호환 API |
| `public/avatar-resources.html` | 공유 규격/병과별 제작 현황/애니메이션 목록을 확인하는 진단 페이지 |

## 공통 변형 금지 규격
- classScale = 1 / stageScale = 1. 클래스와 성장 단계로 키, 머리와 팔다리 등신비를 바꾸지 않는다.
- 공유 바디는 레티아리우스 시트를 기준으로 한다. 단, `heightPx`와 앵커 좌표는 **첫 투명 아트 제작 전까지 초기 제안값**으로 본다.
- 기준 canvas=320×320; 발 피벗=[160,300]; 좌/우 반전은 렌더 단계에서 처리.
- 장비는 같은 320×320 좌표·동일 포즈의 투명 레이어로 제작한다.
- 현재 장비 파일은 전부 `productionStatus: not-created` / `resource: null`. 시각 전환 시 기존 합성 WebP를 fallback 한다.
- 장비 ID는 `{class}_{slot}_{stage}`. 실제 게임 장비 DB의 기 보유 아이템과 연결하는 변환표는 추후 작성.
- 프리셋 5개: trainee/novice/gladiator/veteran/champion.

## 사용/검증
```js
const registry = await GladiatorAvatarResources.load();
console.log(registry.ready, registry.reports);
// 제작 중 stage 프리셋 미리보기
const mur = registry.classes.murmillo;
const loadout = GladiatorAvatarResources.getLoadout(mur, "veteran");
```

`/avatar-resources.html`에서 실시간 확인할 수 있습니다.

## 확인 완료
- 3개 병과 스펙 JSON 모두 유효
- 클래스 및 단계 스케일 1
- 5단계×11파츠 = 병과별 55개, 총 165개 파츠 제작 항목 정의
- 18개 애니메이션 상태명/기본 타이밍 정의
- 기존 6포즈 composite fallback 명시
- 게임 본편 v1.4 JS 및 기존 18개 아트 이미지 변경 없음

## 남은 제작
1. 공유 3D SD 베이스 모델/리깅 혹은 실제 2D 고정뷰 기본 프레임 제작
2. 3개 병과 5단계 장비별 독립 투명 파츠 제작 및 모든 포즈 정렬
3. 실제 런타임 바디 렌더러/애니메이션 로딩 결합
4. 파손, 드롭, 장착, 외형 반영의 통합 게임플레이 테스트

> 추가 유의점: 본 명세의 `.glb` 등 경로는 **미래 자산의 계약**일 뿐, 실제 파일이 존재하는 것으로 표시하지 않습니다.
