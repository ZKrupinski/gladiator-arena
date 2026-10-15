# GLADIATOR New Era: GitHub → Cloudflare Pages

현재 프로젝트는 기존 저장소 `ZKrupinski/gladiator-arena`의 `main` 브랜치를 사용합니다.
신규 저장소를 다시 만들거나 클래식 `js/game.js` 경로를 복구할 필요가 없습니다.

- **게임 실행 진입점:** `public/index.html`
- **신규 캐릭터·이펙트 이미지:** `public/assets/new-era/`
- **Cloudflare 배포 폴더:** `public`
- **Cloudflare 프로젝트 URL:** https://gladiator-arena-git.pages.dev/
- **빌드:** Framework None, build command 빈 값 혹은 `exit 0`

`main`에 파일을 커밋하면 GitHub 연동 Pages가 재배포합니다(연동 활성화 조건).
배포가 반영되지 않을 때에는 Cloudflare Dashboard의 해당 Pages 프로젝트 → Deployments 에서 최근 커밋이 성공했는지 확인합니다.
브라우저 캐시가 남으면 새로고침(Ctrl+Shift+R)하거나 새 시크릿 창에서 테스트하세요.

검투사 이미지의 최신 원본과 런타임 표시 구성이 일치하는지 먼저 확인한 뒤, 별도 아트 수정과 Git 배포를 계속 진행합니다.
