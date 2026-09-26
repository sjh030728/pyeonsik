# 편식 — 프론트엔드 (FE1 담당분)

기획 문서(「편식 개발 시작 가이드」)의 FE1 역할 그대로 만들었습니다.

## 실행 방법

```bash
cd frontend
npm install
npm run dev
```

`http://localhost:5173` 자동으로 열립니다. 아직 백엔드(BE1)가 없어도 화면은 뜹니다 —
`src/api/products.js`, `src/api/combos.js`가 API 실패 시 문서에 적힌 응답 예시를 그대로
fallback으로 보여주도록 만들어뒀어요. 백엔드가 뜨면 자동으로 진짜 데이터로 바뀝니다
(포트 4000, vite.config.js에 proxy 설정 이미 돼 있음).

## FE1이 만든 것 (완료)

- 프로젝트 세팅 (Vite + React, JavaScript, react-router)
- `src/store/useCart.js` — 장바구니 상태 (add/remove/clear/total)
- `src/store/useGoal.js` — 목표 상태 (localStorage 키 `goal`)
- `src/api/products.js`, `src/api/combos.js` — API 호출 함수
- `src/pages/PickPage.jsx` — 고르기 화면
  - 카테고리 탭 6개 (rice/noodle/bread/side/snack/drink)
  - 상품 목록 (가격·나트륨·칼로리, 품절 회색 처리)
  - 조합 추천 카드 (통째로 담기, 다른 조합 추천, 품절 대체 안내, 목표 초과 빨간 표시)
  - 장바구니에 이미 상품 있을 때 "비우고 담기 / 추가로 담기" 선택
  - 하단 장바구니 바 (합계, 목표 대비 초과량, 장바구니 확인 버튼)
- `src/App.jsx`, `src/main.jsx` — 라우팅 뼈대, Provider 연결
- `src/components/TabBar.jsx`, `src/pages/GoalPage.jsx`, `src/pages/CheckoutPage.jsx`,
  `src/pages/WeekPage.jsx` — **FE2가 채울 자리로 최소 동작 버전만 만들어둠** (파일 상단에 안내 주석 있음)

## FE2에게

- `useCart()` → `{ items, add, remove, clear, total }`
- `useGoal()` → `{ goal, setGoal, resetGoal }`
- 위 두 훅만 가져다 쓰시면 돼요. Provider는 이미 `main.jsx`에서 감싸뒀습니다.
- 담당 파일(`GoalPage.jsx`, `CheckoutPage.jsx`, `WeekPage.jsx`, `TabBar.jsx`)에 안내 주석 남겨뒀으니 그 파일만 고치시면 충돌 안 나요.

## 완료 기준 확인

조합이나 상품을 담고 "장바구니 확인" 버튼을 누르면 `/checkout`으로 잘 넘어가는지 확인 완료.
