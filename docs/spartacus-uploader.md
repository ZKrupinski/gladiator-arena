# 스파르타쿠스 전용 업로더 · Spartacus Release Uploader v1

> **고정 대상:** GitHub \`ZKrupinski/gladiator-arena\`, 배포 브랜치
> \`main\`, 게임 정적 파일 \`public/\`, Cloudflare Pages
> https://gladiator-arena-git.pages.dev/ .
> **별도 프로젝트 경로나 ZIP을 매번 요청하지 않는다.**

## 기본 약속: 매번 같은 절차를 반복 질문하지 않기

게임 수정·추가·스프라이트 교체·배포 요청 시 AI 작업자가 이 저장소의
현재 \`main\` 커밋을 먼저 확인한다. 이후:
1. 잠긴 버전 SHA와 기존 게임 소스·리소스 확인.
2. 변경 코드·PNG/WebP를 수집, 원본 백업은 Git 기록으로 보존.
3. SpriteForge V3 브리핑 및 대상 동작의 8프레임 QA를 먼저 시행.
4. 파일 서명(SHA256)·크기·PNG 기본 구조·파일 경로·코드 문법·릴리스
   권한 확인. 실패하면 **현재 정상 게임은 그대로 유지**.
5. 모든 파일을 하나의 Git 트리+커밋에 원자적으로 업로드;
   다른 작업이 \`main\`을 먼저 바꿨으면 중단하고 버전 재확인.
6. 기존 Cloudflare **Git 연동 자동 배포**를 기다리고
   \`uploader-release.json\`의 고유 릴리스 ID 및 배포된 게임 파일
   SHA256이 업로드본과 같은지 실제 URL에서 재검증.
7. 보고서에서 상태를 정확히 구분한다:
   \`FAILED\` / \`COMMITTED_DEPLOY_NOT_YET_VERIFIED\` /
   \`DEPLOYED_VERIFIED\`. 커밋 성공만으로 배포 완료라 하지 않는다.

## 방법 A — 한 줄 명령으로 로컬/Work 환경에서 자동 업로드

이미 체크아웃한 저장소에서 GitHub 토큰을 환경변수
\`GITHUB_TOKEN\` 또는 \`GH_TOKEN\`에 연결해 둔 뒤:

\`\`\`bash
python scripts/spartacus_uploader.py status

# 먼저 파일만 확인 (게임에 반영하지 않음):
python scripts/spartacus_uploader.py package \\
  --source /path/to/approved-assets \\
  --out /tmp/spartacus-upload-review.json

# 코드 + 리소스 업로드, main 최신 버전 비교 및 Cloudflare 배포 증명:
python scripts/spartacus_uploader.py publish \\
  --input /path/to/approved-assets \\
  --mapping /path/to/approved-assets/paths.json \\
  --confirm
\`\`\`

\`paths.json\`은 소스 폴더 기준 경로를 실제 게임 경로로 연결한다.

\`\`\`json
{
  "arena-beasts.js": "public/arena-beasts.js",
  "idle.webp": "public/assets/beasts/wolf-v3/idle.webp",
  "manifest.json": "public/assets/beasts/wolf-v3/manifest.json"
}
\`\`\`

매핑에 없는 파일은 자동 무시한다. 매핑이 없을 때의 임시 업로드 위치는
\`public/assets/spartacus-uploads/\`로서 **게임 코드에서 자동 사용되지
않는다**. 실제 적용은 실제 런타임 경로 매핑 또는 전용 프로필이 필요하다.

\`--expected-sha <main SHA>\`를 주면 그 버전이 아닌 경우 차단.
\`--confirm\` 없이는 절대 운영 배포하지 않는다.

## 방법 B — ChatGPT의 GitHub 연결 도구만으로 자동 업로드

현재 게임에서 사용 가능한 GitHub 연결 도구는 텍스트 파일 쓰기와
Git blob/tree/commit/ref 조작을 지원한다. **코드 변경은 연결 도구로
직접 수정 가능**하며, URL을 가진 그림/음원은 아래 대기열로 올리면
GitHub Actions가 다운로드해 바이너리와 코드 파일을 한 번에 반영한다.

1. AI는 GitHub 도구로 현재 \`main\` SHA를 확인한다.
2. 새 텍스트 JSON 하나를
   \`ops/uploader-requests/<unique-release-id>.json\`로
   **\`main\`에 등록**한다.
3. 해당 요청 커밋으로 uploader workflow가 실행되고, 요청 커밋
   **직전의 parent SHA**가 요청 JSON의 \`expectedMainSha\`인지
   확인한다. 파일 내려받기 → SHA 검증 → 문법/QA → Git 커밋 →
   Cloudflare 라이브 검증을 진행한다.
4. AI는 GitHub Actions 실행 결과와 실제 배포 파일 일치를 확인해
   링크를 안내한다.

요청 예시는 \`docs/spartacus-upload-request-example.json\`.
**업로드 요청 하나당 JSON 하나**만 별도 커밋한다. 동시에 여러 업로드
요청이 생기면 동시성 보호 때문에 다음 요청은 현재 버전을 다시
확인해야 한다.

업로드할 그림은 GitHub Actions에서 접근할 수 있는 허용된 HTTPS
URL이거나, 로컬/Work 업로더가 직접 읽을 수 있는 파일이어야 한다.
**채팅 첨부 파일의 내부 경로는 GitHub Actions에서 바로 읽을 수
없다.** 공개 다운로드 URL이 없다면 파일이 있는 Work/PC 환경에서
방법 A를 이용한다. 이미지 파일 자체를 텍스트로 첨부해 업로드했다고
주장하지 않는다.

## 늑대 전용 SpriteForge V3 자동 적용 프로필

\`public/arena-beasts.js\`에는 이미 늑대 V3의 9개 동작 아틀라스 로더와
이전 버전으로 돌아가는 안전한 폴백이 준비되어 있다. 다음 입력 폴더에
각 동작 **임의 해상도 RGBA 4×2 시트 한 장씩** 둔다.

\`idle.png\`, \`walk.png\`, \`attack1.png\`, \`attack2.png\`,
\`attack3.png\`, \`attack4.png\`, \`hit.png\`, \`death.png\`, \`roar.png\`.

\`\`\`bash
# 검수/프레임 GIF 생성; 기존 게임은 그대로:
python scripts/spartacus_wolf_import.py \\
  --source /path/to/approved-wolf-sheets \\
  --review-out /tmp/wolf-v3-review

# 아트 GIF 검수 후에만, 리소스+매니페스트+게임 연결+자동 배포:
python scripts/spartacus_wolf_import.py \\
  --source /path/to/approved-wolf-sheets \\
  --review-out /tmp/wolf-v3-review \\
  --publish --confirm --art-reviewed
\`\`\`

프로필은 원본 시트를 임의 확대하지 않고 원본 해상도로 WebP 아틀라스로 만든다.
**최소 해상도와 캐릭터 크기 제한은 없다.** 4×2 균등 그리드와 투명 배경,
프레임 간 신체 침범·잘림·접지 위치·스케일 일관성은 검사한다.
경계 여백은 셀 크기에 비례한다. 작은 캐릭터와 작은 시트도 유효하다.
단순 확대만으로 새 디테일이 생겼다고 주장하지 않는다.

## 보안/오류 예방

- Github/Cloudflare 비밀번호를 파일/채팅/소스에 직접 저장 금지.
- GitHub 토큰은 GitHub Actions의 자동 주입
  \`GITHUB_TOKEN\` 또는 허가된 Work/환경 변수만 사용.
- \`.github/\`, \`AGENTS.md\`, \`ops/uploader-requests/\` 같은
  실행 정책 경로를 이미지 업로더로 덮어쓰지 못하게 차단.
- 허용 확장자, 허용 게임 경로, 소스 HTTPS 도메인 허용 목록,
  SHA256 및 파일 최대 용량으로 오입력 방지.
- 외부 Cloudflare Git 연동이 꺼져 있으면 업로더가 자동
  배포되었다고 주장하지 않는다. 라이브 검증 실패 시
  \`UNVERIFIED\`와 구체적인 원인을 보고하고 기존 게시된 버전
  확인 및 재시도 절차로 진행.
- 프로덕션 배포는 Git 커밋 기록으로 롤백 가능하지만, 자동 롤백
  자체는 아직 구현되지 않았다.


## 시험용 늑대 이미지 적용 — 정식 품질 게이트를 낮추지 않음 (2026-10-21)

사용자가 1672x941 PNG 10장으로 **게임 안에서 우선 확인**하도록 승인한 상황을
정식 SpriteForge V3 출시 심사와 구분한다. 두 경로 모두 최소 해상도 제한이 없다.

- 정식 게임: `public/assets/beasts/wolf-v3/` 유지. 해상도 최소값 없이
  프레임 외곽 간격·신체 소속 검수 유지. 기본 URL은 시험용 파일을 로딩하지 않음.
- 시험용 게임: `public/assets/beasts/wolf-trial/` 9개 WebP와
  `manifest.json`을 **한 번의 원자적 업로드**로 배포.
  실제 시험 URL은 `https://gladiator-arena-git.pages.dev/?wolfTrial=1`.
