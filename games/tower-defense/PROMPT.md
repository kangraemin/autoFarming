# Tower Defense Ralph Loop Prompt

## 목표
Kingdom Rush / Bloons TD6 수준 퀄리티의 타워 디펜스 게임을 만든다.

## 매 반복마다 수행할 것

1. `prd.json` 읽기 — `passes: false`인 항목 중 priority가 가장 높은(숫자 작은) 것부터 처리
2. `AGENTS.md` 읽기 — 이전 반복의 학습 내용 확인, 같은 실수 반복 금지
3. 현재 코드 상태 확인 — `index.html`, `css/`, `js/` 파일들 읽기
4. 해당 PRD 항목 구현/수정
5. 브라우저에서 실행 테스트 — gstack `/qa` 또는 직접 `open index.html`
6. 통과하면 `prd.json`에서 해당 항목 `passes: true`로 변경
7. `AGENTS.md`에 이번 반복에서 배운 것 기록
8. 다음 `passes: false` 항목으로 이동

## 기술 스택
- Vanilla HTML/CSS/JS (빌드 도구 없음)
- Canvas 2D 렌더링
- Web Audio API (사운드)
- localStorage (세이브)
- Capacitor (모바일 빌드)

## 디자인 원칙
- 이쁘게. 원과 사각형으로 대충 그리지 마라. 캔버스로 캐릭터를 그려라.
- 피드백. 모든 액션에 시각/청각 피드백.
- 의미 있는 선택. 타워 배치 위치가 중요해야 함. 조합이 있어야 함.
- 프로그레션. 플레이어가 성장하는 느낌.
- 차별화. 다른 디펜스 게임에 없는 우리만의 메카닉.

## 작업 디렉토리
/Users/ram/programming/vibecoding/autoFarming/games/tower-defense/

## 완료 조건
prd.json의 모든 항목이 passes: true
