# 스파르타쿠스 — 검투사 공통 등록부 (양방향)

새 외형을 검투사시장/훈련소/로스터/장비/전투/스프라이트 보정실에 **여러 번 등록하지 않는다**.
유일한 식별자는 `visualId`이며, 기본 외형 27종과 신규 외형의 공통 출처는
`public/gladiator-registry.js` (`window.SpartacusGladiators`)다.

## 새 외형 제작 및 게임에 일괄 등록

1. 기존 게임의 인간 클래스 `murmillo`, `thraex`, `retiarius` 중 하나를 택한다.
   전혀 새로운 **전투 클래스**에는 스탯·상성·AI·무기 규칙의 구현이 선행돼야 한다.
2. 새 전용 폴더 `public/assets/combat/<unique-name>/`에
   `idle.png`, `walk.png`, `slash.png`, `sweep.png`, `thrust.png`,
   `heavy.png`, `guard.png`, `hit.png`, `death.png`를 준비한다.
   9개 파일은 각각 투명 3840×1080, 960×540 셀의 **4열 × 2행, 동작별 8프레임**이다.
   기존 검투사 파일을 복사해 신규 캐릭터로 위장하지 않는다.
3. 조정실에서 **신규 검투사 등록**의 고유 ID, 클래스, 외형 이름, 이미지 폴더,
   가격레벨을 입력하고 **9개 동작 원본 검사 후 공통 등록**을 누른다.
   검사 실패 시 기존 시장/전투/원본은 유지된다.
4. 같은 기기에서 새로고침하면 검투사시장 후보, 조정실 크기/발높이/모션/VFX/가격,
   루두스 인물 이미지, 장비/훈련/결과, 1:1/실전훈련/5대5 전투가 하나의 ID를 참조한다.
   시장은 등록 외형 3명씩 페이지가 늘어난다.
5. 여러 기기에 영구 반영하려면 **조정실 → GitHub 원본 게시**를 실행한다.
   이는 `public/practice-scale-published.js`의 등록부·크기·발높이·동작·가격을 커밋한다.
   **스프라이트 이미지 9개 자체는 먼저 GitHub에 별도로 업로드 및 배포돼 있어야 한다.**
   브라우저의 임시 저장만으로 이미지 파일/전체 기기 원본을 게시하지 않는다.
6. GitHub Actions의 `qa-market-balance-center.yml`와
   `qa-redcrest-alt-cloudflare.yml`에서 단위·브라우저·배포 일치 검사를 실행한다.

## 게임 코드에서 먼저 새 검투사를 등록할 때

공통 API 하나만 쓰면 **조정실과 시장에 역방향으로 반영**된다:

```js
window.SpartacusGladiators.register({
  visualId: 'murmillo_goldhelm_v1',
  cls: 'murmillo',
  label: '황금 투구 무르밀로',
  assetFolder: 'assets/combat/murmillo-goldhelm-v1',
  priceLevel: 3
});
```

게임 모션 등록 API와 한 번에 연결하려면:
```js
window.SpriteMotionRegistry.registerCharacter('murmillo_goldhelm_v1', {
  gladiator: {
    visualId:'murmillo_goldhelm_v1',
    cls:'murmillo',
    label:'황금 투구 무르밀로',
    assetFolder:'assets/combat/murmillo-goldhelm-v1',
    priceLevel:3
  }
});
```

두 API 모두 **기기 임시 등록**이며 미배포 이미지에 대한 승인을 의미하지 않는다.
필요하다면 `await SpartacusGladiators.verifyArt(record)`로 스프라이트를 확인하고 등록한다.
등록 후 조정실에서 GitHub 게시를 해야 계정/기기에 상관없는 영구 반영이 가능하다.

## 보호 규칙

- 모든 기존 캐릭터 ID, 가격 레벨, 크기, 전투 스탯, 성장 데이터, 저장된 고용 인원 보존
- 새 검투사는 새로운 전용 이미지 폴더를 사용한다. **다른 검투사의 그림으로 폴백 금지**
- 야수 5종 및 사형집행인은 시장 등록 대상이 아니라 조정실 프리뷰만 유지한다
- 동일 ID와 동일 폴더 재할당 거절
- 신규 외형은 무르밀로/트라엑스/레티아리우스 클래스의 기존 전투·상성·AI 규칙을 상속
- 등록 메타데이터(텍스트)만 존재하고 동작 이미지가 없으면 정상적인 배포로 취급하지 않는다
