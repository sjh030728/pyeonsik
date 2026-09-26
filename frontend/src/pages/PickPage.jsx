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

const PRICE_STEP = 500;

function OverLabel({ label, value }) {
  if (value <= 0) return null;
  return (
    <span style={{ color: 'var(--danger-text)', fontWeight: 700 }}>
      {label} +{value.toLocaleString()}
    </span>
  );
}

export default function PickPage() {
  const { items, add, clear, total } = useCart();
  const { goal, setGoal } = useGoal();
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

  const changePrice = (delta) => {
    setGoal({ ...goal, price: Math.max(0, goal.price + delta) });
  };

  const overBudget = total.price > goal.price;
  const overSodium = total.sodium > goal.sodium;
  const overKcal = total.kcal > goal.kcal;

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>오늘 뭐 먹지?</div>
          <span
            className="tag"
            style={
              serverUp
                ? { background: 'var(--green-bg)', color: 'var(--green)' }
                : { background: 'var(--chip-bg)', color: 'var(--text-muted)' }
            }
          >
            {serverUp === null ? '서버 확인중…' : serverUp ? '서버 연결됨' : '서버 연결 안 됨(임시 데이터 표시중)'}
          </span>
        </div>
        <h1>{goal.price.toLocaleString()}원으로 뭘 먹을까요?</h1>
      </div>

      {/* 이 화면 전체는 스크롤하지 않고, 아래 "음식 리스트 박스"만 내부 스크롤됩니다 */}
      <div
        className="page"
        style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden', flex: 1, minHeight: 0 }}
      >
        {/* 가격 설정 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>목표 예산</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => changePrice(-PRICE_STEP)}
              style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--chip-bg)', fontSize: 15 }}
            >
              −
            </button>
            <div style={{ fontSize: 16, fontWeight: 800, minWidth: 74, textAlign: 'center' }}>
              {goal.price.toLocaleString()}원
            </div>
            <button
              onClick={() => changePrice(PRICE_STEP)}
              style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--chip-bg)', fontSize: 15 }}
            >
              +
            </button>
          </div>
        </div>

        {/* 조합 추천 카드 */}
        {combo && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{combo.name}</div>
              <div style={{ fontWeight: 800 }}>{combo.totalPrice.toLocaleString()}원</div>
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
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              나트륨 {combo.totalSodium}mg · 칼로리 {combo.totalKcal}kcal
              {!comboFits && (
                <span style={{ marginLeft: 6 }}>
                  <OverLabel label="식비" value={comboOver.price} />{' '}
                  <OverLabel label="나트륨" value={comboOver.sodium} />{' '}
                  <OverLabel label="칼로리" value={comboOver.kcal} />
                </span>
              )}
            </div>
            <button className="btn-primary" onClick={() => handleAddCombo(combo)}>
              이 조합 통째로 담기
            </button>
            <button className="btn-secondary" style={{ width: '100%' }} onClick={() => loadCombo(lastComboId)}>
              다른 조합 추천
            </button>
          </div>
        )}

        {/* 장바구니 요약 박스 — "다른 조합 추천" 바로 아래에 인라인으로 표시 */}
        {items.length > 0 && (
          <div
            style={{
              flex: 'none',
              padding: '12px 18px 16px',
              background: 'var(--text)',
              borderRadius: 14,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ color: '#fff', fontSize: 13.5, fontWeight: 700 }}>
                {total.price.toLocaleString()}원 / 목표 {goal.price.toLocaleString()}원
                {overBudget && <span style={{ color: '#ff9d8a' }}> (+{(total.price - goal.price).toLocaleString()})</span>}
              </div>
              <div style={{ color: '#c9c5ba', fontSize: 11, marginTop: 2 }}>
                나트륨 {total.sodium}mg{overSodium && <span style={{ color: '#ff9d8a' }}> (+{total.sodium - goal.sodium})</span>}
                {' · '}
                칼로리 {total.kcal}kcal{overKcal && <span style={{ color: '#ff9d8a' }}> (+{total.kcal - goal.kcal})</span>}
              </div>
            </div>
            <button className="btn-primary" style={{ width: 'auto', padding: '10px 16px' }} onClick={() => navigate('/checkout')}>
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
                  padding: '12px 4px',
                  borderBottom: '1px solid var(--border)',
                  opacity: p.soldOut ? 0.5 : 1,
                }}
              >
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                    {p.price.toLocaleString()}원 · 나트륨 {p.sodium}mg · {p.kcal}kcal
                  </div>
                </div>
                <button
                  className="btn-secondary"
                  disabled={p.soldOut}
                  style={p.soldOut ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                  onClick={() => !p.soldOut && add(p)}
                >
                  {p.soldOut ? '품절' : '담기'}
                </button>
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