// FE2(이나윤) 담당 — 이번 주 현황 화면 (/week)
// GET /api/stats/week를 화면에 들어올 때마다 새로 불러와서
// 기록 횟수·지출, 한 끼 평균(식비·나트륨·칼로리)과 목표 비교, 간식 합계, 최근 기록을 보여줍니다.
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGoal } from '../store/useGoal';

const METRICS = [
  { key: 'price', label: '식비', unit: '원' },
  { key: 'sodium', label: '나트륨', unit: 'mg' },
  { key: 'kcal', label: '칼로리', unit: 'kcal' },
];

const TYPE_LABELS = { meal: '끼니', snack: '간식' };
const SLOT_LABELS = { breakfast: '아침', lunch: '점심', dinner: '저녁', late: '야식' };
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const fmt = (n) => Math.round(n).toLocaleString();

// 'YYYY-MM-DD' → { m, d, w } (날짜만 다루므로 UTC 기준으로 계산)
function parseDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return { m: d.getUTCMonth() + 1, d: d.getUTCDate(), w: WEEKDAYS[d.getUTCDay()] };
}

function weekRangeLabel(weekStart) {
  const start = parseDate(weekStart);
  const endDate = new Date(`${weekStart}T00:00:00Z`);
  endDate.setUTCDate(endDate.getUTCDate() + 6);
  const end = { m: endDate.getUTCMonth() + 1, d: endDate.getUTCDate() };
  return start.m === end.m
    ? `${start.m}월 ${start.d}일 ~ ${end.d}일`
    : `${start.m}월 ${start.d}일 ~ ${end.m}월 ${end.d}일`;
}

