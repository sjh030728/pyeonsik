import { useEffect, useState } from 'react';

// 앱 시작 화면 — 실제 앱처럼 잠깐 브랜드 화면을 보여준 뒤 사라집니다.
export default function SplashScreen({ onDone, minDuration = 900 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      // 페이드아웃 트랜지션 시간(200ms)만큼 기다렸다가 완전히 제거
      setTimeout(onDone, 200);
    }, minDuration);
    return () => clearTimeout(timer);
  }, [minDuration, onDone]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        background: 'var(--green)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 200ms ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div style={{ fontSize: 52 }}>🍙</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: 1 }}>편식</div>
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)' }}>편의점 맞춤 식비관리</div>
    </div>
  );
}