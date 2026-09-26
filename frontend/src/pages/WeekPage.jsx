// FE2(이나윤) 담당 — 이번 주 현황 화면 (/week)
// TODO: GET /api/stats/week를 불러와서 끼니 수, 한 끼 평균, 간식 별도, 최근 기록을 구현
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function WeekPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(location.state?.recorded ?? '');

  // 장바구니에서 기록하고 넘어왔을 때 알림을 잠깐 보여주고 사라지게 해요.
  // 주소의 state도 비워서 새로고침하면 다시 뜨지 않게 합니다.
  useEffect(() => {
    if (!notice) return undefined;
    navigate(location.pathname, { replace: true, state: null });
    const timer = setTimeout(() => setNotice(''), 2500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="page-header">
        <h1>이번 주 현황</h1>
      </div>
      <div className="page">
        <div className="card" style={{ color: 'var(--text-muted)' }}>
          FE2 담당 화면입니다. GET /api/stats/week 연결해서 채워주세요.
        </div>
      </div>

      {notice && (
        <div
          role="status"
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 84,
            transform: 'translateX(-50%)',
            background: 'var(--text)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            padding: '10px 16px',
            borderRadius: 12,
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          {notice} ✓
        </div>
      )}
    </>
  );
}