export default function WeekPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { goal } = useGoal();
  const [notice, setNotice] = useState(location.state?.recorded ?? '');
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | done | error

  const load = useCallback(() => {
    setStatus('loading');
    fetch('/api/stats/week')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setStatus('done');
      })
      .catch(() => setStatus('error'));
  }, []);

  // 화면에 들어올 때마다 새로 불러와요 (탭으로 오갈 때마다 다시 그려지므로)
  useEffect(load, [load]);

  // 장바구니에서 기록하고 넘어왔을 때 알림을 잠깐 보여주고 사라지게 해요.
  // 주소의 state도 비워서 새로고침하면 다시 뜨지 않게 합니다.
  useEffect(() => {
    if (!notice) return undefined;
    navigate(location.pathname, { replace: true, state: null });
    const timer = setTimeout(() => setNotice(''), 2500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isEmpty = stats && stats.mealCount === 0 && stats.snack.count === 0;

  return (
    <>
      <div className="page-header">
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
          {stats ? weekRangeLabel(stats.weekStart) : '이번 주'}
        </div>
        <h1>이번 주 현황</h1>
      </div>

      <div
        className="page"
        style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8, scrollbarWidth: 'none' }}
      >
        {status === 'loading' && !stats && (
          <div className="card" style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
            이번 주 기록을 불러오는 중…
          </div>
        )}

        {status === 'error' && (
          <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>이번 주 기록을 불러오지 못했어요</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '6px 0 14px' }}>
              서버가 켜져 있는지 확인해 주세요.
            </div>
            <button type="button" className="btn-secondary" onClick={load}>
              다시 시도
            </button>
          </div>
        )}

        {status !== 'error' && isEmpty && (
          <div className="card" style={{ textAlign: 'center', padding: '28px 16px' }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>아직 이번 주 기록이 없어요</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '6px 0 14px' }}>
              먹은 음식을 담고 기록하면 여기에 모여요.
            </div>
            <button type="button" className="btn-secondary" onClick={() => navigate('/')}>
              음식 고르러 가기
            </button>
          </div>
        )}

        {status !== 'error' && stats && !isEmpty && (
          <>
            <SummaryCard stats={stats} />

            <SectionTitle title="한 끼 평균" sub="간식 제외" />
            {stats.mealCount > 0 ? (
              <div className="card" style={{ padding: '4px 16px' }}>
                {METRICS.map((m, i) => (
                  <AverageRow
                    key={m.key}
                    metric={m}
                    value={stats.mealAvg[m.key]}
                    target={goal[m.key]}
                    last={i === METRICS.length - 1}
                  />
                ))}
              </div>
            ) : (
              <div className="card" style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                이번 주 끼니 기록이 아직 없어요.
              </div>
            )}

            <SectionTitle title="최근 기록" sub="최신순 5개" />
            <div className="card" style={{ padding: '4px 16px' }}>
              {stats.recent.map((r, i) => (
                <RecentRow key={r.id} record={r} last={i === stats.recent.length - 1} />
              ))}
            </div>
          </>
        )}
      </div>

      {notice && (
        <div
          role="status"
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 60,
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

function SectionTitle({ title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
      <span style={{ fontSize: 14, fontWeight: 700 }}>{title}</span>
      {sub && <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{sub}</span>}
    </div>
  );
}

// 이번 주 지출: 끼니·간식 지출을 각 칸에 크게, 아래에 총 지출
function SummaryCard({ stats }) {
  // API가 끼니 식비 합계를 따로 주지 않아서 '한 끼 평균 × 끼니 수'로 계산해요 (반올림 때문에 몇 원 차이가 날 수 있어요)
  const mealSpend = stats.mealAvg.price * stats.mealCount;
  const totalSpend = mealSpend + stats.snack.price;

  const tile = (label, count, spend) => (
    <div style={{ flex: 1, background: 'var(--chip-bg)', borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
        <span style={{ fontWeight: 700 }}>{label}</span>
        <span style={{ color: 'var(--text-muted)' }}>{count}회</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6 }}>
        {fmt(spend)}
        <span style={{ fontSize: 13, fontWeight: 700, marginLeft: 1 }}>원</span>
      </div>
    </div>
  );

  return (
    <div className="card">
      <div style={{ display: 'flex', gap: 8 }}>
        {tile('끼니', stats.mealCount, mealSpend)}
        {tile('간식', stats.snack.count, stats.snack.price)}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginTop: 12,
          padding: '0 2px',
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--text-soft)', fontWeight: 600 }}>이번 주 총 지출</span>
        <span style={{ fontSize: 22, fontWeight: 800 }}>{fmt(totalSpend)}원</span>
      </div>
    </div>
  );
}

// 한 끼 평균 카드의 한 줄: 항목·평균값, 막대(평균) + 점선(목표) 위에 숫자, 남아요/초과해요
function AverageRow({ metric, value, target, last }) {
  const over = value > target;
  const scale = Math.max(value, target) * 1.15 || 1;
  const valuePct = (value / scale) * 100;
  const goalPct = (target / scale) * 100;
  const diff = Math.abs(value - target);

  return (
    <div style={{ padding: '14px 0', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{metric.label}</span>
        <span style={{ fontSize: 20, fontWeight: 800, color: over ? 'var(--danger-text)' : 'var(--text)' }}>
          {fmt(value)}
          <span style={{ fontSize: 13, fontWeight: 700, marginLeft: 1 }}>{metric.unit}</span>
        </span>
      </div>

      {/* 막대 + 목표 점선: 목표까지는 초록, 목표를 넘친 부분만 빨강. 목표 숫자는 점선 아래에 */}
      <div style={{ position: 'relative', height: 34, marginTop: 8 }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 5,
            height: 10,
            borderRadius: 5,
            background: 'var(--chip-bg)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 5,
            height: 10,
            width: `${Math.min(valuePct, goalPct)}%`,
            borderRadius: over ? '5px 0 0 5px' : 5,
            background: 'var(--green)',
          }}
        />
        {over && (
          <div
            style={{
              position: 'absolute',
              left: `${goalPct}%`,
              top: 5,
              height: 10,
              width: `${valuePct - goalPct}%`,
              borderRadius: '0 5px 5px 0',
              background: 'var(--danger-text)',
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            left: `${goalPct}%`,
            top: 0,
            height: 20,
            borderLeft: '2px dashed var(--text-soft)',
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: `${goalPct}%`,
            top: 21,
            transform: 'translateX(-50%)',
            fontSize: 10.5,
            color: 'var(--text-soft)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          목표 {fmt(target)}
        </span>
      </div>

      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          marginTop: 6,
          color: over ? 'var(--danger-text)' : 'var(--green)',
        }}
      >
        {diff === 0
          ? '목표와 딱 맞아요.'
          : over
            ? `목표를 한 끼에 ${fmt(diff)}${metric.unit} 초과해요.`
            : `목표까지 한 끼에 ${fmt(diff)}${metric.unit} 남아요.`}
      </div>
    </div>
  );
}

function RecentRow({ record, last }) {
  const date = parseDate(record.date);
  const names = record.items.map((i) => (i.qty > 1 ? `${i.name} x${i.qty}` : i.name));
  const title = names.length > 2 ? `${names[0]} 외 ${names.length - 1}개` : names.join(' · ');

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 10,
        padding: '12px 0',
        borderBottom: last ? 'none' : '1px solid var(--border)',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span
            className="tag"
            style={
              record.type === 'meal'
                ? { background: 'var(--green-bg)', color: 'var(--green)' }
                : { background: 'var(--warn-bg)', color: 'var(--warn-text)' }
            }
          >
            {TYPE_LABELS[record.type] ?? record.type} · {SLOT_LABELS[record.timeSlot] ?? record.timeSlot}
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
            {date.m}/{date.d} ({date.w})
          </span>
        </div>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            marginTop: 5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ textAlign: 'right', flex: 'none' }}>
        <div style={{ fontSize: 13.5, fontWeight: 800 }}>{fmt(record.total.price)}원</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>
          {fmt(record.total.sodium)}mg · {fmt(record.total.kcal)}kcal
        </div>
      </div>
    </div>
  );
}
