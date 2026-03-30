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

### 반복 5 — 2026-03-30 (gameplay-skills)

**구현 내용:**
- `js/skills.js` 신규: `SKILL_DEFS` 3개 정의 (airstrike/freeze/heal), `initSkills()`, `updateSkillCooldowns(rawDt)`, `activateSkill(id, x, y)`, `doAirstrike()` / `doFreeze()` / `doHeal()`, `updateSkillUI()` — 쿨다운 오버레이 높이 & 텍스트 갱신
- `js/state.js` 수정: `skills: []`, `targetingSkill: null` 추가, `initState()`에서 `initSkills()` 호출
- `index.html` 수정: `.skills-bar` HTML (스킬 버튼 3개, 각각 `.skill-cd-overlay` + `.skill-cd-text`) 추가, `skills.js` 스크립트 태그
- `css/style.css` 수정: `.skills-bar`, `.skill-btn`, `.skill-btn.ready/.on-cooldown/.targeting`, `.skill-cd-overlay`, `body.targeting-mode #game-canvas` 스타일
- `js/game.js` 수정: 게임루프에서 `updateSkillCooldowns(rawDt)` + `updateSkillUI()` 호출
- `js/input.js` 수정: skills-bar 클릭 → 타겟 필요 스킬은 targeting-mode, 즉시 스킬은 `activateSkill()` 직접 호출; 캔버스 클릭/터치에서 `targetingSkill` 처리 추가
- `js/renderer.js` 수정: `drawAirstrikeTargeting()` 추가 — 마우스 hover 위치에 점선 원 + 크로스헤어 + 펄스 애니메이션

**배운 것:**
- 쿨다운 오버레이는 `height: 0%`→`100%` (bottom에서 채움) 방식이 `clip-path`보다 구현 단순
- `skills.js`는 `particles.js` 이후, `soul.js` 이전에 로드 (`spawnExplosion`, `createParticle` 의존)
- targeting mode는 `document.body.classList`로 CSS 클래스 토글 → canvas cursor 변경 (`body.targeting-mode #game-canvas { cursor: crosshair }`)
- `updateSkillUI()`는 매 프레임 호출해도 부담 없음 — DOM 조작이 최소화되어 있어서
- `initSkills()`는 `initState()`에서 호출 → 게임 재시작 시 쿨다운 리셋 자동 처리

### 반복 4 — 2026-03-30 (gameplay-stages)

**구현 내용:**
- `js/stages.js` 신규: 5개 스테이지 정의(고블린 패스/늑대 협곡/골렘 황무지/드래곤 협곡/악마의 요새), `generatePathForStage()` — 지그재그/U자/S자/빗살/밀집 5가지 경로 형태, `getStageStars()` — 체력 기반 별 1~3개, `showStageSelect()` — 스테이지 선택 화면 렌더링, `isStageUnlocked()` / `saveStageProgress()` — localStorage 진행 저장
- `js/path.js` 수정: `generatePath()` → `generatePathForStage(state.currentStageIndex)` 위임
- `js/state.js` 수정: `currentStageIndex`, `phase: 'stageclear'` 추가, `initState()` 스테이지 시작골드 반영
- `js/wave.js` 수정: `checkWaveEnd()`에서 스테이지 파면 완료 감지(`state.wave >= stage.waves`), `showStageClearOverlay()` 추가 (별점 표시 + 다음 스테이지/스테이지 선택 버튼)
- `js/input.js` 수정: `showOverlay()` action 파라미터 추가, 오버레이 버튼 action별 분기(gameover→선택화면, nextstage→다음스테이지, stageselect→선택화면)
- `js/game.js` 수정: init 시 `showStageSelect()` 호출
- `js/renderer.js` 수정: `drawBackground()`에서 스테이지별 배경 색상(bgColorA/B) 반영
- `index.html/css/style.css`: 스테이지 선택 화면 UI (카드 리스트, 난이도 점, 별, 잠금), 상단 바 스테이지 라벨 + ⚔️ 버튼