- 시험 변환: 원본 PNG는 건드리지 않음. 홀수 높이 941px을
  투명 1px 추가한 942px로 정규화하여 발끝이 절단되는 것을 방지.
  확대/업스케일/가짜 손발 복원은 없음. 프레임 경계 침범은 JSON에 기록되며
  시험용 `previewOnly` 표식이 제거되지 않음.
- 10장 중 9개를 게임 액션에 지정하고 `28415.png`는 대체 공격 이펙트로
  제외하여 기존 원본을 보존.
- 시험판도 SHA256, 실제 Cloudflare 바이트 검증을 **통과해야만**
  배포 성공으로 말한다. 기본 게임 이미지까지 교체했다고 주장하지 않는다.

```bash
# 채팅으로 받은 원본 28415.png~28424.png를 source 폴더에 보유한
# GitHub 인증 실행 환경(PC 또는 Work 클라우드 작업 환경)에서 수행
python scripts/spartacus_wolf_trial.py \
  --source /path/to/ten-original-images \
  --out /tmp/wolf-trial-review

# 이미 인증되어 있는 환경에서만; 기본 플레이는 유지
python scripts/spartacus_wolf_trial.py \
  --source /path/to/ten-original-images \
  --out /tmp/wolf-trial-review \
  --publish --confirm
```

