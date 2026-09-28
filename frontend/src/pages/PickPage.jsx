// 고르기 화면 (/) — FE1(전민석) 담당. 아래 디자인 수정은 FE1 동의를 받아 FE2(이나윤)가 반영했어요.
// ① 목표 예산 ± 삭제(목표 탭에서 설정) ② 목표 대비 지금 담은 양 요약 ③ '다른 조합 추천'은 ↻ 아이콘으로
// ④ 장바구니 바는 담은 메뉴만 ⑤ 담기 버튼 대신 − 수량 +
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../store/useCart';
import { useGoal } from '../store/useGoal';
import { getProducts } from '../api/products';
import { recommendCombo } from '../api/combos';
import { checkHealth } from '../api/health';

const CATEGORIES = [
  { key: 'rice', label: '밥' },
  { key: 'noodle', label: '면' },
  { key: 'bread', label: '빵' },
  { key: 'side', label: '국·반찬' },
  { key: 'snack', label: '간식' },
  { key: 'drink', label: '음료' },
];

const METRICS = [
  { key: 'price', label: '식비', unit: '원' },
  { key: 'sodium', label: '나트륨', unit: 'mg' },
  { key: 'kcal', label: '칼로리', unit: 'kcal' },
];

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const fmt = (n) => Math.round(n).toLocaleString();

function todayLabel() {
  const d = new Date();
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
}

function OverLabel({ label, value, unit }) {
  if (value <= 0) return null;
  return (
    <span style={{ color: 'var(--danger-text)', fontWeight: 700 }}>
      {label} {fmt(value)}
      {unit} 초과
    </span>
  );
}

