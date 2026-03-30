# Tower Defense Game — Agent Learnings

이 파일은 Ralph Loop의 매 반복에서 발견한 것들을 기록합니다.
다음 반복에서 이 파일을 읽고 같은 실수를 반복하지 않습니다.

## 레퍼런스 게임
- Kingdom Rush: 코믹북 스타일, 타이트한 밸런스, 직관적 조작, 창의적 레벨 디자인
- Bloons TD 6: 70+ 맵, 타워 조합, 끊임없는 업데이트
- Plants vs Zombies: 간단한 조작, 명확한 피드백, 유머

## 핵심 원칙
- 코딩 전에 게임 디자인부터
- 비주얼과 피드백이 재미의 절반
- "의미 있는 선택"이 없으면 재미없음
- 처치 시 보상감 (파티클, 소리, 골드 팝업)이 중독성의 핵심

## 반복 기록

### 반복 1 — 2026-03-30 (visual-map, visual-towers, visual-enemies, fx-particles, fx-shoot, fx-hit)

**구현 내용:**
- `js/particles.js` 신규: 범용 파티클 엔진 (폭발, 연기, 스파크, 얼음 조각, 골드팝업, 화면흔들림)
- `renderer.js` 완전 재작성: 그라데이션 배경, 흙길 텍스처 경로, 나무/바위/덤불 장식, 타워/적 캔버스 드로잉
- 타워: Arrow(성벽+궁수), Cannon(포신 회전), Ice(결정 첨탑+애니), Lightning(번개탑+전기 아크)
- 적: Goblin(초록 고블린), Wolf(파란 늑대), Golem(돌 골렘 균열), Dragon(날개 보스)
- 발사 시 머즐 플래시, 투사체 꼬리 트레일, 캐논은 연기
- 적 사망 시 파티클 폭발 + 골드 팝업, 보스 사망 시 화면 흔들림

**배운 것:**
- `particles.js`는 `state.js` 이후에 로드해야 함 (state.particles 의존)
- `generateDecorations()`은 경로 생성 후에 호출해야 함 (isPathTile 의존)
- `mulberry32`로 결정론적 씨앗 기반 장식 배치 → 리사이즈해도 동일 위치
- `ctx.roundRect()`는 모던 브라우저에서 지원됨, 구형 지원 필요시 polyfill 필요
- 포신 각도(`tower.barrelAngle`)는 createProjectile에서 설정하면 렌더러에서 그대로 사용
- `updateParticles`는 속도 배율(state.speed) 없이 rawDt 사용 — 파티클이 너무 빠르게 사라지지 않도록
- JS `new Function()` 으로 syntax 검사 가능 (브라우저 없이)
