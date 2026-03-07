# Hamsurang Marathon

Colyseus 기반 멀티플레이 마라톤 게임 MVP 골격이다. 현재 포함 범위는 아래와 같다.

- 모바일 퍼스트 로비/레이스 클라이언트
- Colyseus room 상태 머신
- 방 생성/입장/퇴장
- 닉네임 입력 및 12자 제한
- 캐릭터 선택
- 방장 게임 모드 선택
- 전원 준비 완료 시 카운트다운 후 경기 시작
- 좌우 번갈아 탭 입력 기반 진행도 계산

## Workspace

- `apps/server`: Colyseus 서버
- `apps/web`: React + Vite 클라이언트
- `docs/game-plan.md`: 제품 기획 문서

## Start

```bash
pnpm install
pnpm dev:server
pnpm dev:web
```

기본 주소:

- 웹: `http://localhost:5173`
- 서버: `ws://localhost:2567`

## 핵심 서버 흐름

- 최초 입장자는 자동으로 방장
- 방장은 게임 모드를 선택 가능
- 모든 참가자가 준비 완료면 3초 카운트다운 시작
- 카운트다운 도중 준비 취소/이탈이 발생하면 시작 취소
- 레이스 중 입력은 서버에서만 유효성 검사 및 진행도 계산

## 다음 작업

- 실제 캐릭터 아트/애니메이션 연결
- 결과 보상 지급과 인벤토리 저장
- 재접속 처리와 관전자 모드
- 운영용 관리자 대시보드 분리