export default function PickPage() {
  const { items, add, remove, clear, total } = useCart();
  const { goal } = useGoal();
  const navigate = useNavigate();

  const [category, setCategory] = useState('rice');
  const [products, setProducts] = useState([]);
  const [combo, setCombo] = useState(null);
  const [comboFits, setComboFits] = useState(true);
  const [comboOver, setComboOver] = useState({ price: 0, sodium: 0, kcal: 0 });
  const [lastComboId, setLastComboId] = useState(null);
  const [pendingCombo, setPendingCombo] = useState(null); // 장바구니 충돌 시 확인 대기 중인 조합
  const [serverUp, setServerUp] = useState(null); // null: 확인중, true/false: 결과

  // 서버(BE1, /api/health) 연결 상태 확인. 서버가 나중에 켜질 수도 있어서 5초마다 재확인합니다.
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const ok = await checkHealth();
      if (!cancelled) setServerUp(ok);
    };
    check();
    const timer = setInterval(check, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    getProducts(category).then(setProducts);
  }, [category]);

  const loadCombo = async (excludeId) => {
    const data = await recommendCombo({
      price: goal.price,
      sodium: goal.sodium,
      kcal: goal.kcal,
      exclude: excludeId,
    });
    setCombo(data.combo);
    setComboFits(data.fits);
    setComboOver(data.over ?? { price: 0, sodium: 0, kcal: 0 });
    setLastComboId(data.combo?.id ?? null);
  };

  useEffect(() => {
    loadCombo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal.price, goal.sodium, goal.kcal]);

  const addComboToCart = (targetCombo) => {
    targetCombo.items.forEach(({ product, qty, alternative }) => {
      if (product.soldOut) {
        if (alternative) add(alternative, qty);
        // 대체 상품이 없으면 빼고 담기 → 아무것도 추가하지 않음
      } else {
        add(product, qty);
      }
    });
  };

  const handleAddCombo = (targetCombo) => {
    if (items.length > 0) {
      // 장바구니에 이미 상품이 있으면 "비우고 담기 / 추가로 담기" 확인
      setPendingCombo(targetCombo);
      return;
    }
    addComboToCart(targetCombo);
  };

  const qtyOf = (productId) => items.find((i) => i.product.id === productId)?.qty ?? 0;
  const cartTitle =
    items.length === 0
      ? ''
      : items.length === 1
        ? items[0].product.name
        : `${items[0].product.name} 외 ${items.length - 1}개`;

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{todayLabel()}</div>
          {/* 서버가 꺼졌을 때만 알려줘요 (연결되어 있으면 표시하지 않음) */}
          {serverUp === false && (
            <span className="tag" style={{ background: 'var(--chip-bg)', color: 'var(--text-muted)' }}>
              서버 연결 안 됨(임시 데이터 표시중)
            </span>
          )}
        </div>
        <h1>이번 끼니, 뭘 담을까요?</h1>
      </div>

      {/* 이 화면 전체는 스크롤하지 않고, 아래 "음식 리스트 박스"만 내부 스크롤됩니다 */}
      <div
        className="page"
        style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden', flex: 1, minHeight: 0 }}
      >
        {/* ② 목표 대비 지금 담은 양 (항상 보여요) */}
        <div className="card" style={{ display: 'flex', textAlign: 'center', padding: '12px 8px', flex: 'none' }}>
          {METRICS.map((m, i) => {
            const value = total[m.key];
            const target = goal[m.key];
            const left = target - value;
            const over = left < 0;
            return (
              <div key={m.key} style={{ flex: 1, borderLeft: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{m.label}</div>
                <div style={{ marginTop: 2 }}>
                  <b style={{ fontSize: 16, fontWeight: 800, color: over ? 'var(--danger-text)' : 'var(--text)' }}>
                    {fmt(value)}
                  </b>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {' '}
                    / {fmt(target)}
                    {m.unit}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    marginTop: 2,
                    color: over ? 'var(--danger-text)' : 'var(--green)',
                  }}
                >
                  {over ? `${fmt(-left)}${m.unit} 초과` : `${fmt(left)}${m.unit} 남음`}
                </div>
              </div>
            );
          })}
        </div>

        {/* 조합 추천 카드 — ③ '다른 조합 추천'은 오른쪽 위 ↻ 버튼으로 */}
        {combo && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{combo.name}</div>
              <button
                type="button"
                aria-label="다른 조합 추천"
                title="다른 조합 추천"
                onClick={() => loadCombo(lastComboId)}
                style={{
                  width: 30,
                  height: 30,
                  flex: 'none',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-soft)',
                  background: 'var(--chip-bg)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 11a8 8 0 1 0-2.3 5.7" />
                  <path d="M20 4v7h-7" />
                </svg>
              </button>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
              {combo.items
                .map(({ product, qty, alternative }) => {
                  const p = product.soldOut && alternative ? alternative : product;
                  return `${p.name}${qty > 1 ? ` x${qty}` : ''}`;
                })
                .join(' · ')}
            </div>
            {combo.items.some((i) => i.product.soldOut) && (
              <div className="tag" style={{ background: 'var(--warn-bg)', color: 'var(--warn-text)' }}>
                {combo.items
                  .filter((i) => i.product.soldOut)
                  .map((i) => `${i.product.name} 품절 → ${i.alternative ? i.alternative.name + '로 담아요' : '빼고 담아요'}`)
                  .join(', ')}
              </div>
            )}
            {/* 아래 상품 목록과 같은 형식: 가격 · 나트륨 · 칼로리 */}
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {fmt(combo.totalPrice)}원 · {fmt(combo.totalSodium)}mg · {fmt(combo.totalKcal)}kcal
              {!comboFits && (
                <span style={{ marginLeft: 6 }}>
                  <OverLabel label="식비" value={comboOver.price} unit="원" />{' '}
                  <OverLabel label="나트륨" value={comboOver.sodium} unit="mg" />{' '}
                  <OverLabel label="칼로리" value={comboOver.kcal} unit="kcal" />
                </span>
              )}
            </div>
            <button className="btn-primary" onClick={() => handleAddCombo(combo)}>
              이 조합 통째로 담기
            </button>
          </div>
        )}

        {/* ④ 장바구니 바 — 위치는 그대로, 담은 메뉴 + 장바구니 확인 버튼만 */}
        {items.length > 0 && (
          <div
            style={{
              flex: 'none',
              padding: '12px 14px 12px 18px',
              background: 'var(--text)',
              borderRadius: 14,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {cartTitle}
            </div>
            <button
              className="btn-primary"
              style={{ width: 'auto', padding: '10px 14px', flex: 'none' }}
              onClick={() => navigate('/checkout')}
            >
              장바구니 확인
            </button>
          </div>
        )}

        {/* 장바구니 충돌 확인 */}
        {pendingCombo && (
          <div className="card" style={{ background: 'var(--warn-bg)', border: 'none', flex: 'none' }}>
            <div style={{ fontSize: 13, marginBottom: 10 }}>
              장바구니에 이미 담긴 상품이 있어요. 어떻게 할까요?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  addComboToCart(pendingCombo);
                  setPendingCombo(null);
                }}
              >
                추가로 담기
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  clear();
                  addComboToCart(pendingCombo);
                  setPendingCombo(null);
                }}
              >
                비우고 담기
              </button>
            </div>
          </div>
        )}

        {/* 음식 리스트 박스 — 카테고리 탭 + 상품 목록. 이 박스 안에서만 스크롤됩니다 */}
        <div
          className="card"
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
          }}
        >
          {/* 카테고리 탭 (박스 안에서 스크롤해도 상단에 붙어있음) */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              padding: '14px 14px 10px',
              position: 'sticky',
              top: 0,
              background: 'var(--card)',
              zIndex: 1,
              borderBottom: '1px solid var(--border)',
            }}
          >
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                style={{
                  flex: 'none',
                  padding: '8px 14px',
                  borderRadius: 20,
                  background: category === c.key ? 'var(--text)' : 'var(--bg)',
                  color: category === c.key ? '#fff' : 'var(--text-soft)',
                  border: category === c.key ? 'none' : '1px solid var(--border)',
                  fontSize: 13,
                  fontWeight: category === c.key ? 600 : 400,
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* 상품 목록 — 이 부분만 스크롤 */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {products.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 4px',
                  borderBottom: '1px solid var(--border)',
                  opacity: p.soldOut ? 0.5 : 1,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                    {fmt(p.price)}원 · {fmt(p.sodium)}mg · {fmt(p.kcal)}kcal
                  </div>
                </div>
                {p.soldOut ? (
                  <span className="btn-secondary" style={{ flex: 'none', opacity: 0.6 }}>
                    품절
                  </span>
                ) : (
                  <QtyStepper
                    name={p.name}
                    qty={qtyOf(p.id)}
                    onMinus={() => remove(p.id)}
                    onPlus={() => add(p)}
                  />
                )}
              </div>
            ))}
            {products.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                이 카테고리에는 상품이 없어요.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ⑤ 담기 버튼 대신 − 수량 +. 0개면 − 와 테두리를 흐리게 해서 '아직 안 담음'이 구분돼요.
function QtyStepper({ name, qty, onMinus, onPlus }) {
  const active = qty > 0;
  const btn = {
    width: 30,
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
  };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flex: 'none',
        border: `1px solid ${active ? 'var(--green)' : 'var(--border)'}`,
        borderRadius: 10,
        background: 'var(--card)',
      }}
    >
      <button
        type="button"
        aria-label={`${name} 하나 빼기`}
        disabled={!active}
        onClick={onMinus}
        style={{ ...btn, color: active ? 'var(--green)' : 'var(--border)', cursor: active ? 'pointer' : 'default' }}
      >
        −
      </button>
      <span
        style={{
          minWidth: 18,
          textAlign: 'center',
          fontSize: 13.5,
          fontWeight: 700,
          color: active ? 'var(--text)' : 'var(--text-muted)',
        }}
      >
        {qty}
      </span>
      <button type="button" aria-label={`${name} 하나 더 담기`} onClick={onPlus} style={{ ...btn, color: 'var(--green)' }}>
        +
      </button>
    </div>
  );
}
