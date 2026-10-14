# GitHub → Cloudflare Pages 자동 배포 설정 (최초 1회)

## 1. GitHub 저장소 생성

[GitHub 새 저장소](https://github.com/new)에서 `gladiator-arena` 이름의 **Private** 저장소를 만듭니다. `README`/`.gitignore` 자동 생성은 체크하지 않습니다.

## 2. 초기 파일을 GitHub에 올리기

압축 파일을 풀어 나온 폴더의 **내용물**(`public`, `README.md`, `SETUP_KO.md`, `.gitignore`)을 GitHub 저장소에 업로드합니다.

쉬운 방법: 저장소의 `uploading an existing file`을 선택하고 압축을 푼 폴더의 파일과 `public` 폴더를 끌어 놓은 뒤 **Commit changes**를 누릅니다. 업로드 시 `public/index.html`과 `public/assets/...` 경로가 유지되는지 확인합니다.

Windows에서는 Git 설치 후 `FIRST_PUSH_WINDOWS.bat`를 실행하고 새 저장소 URL을 붙여 넣으면 초기 업로드를 자동으로 진행할 수 있습니다. 이후에는 `PUSH_FUTURE_UPDATE_WINDOWS.bat`를 사용할 수 있습니다.

또는 Git CLI:
```sh
cd GLADIATOR_GitHub_Repository_v1.3
git init
git branch -M main
git add .
git commit -m "GLADIATOR v1.3 initial Git deployment"
git remote add origin https://github.com/<YOUR-LOGIN>/gladiator-arena.git
git push -u origin main
```

## 3. Cloudflare Pages Git Integration (새 프로젝트)

[Cloudflare](https://dash.cloudflare.com/) → Workers & Pages → Create application → Pages → Connect to Git → GitHub 승인 → `gladiator-arena` 저장소 선택.

빌드 설정: `Production branch = main`, `Framework preset = None`, `Build command = exit 0`, `Build output directory = public`.

**중요:** 기존 `gladiator-arena-play.pages.dev` 사이트를 지우거나 수정하지 않습니다. 새 Git 배포 프로젝트에는 새 `*.pages.dev` URL이 생성됩니다. 새 URL이 정상적으로 실행되는 것을 확인한 뒤 공유 주소 전환을 결정합니다.

## 4. 그다음부터 자동 배포

`main` 브랜치에 커밋 후 push만 하면 Cloudflare가 자동으로 새 버전을 배포합니다. ZIP을 Cloudflare에 다시 업로드할 필요가 없습니다.

## 나중에 개발자가 게임 수정하는 파일

- 게임 로직: `public/js/game.js`
- 스타일: `public/css/game.css`
- 스프라이트: `public/assets/characters/`
- 데이터: `public/assets/data/`

GitHub 및 Cloudflare 접근 권한이 필요합니다. API 토큰과 비밀번호는 저장소 코드에 넣지 마세요.
