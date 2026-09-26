import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import PickPage from './pages/PickPage';
import GoalPage from './pages/GoalPage';
import CheckoutPage from './pages/CheckoutPage';
import WeekPage from './pages/WeekPage';
import TabBar from './components/TabBar';
import SplashScreen from './components/SplashScreen';

// 기획 문서 기준 주소: / 고르기 · /checkout 장바구니 확인 · /week 이번 주 · /goal 목표
// 장바구니 확인 화면은 하단 탭에 없는 화면이라 TabBar를 숨겼습니다. FE2가 원하는 대로 조정해주세요.
export default function App() {
  const { pathname } = useLocation();
  const showTabBar = pathname !== '/checkout';
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />;
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<PickPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/week" element={<WeekPage />} />
        <Route path="/goal" element={<GoalPage />} />
      </Routes>
      {showTabBar && <TabBar />}
    </div>
  );
}