**배운 것:**
- `stages.js`는 `config.js`, `state.js` 이후, `path.js` 이전에 로드해야 함 (`CONFIG.COLS/ROWS` 사용)
- `pathFromWaypoints()`는 수평이동 먼저 → 수직이동 순서로 연결 (다른 순서는 대각선이 생김)
- `wp()` 비율 함수에서 `CONFIG.COLS - 1`을 곱해야 마지막 열까지 정확히 닿음 (단순 `* CONFIG.COLS`는 범위 초과)
- 스테이지 클리어 후 "다음 스테이지" 버튼 외에도 "스테이지 선택" 두 번째 버튼 필요 — 동적으로 DOM에 추가
- `showOverlay()` action 파라미터로 버튼 동작 분기 처리 (data-action 속성 활용)
- 스테이지 진행도는 localStorage에 저장 — 세이브 시스템 PRD 항목 구현 전 임시 단독 저장

### 반복 3 — 2026-03-30 (gameplay-waves)

**구현 내용:**
- `js/wave.js`: `getNextWavePreview()` 추가 (적 타입/숫자 예측), `startWave(earlyStart)` 파라미터 추가 (조기 시작 보너스), `updatePrepCountdown(rawDt)` 추가 (자동 카운트다운)
- `js/state.js`: `prepCountdown`, `prepDuration` 필드 추가
- `js/game.js`: 게임루프에서 `updatePrepCountdown` 호출, prep 중 매 프레임 `updateUI()`로 버튼 텍스트 동기화
- `js/renderer.js`: `drawPrepUI()` 추가 — 반투명 패널에 다음 웨이브 번호, 적 아이콘/숫자, 원형 카운트다운, 조기시작 보너스 금액 표시
- `js/input.js`: 버튼 텍스트를 카운트다운 + 보너스 금액으로 실시간 업데이트

**배운 것:**
- 카운트다운은 `rawDt`(실제 시간)로 처리해야 배속(state.speed)에 무관하게 동작
- `spawnFloatingText` 함수 없음 — `state.floatingTexts.push()` 직접 사용
- prep UI는 `ctx.restore()` 이전에 마지막에 그려야 다른 레이어 위에 표시됨
- `prepCountdown = 0` 초기 상태 = 첫 웨이브는 수동 시작 (카운트다운 없음). 웨이브 클리어 후부터만 카운트다운 활성화
- `updateUI()`는 이벤트 기반만으로 충분하지 않음 — countdown 버튼 텍스트 동기화를 위해 prep 중 매 프레임 호출 필요

### 반복 2 — 2026-03-30 (gameplay-unique, gameplay-strength)

**구현 내용:**
- `js/soul.js` 신규: 소울 드롭 시스템 (캔버스 glowing orb, 클릭 수집, 인벤토리 UI)
- `js/fusion.js` 신규: 10가지 합성 레시피 (Poison Arrow, Swift Arrow, Siege Cannon, Cursed Frost, Chain Storm, Stone Shot, Dragon Fang, Dragon Cannon, Absolute Zero, Judgment)
- `js/state.js` 수정: souls/soulDrops/codex 필드 추가 (codex는 게임오버 시 유지)
- `js/enemy.js` 수정: 사망 시 tryDropSoul, DoT 처리 (독/화염), 기절(stun) 지원
- `js/tower.js` 수정: 주기적 광역 능력 (freeze_all 8초, judgment 10초), 합성 시 스탯 오버라이드
- `js/projectile.js` 수정: fusedSpec 복사, applyFusedHit, findNextPierceTarget (관통)
- `js/renderer.js` 수정: drawSoulDrops, 합성 타워 glow aura + 회전 링, 기절/DoT 오버레이, fontSize 지원
- `js/input.js` 수정: 소울 클릭 수집, 업그레이드 팝업에 합성 버튼, 도감 모달
- `index.html/style.css`: 소울 바, 합성 버튼, 도감 모달 추가

**배운 것:**
- 소울 orb 클릭 영역은 실제 반지름의 2.5배로 설정해야 터치 환경에서 쉽게 수집됨
- `tower.fusedSpec.baseType`으로 원본 타워 타입을 보존해야 재합성 가능
- `pierce`는 타겟 처치 여부와 무관하게 작동해야 함 (`target.alive === false` 조건 제거)
- `tower.js`에서 `hitEnemy` 호출 가능 — `enemy.js`가 먼저 로드되므로 OK
- `soul.js`와 `fusion.js`는 `particles.js` 이후, `path.js` 이전에 로드해야 함
- 합성 시 `fusedCooldown: 0` 초기화 → 첫 틱에 즉시 발동 (activation effect로 사용)
- `state.codex`는 `initState()`에서 리셋하지 않음 — 영구 수집 기록

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