**중요한 연결 문제:** GitHub 연결 도구는 Git 쓰기 권한이 있지만,
채팅에 첨부된 로컬 바이너리 파일의 바이트를 자동으로 해당 도구에
전달하지는 못한다. 이것은 이미지 검수 실패와는 **별개의 전송 문제**다.
이미지 전달이 가능한 실행 환경에서 로컬 퍼블리셔를 실행하거나,
검증된 허용 HTTPS 파일 링크를 업로더 inbox JSON에 넣어야 한다.
토큰이 없는 컨테이너에서 업로드가 완료되었다고 주장하지 않는다.

## 원본 PNG가 HTTPS에 있을 때: 직접 바이너리 브리지 (2026-10-21)

`process-request`는 기존의 `url` + **원본 PNG SHA256** 입력으로
`"transform":"wolf-trial-source-png"`를 허용한다. GitHub Actions가 원본
1672×941 RGBA PNG를 내려받아 SHA256을 검증한 뒤, **마지막 행을 잘라내지 않고**
1672×942 RGBA로 1px 투명 패딩, lossless WebP로 변환한다.
`wolf-trial` 경로 이외에는 절대 이 변환을 허용하지 않는다.

```json
{
  "path": "public/assets/beasts/wolf-trial/idle.webp",
  "url": "https://d2ol7oe51mr4n9.cloudfront.net/.../28419.png",
  "sha256": "원본 PNG의 64자리 SHA256",
  "transform": "wolf-trial-source-png"
}
```

9개 WebP 대상과 `previewOnly:true` 매니페스트가 모두 들어 있어야
원자적 배포가 가능하며, 기본 게임은 변경되지 않는다. 파일이 임시 저장
주소에서 더 이상 제공되지 않거나 해시가 맞지 않는다면 배포를 중단한다.

## 2026-10-21 개정: 해상도/캐릭터 최소 픽셀 제한 전면 폐지

모든 신규 및 구형 게임 캐릭터는 **작더라도 허용**한다. 반드시 지킬 것은
프레임 수, 4×2 나눗셈 가능 여부, 투명도, 이웃 포즈 오염 방지,
발 접지 기준점과 프레임 간 실제 캐릭터 비율 일관성이다. 어느 경로도
예전의 512/768/869px per cell 또는 3072×1536px per sheet를
출시 차단 요건으로 사용하지 않는다. 외부 파일 SHA256 검증은 그대로 유지한다.
