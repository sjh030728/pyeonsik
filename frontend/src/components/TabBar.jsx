import { NavLink } from 'react-router-dom';

// ⚠️ 이 파일은 FE2(이나윤) 담당입니다.
// FE1이 라우팅이 동작하는지 확인하려고 최소한의 버전만 만들어뒀어요.
// 실제 탭 디자인/스타일은 FE2가 이어서 작업해주세요.

const tabs = [
  { to: '/', label: '고르기' },
  { to: '/week', label: '이번 주' },
  { to: '/goal', label: '목표' },
];

export default function TabBar() {
  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-around',
        padding: '12px 0 20px',
        borderTop: '1px solid var(--border)',
      }}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          style={({ isActive }) => ({
            fontSize: 12,
            color: isActive ? 'var(--text)' : 'var(--text-muted)',
            fontWeight: isActive ? 700 : 400,
            textDecoration: 'none',
          })}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
