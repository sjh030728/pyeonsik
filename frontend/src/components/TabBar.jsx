import { NavLink } from 'react-router-dom';

// FE2(이나윤) 담당 — 하단 탭 (고르기 · 이번 주 · 목표)
// 얇게: 아이콘과 글자를 한 줄로 나란히. 선택된 탭은 연두색 알약 배경 + 초록 굵은 글씨.

// 아이콘은 새 라이브러리 없이 SVG로 직접 그려요 (선 굵기·크기를 통일)
const ICONS = {
  pick: (
    <>
      <path d="M5 9h14l-1.4 9.1a2 2 0 0 1-2 1.9H8.4a2 2 0 0 1-2-1.9L5 9Z" />
      <path d="M9 9V7a3 3 0 0 1 6 0v2" />
    </>
  ),
  week: (
    <>
      <path d="M5 20V11" />
      <path d="M12 20V5" />
      <path d="M19 20v-6" />
    </>
  ),
  goal: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </>
  ),
};

const tabs = [
  { to: '/', label: '고르기', icon: 'pick' },
  { to: '/week', label: '이번 주', icon: 'week' },
  { to: '/goal', label: '목표', icon: 'goal' },
];

export default function TabBar() {
  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-around',
        padding: '9px 12px 11px',
        borderTop: '1px solid var(--border)',
        background: 'var(--card)',
      }}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '7px 14px',
            borderRadius: 999,
            fontSize: 13,
            color: isActive ? 'var(--green)' : 'var(--text-muted)',
            background: isActive ? 'var(--green-bg)' : 'transparent',
            fontWeight: isActive ? 700 : 500,
            textDecoration: 'none',
            transition: 'background 0.15s',
          })}
        >
          {({ isActive }) => (
            <>
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={isActive ? 2.4 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {ICONS[tab.icon]}
              </svg>
              {tab.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
