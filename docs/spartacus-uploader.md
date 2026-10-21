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
각 동작 **고해상도 RGBA 4×2 시트 한 장씩** 둔다.

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

프로필은 원본 시트를 **단순 확대하지 않고** 직접 고해상도 WebP
아틀라스로 만든다. 각 4×2 시트의 네이티브 해상도는 최소
3072×1536px(셀 768×768px), 셀마다 12px 이상 외곽 여백,
투명 배경이 기본이다. 이 기준을 못 맞추는 구형 1672×941px
이미지는 **제작 중간본**으로 보관하고 출시 차단한다.
컷팅만으로 진짜 네이티브 디테일을 생성했다고 주장하지 않는다.

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
