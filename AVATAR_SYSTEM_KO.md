# GLADIATOR 아바타 시스템 — v1.5 Foundation (개발 PR)

## 목표 / 참고 이미지 해석

사용자가 제공한 검투사/훈련장 레퍼런스들은 **어린 SD형 포로(또는 수련생)가 검과 작은 방패를 들고, 훈련과 장비 보강을 거쳐 장갑 검투사와 챔피언으로 성장하는 변화**를 보여 준다. 공통 디자인 지침은 **큰 머리, 낮은 신장, 눈에 띄는 얼굴 표정, 재질/장비의 대비, 따뜻한 로마 콜로세움 조명**이다. 해당 자료는 채색된 장면 일러스트이지, 잘라 쓸 수 있는 투명 캐릭터 파츠나 애니메이션 소스가 아니다.

기존 v1.4의 픽셀 캐릭터는 **body+armor+helmet+shield+weapon 합성 WebP**로 되어 있으며, 무조건 투구/방패를 가리는 방식은 얼굴 또는 신체가 잘리는 문제를 일으킨다. 따라서 별도의 베이스 프레임 및 부위별 투명 레이어가 생길 때까지 **composite fallback**을 강제한다. 참고 아트의 3D 렌더링 질감으로 현재 픽셀 아트를 자동 교체하지 않는다.

## 구현 위치

| 위치 | 내용 |
|---|---|
| `public/assets/data/avatar-catalog.json` | 병과, 5 성장 단계, 장비 슬롯, 기본 장비, 내구도, 6 포즈, 합성/레이어 경로 명세 |
| `public/js/avatar-core.js` | 독립 아바타 상태 API, 데이터 검증, 슬롯 장착/해제, 파손/수리, 포즈별 렌더 계획, JSON 호환성 검증 |
| `public/avatar-lab.html` | 병과·성장·외형·포즈·장비를 확인하고 JSON 저장/복원하는 반응형 UI |
| `public/index.html` | 아바타 실험실로 이동하는 안전한 링크만 추가, 전투 로직은 변경 없음 |

## 게임 아바타 데이터

```json
{
  "schema": 1,
  "classId": "murmillo",
  "stageId": "gladiator",
  "level": 5,
  "appearance": {
    "skinTone": "warm",
    "hairStyle": "crop",
    "expression": "focused",
    "bodyType": "chibi"
  },
  "equipment": {
    "helmet": "murmillo_helmet",
    "armor": "murmillo_armor",
    "weapon": "gladius",
    "shield": "scutum",
    "offhand": null
  },
  "durability": {
    "murmillo_helmet": 82,
    "murmillo_armor": 114,
    "gladius": 82,
    "scutum": 95
  }
}
```

- `classId`: 전투 병과 (murmillo / thraex / retiarius)
- `stageId`: 독립 성장 지표 (captivus / tiro / gladiator / veteranus / campio), 실제 장비/외형에 종속되지 않음
- `appearance`: 머리/얼굴/피부/체형의 **데이터만** 표시; 시각 변경은 추후 리소스 제작 필요
- `equipment`: 슬롯당 장비 하나. 기존 `equipment.json`의 아이템 ID를 그대로 사용
- `durability`: 장비별 HP. 슬롯 피해가 0에 도달하면 파손, 수리 가능
- 전투 시스템의 현재 파손/드롭 값과 아바타 장비 상태를 동기화하는 연결은 후속 단계로 유보 (현재 독립 프로토타입)

## 아바타 API (window.GladiatorAvatar / CommonJS)

`validateCatalog(catalog)` → 오류 배열

`createAvatar(catalog, classId, {stageId, equipped, appearance})`

`setClass(catalog, avatar, classId)` / `setStage(catalog, avatar, stageId)` / `setAppearance(...)`

`equip(catalog, avatar, itemId)` / `unequip(catalog, avatar, slot)`

`damageSlot(catalog, avatar, slot, amount)` / `repairSlot(catalog, avatar, slot)`

`getSlotStates(catalog, avatar)` / `getRenderPlan(catalog, avatar, pose)`

`exportAvatar(avatar)` / `importAvatar(catalog, json)`

모든 API는 호출자의 원본 아바타를 변형하지 않고 새 객체를 반환한다. 허용되지 않은 병과 아이템이나 잘못된 슬롯, 손상된 JSON을 거절한다.

## 렌더링 자산 계약

- 포즈 `idle,walk,guard,high,mid,low` 별 320×320 이미지로 제작
- 좌우 회전은 화면 표시 단계에서 x축 반전, 기준점은 160×300 발 위치
- 베이스 원화는 `classes.{id}.poses.{pose}.base`에 경로 등록 (아직 null)
- 개별 장비 원화는 `items.{itemId}.appearanceByPose.{pose}`에 경로 등록 (아직 null)
- 렌더 순서는 `render.order`에 명시. 예: back → legs → base → armor → arms → head → helmet → offhand → shield → weapon → effect
- **완전한 포즈 베이스 이미지 및 현재 장착된 모든 장비 레이어**가 없으면 `getRenderPlan`은 무조건 `mode:'composite'` 반환. 합성 이미지 위에 불완전한 장비를 덧그리지 않는다.
- 현 애니메이션/머리 이미지 파일은 덮어쓰지 않는다.

## 실험실 확인 순서

1. `/avatar-lab.html`에 접속한다.
2. 병과를 바꾸고 기존 6 포즈가 모두 정상 표시되는지 확인한다.
3. 성장 단계, 피부/헤어/표정/체형 값을 변경하고 자동 저장 여부를 확인한다.
4. 병과 기본 장비를 입힌 뒤, 슬롯별 '피해 -25', '수리', 장비 해제를 테스트한다.
5. `JSON 내보내기` 후 페이지를 새로고침하거나 JSON을 가져와 상태가 유지되는지 확인한다.
6. 메인 화면으로 돌아가 기존 v1.4 전투가 변함없이 진행되는지 확인한다.

## 후속 단계 — 실제 시각 아바타 레이어

1. **무르밀로 idle**을 1차 대상으로, 맨몸 베이스/투구/갑옷/방패/검을 독립 320×320 투명 프레임으로 새로 제작하고 기준점 검증
2. walk, guard, high, mid, low 순으로 동일 파츠 정합성 검증
3. 장비의 `appearanceByPose`를 채우고 `layered` 모드 전환 테스트
4. 나머지 병과 적용 및 실제 전투 파손·투구 분실·회수 이벤트와 아바타 시스템 결합
5. 성장 단계별 신규 헤어, 얼굴, 체형·갑옷 실루엣 제작. 게임 전투의 원본 픽셀 아트 스타일 및 스케일은 유지

> 개발 상태: 데이터와 독립 뷰어만 구현했다. 실제 장비 분리 그래픽, 게임 전투 연동, 참고 이미지의 3D 캐릭터 자동 게임화는 구현하지 않았다.
