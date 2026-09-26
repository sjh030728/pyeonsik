// FE2(이나윤) 담당 — 장바구니 확인 화면 (/checkout)
// 담은 상품 확인·수량 조절 → 합계와 목표 비교 → 끼니/간식·시간대 선택
// → 기록 전 변화량 미리보기(POST /api/stats/preview) → 기록(POST /api/records) → 이번 주 탭으로 이동
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../store/useCart';
import { useGoal } from '../store/useGoal';

const CATEGORY_LABELS = {
  rice: '밥',
  noodle: '면',
  bread: '빵',
  side: '국·반찬',
  snack: '간식',
  drink: '음료',
};

// 기획 문서: 장바구니에 rice·noodle·bread가 하나라도 있으면 '끼니'가 기본
const MEAL_CATEGORIES = ['rice', 'noodle', 'bread'];

const TYPES = [
  { key: 'meal', label: '끼니' },
  { key: 'snack', label: '간식' },
];

// 기획 문서: 05~10시 아침, 10~15시 점심, 15~21시 저녁, 나머지 야식
const TIME_SLOTS = [
  { key: 'breakfast', label: '아침' },
  { key: 'lunch', label: '점심' },
  { key: 'dinner', label: '저녁' },
  { key: 'late', label: '야식' },
];

function currentTimeSlot() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return 'breakfast';
  if (hour >= 10 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 21) return 'dinner';
  return 'late';
}

const fmt = (n) => Math.round(n).toLocaleString();

async function postJson(url, body, signal) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || '요청에 실패했어요.');
  return data;
}

export default function CheckoutPage() {
  const { items, total, add, remove, clear } = useCart();
  const { goal } = useGoal();
  const navigate = useNavigate();

  // 끼니/간식: 사용자가 직접 고르기 전까지는 담은 상품에 따라 자동으로 정해요
  const autoType = items.some(({ product }) => MEAL_CATEGORIES.includes(product.category)) ? 'meal' : 'snack';
  const [pickedType, setPickedType] = useState(null);
  const type = pickedType ?? autoType;
  const [timeSlot, setTimeSlot] = useState(currentTimeSlot);
  const [preview, setPreview] = useState(null); // null: 불러오는 중 또는 불가, 객체: 응답
  const [previewFailed, setPreviewFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const isEmpty = items.length === 0;

  // 기록 전 변화량 미리보기 — 끼니/간식이나 합계가 바뀌면 다시 불러옵니다 (저장은 안 됨)
  useEffect(() => {
    if (isEmpty) return undefined;
    const controller = new AbortController();
    setPreview(null);
    setPreviewFailed(false);
    const timer = setTimeout(() => {
      postJson('/api/stats/preview', { type, total }, controller.signal)
        .then(setPreview)
        .catch((err) => {
          if (err.name !== 'AbortError') setPreviewFailed(true);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmpty, type, total.price, total.sodium, total.kcal]);

  const handleRecord = async () => {
    if (isEmpty || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      await postJson('/api/records', {
        type,
        timeSlot,
        items: items.map(({ product, qty }) => ({ productId: product.id, qty })),
      });
      clear();
      // 이번 주 화면에서 "○○로 기록했어요" 알림을 잠깐 보여줘요
      navigate('/week', { state: { recorded: `${slotLabel} ${type === 'meal' ? '끼니로' : '간식으로'} 기록했어요` } });
    } catch (err) {
      setSaveError(err.message === 'Failed to fetch' ? '서버에 연결할 수 없어요.' : err.message);
      setSaving(false);
    }
  };

  const slotLabel = TIME_SLOTS.find((s) => s.key === timeSlot).label;
  const recordLabel = saving
    ? '기록하는 중…'
    : saveError
      ? '다시 시도'
      : `${slotLabel} ${type === 'meal' ? '끼니로' : '간식으로'} 기록하기`;

  return (
    <>
      <div className="page-header">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          style={{ fontSize: 13, color: 'var(--text-soft)', padding: '2px 0', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <span style={{ fontSize: 17, lineHeight: 1 }}>‹</span> 더 담기
        </button>
        <h1>장바구니</h1>
      </div>

      <div
        className="page"
        style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8, scrollbarWidth: 'none' }}
      >
        {isEmpty ? (
          <div className="card" style={{ textAlign: 'center', padding: '28px 16px' }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>장바구니가 비어 있어요</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '6px 0 14px' }}>
              고르기 화면에서 먹을 음식을 담아 주세요.
            </div>
            <button type="button" className="btn-secondary" onClick={() => navigate('/')}>
              음식 고르러 가기
            </button>
          </div>
        ) : (
          <>
            {/* 담은 상품 목록 + 합계 */}
            <div className="card" style={{ padding: '4px 16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0 8px',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 12.5,
                }}
              >
                <span style={{ color: 'var(--text-soft)' }}>
                  담은 상품 {items.reduce((n, i) => n + i.qty, 0)}개
                </span>
                {confirmClear ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: 'var(--danger-text)', fontWeight: 600 }}>전부 비울까요?</span>
                    <button type="button" onClick={() => setConfirmClear(false)} style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        clear();
                        setConfirmClear(false);
                      }}
                      style={{ fontSize: 12.5, color: 'var(--danger-text)', fontWeight: 700 }}
                    >
                      비우기
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    style={{ fontSize: 12.5, color: 'var(--text-muted)', textDecoration: 'underline', padding: 0 }}
                  >
                    장바구니 비우기
                  </button>
                )}
              </div>
              {items.map(({ product, qty }, index) => (
                <div
                  key={product.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 0',
                    borderBottom: index < items.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {CATEGORY_LABELS[product.category] ?? product.category}
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 1 }}>{product.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                      {fmt(product.price * qty)}원 · 나트륨 {fmt(product.sodium * qty)}mg · {fmt(product.kcal * qty)}kcal
                    </div>
                  </div>
                  <QtyStepper
                    name={product.name}
                    qty={qty}
                    onMinus={() => remove(product.id)}
                    onPlus={() => add(product, 1)}
                  />
                </div>
              ))}
            </div>

            {/* 합계는 별도 카드 */}
            <div className="card">
              <TotalSummary total={total} goal={goal} isMeal={type === 'meal'} />
            </div>

            {/* 끼니/간식 + 시간대를 한 카드에 */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <SectionTitle>끼니로 먹나요, 간식으로 먹나요?</SectionTitle>
                <Segmented options={TYPES} value={type} onChange={setPickedType} />
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>
                  {type === 'meal'
                    ? '끼니는 이번 주 한 끼 평균에 들어가요.'
                    : '간식은 한 끼 평균에 넣지 않고 따로 모아서 보여줘요.'}
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <SectionTitle>언제 먹나요?</SectionTitle>
                <Segmented options={TIME_SLOTS} value={timeSlot} onChange={setTimeSlot} />
              </div>
            </div>

            {/* 기록 전 변화량 미리보기 */}
            <section>
              <SectionTitle>기록하면 이번 주가 이렇게 바뀌어요</SectionTitle>
              <PreviewBox type={type} preview={preview} failed={previewFailed} />
            </section>
          </>
        )}
      </div>

      {/* 하단 고정 기록 버튼 */}
      <div style={{ padding: '10px 20px 14px', borderTop: '1px solid var(--border)' }}>
        {saveError && (
          <div
            role="alert"
            style={{ fontSize: 12.5, color: 'var(--danger-text)', textAlign: 'center', marginBottom: 8 }}
          >
            기록하지 못했어요. {saveError}
          </div>
        )}
        <button type="button" className="btn-primary" disabled={isEmpty || saving} onClick={handleRecord}>
          {isEmpty ? '담은 상품이 없어요' : recordLabel}
        </button>
      </div>
    </>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8 }}>{children}</div>;
}

// 수량 조절: − 는 하나씩 빼고, 1개에서 − 를 누르면 목록에서 사라져요.
function QtyStepper({ name, qty, onMinus, onPlus }) {
  const btn = {
    width: 30,
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--green)',
    fontSize: 16,
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flex: 'none',
        border: '1px solid var(--green)',
        borderRadius: 10,
        background: 'var(--card)',
      }}
    >
      <button type="button" aria-label={`${name} 하나 빼기`} onClick={onMinus} style={btn}>
        −
      </button>
      <span style={{ minWidth: 20, textAlign: 'center', fontSize: 13.5, fontWeight: 700 }}>{qty}</span>
      <button type="button" aria-label={`${name} 하나 더 담기`} onClick={onPlus} style={btn}>
        +
      </button>
    </div>
  );
}

// 합계: 가격·나트륨·칼로리 숫자, 끼니일 때만 아래에 한 끼 목표 대비 남음/초과를 작게
function TotalSummary({ total, goal, isMeal }) {
  const cells = [
    { key: 'price', label: '가격', unit: '원' },
    { key: 'sodium', label: '나트륨', unit: 'mg' },
    { key: 'kcal', label: '칼로리', unit: 'kcal' },
  ];
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>합계</div>
      <div style={{ display: 'flex', textAlign: 'center' }}>
        {cells.map((c, i) => {
          const left = goal[c.key] - total[c.key];
          return (
            <div key={c.key} style={{ flex: 1, borderLeft: i > 0 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{c.label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>
                {fmt(total[c.key])}
                {c.unit}
              </div>
              {isMeal && (
                <div
                  style={{
                    fontSize: 11,
                    marginTop: 2,
                    fontWeight: 600,
                    color: left < 0 ? 'var(--danger-text)' : 'var(--green)',
                  }}
                >
                  {left < 0 ? `${fmt(-left)}${c.unit} 초과` : `${fmt(left)}${c.unit} 남음`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {options.map((o) => {
        const selected = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(o.key)}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: selected ? 700 : 400,
              background: selected ? 'var(--text)' : 'var(--card)',
              color: selected ? '#fff' : 'var(--text-soft)',
              border: selected ? '1px solid var(--text)' : '1px solid var(--border)',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// 미리보기 박스: 끼니면 끼니 수·한 끼 평균, 간식이면 간식 횟수·간식 합계의 before → after
// 이번 주 첫 끼니(첫 간식)면 "0 → 4,600원" 대신 첫 기록이라는 안내와 기록 후 값만 보여줘요.
function PreviewBox({ type, preview, failed }) {
  const boxStyle = {
    background: 'var(--green-bg)',
    borderRadius: 14,
    padding: '12px 14px',
    fontSize: 12.5,
  };

  if (failed) {
    return (
      <div style={{ ...boxStyle, background: 'var(--chip-bg)', color: 'var(--text-muted)' }}>
        서버에 연결되면 기록 후 달라지는 이번 주 통계를 미리 볼 수 있어요.
      </div>
    );
  }
  if (!preview) {
    return <div style={{ ...boxStyle, color: 'var(--text-muted)' }}>계산하는 중…</div>;
  }

  const { before, after } = preview;
  const rows =
    type === 'meal'
      ? [
          { label: '이번 주 끼니', from: before.mealCount, to: after.mealCount, unit: '회' },
          { label: '한 끼 평균 식비', from: before.mealAvg.price, to: after.mealAvg.price, unit: '원' },
          { label: '한 끼 평균 나트륨', from: before.mealAvg.sodium, to: after.mealAvg.sodium, unit: 'mg' },
          { label: '한 끼 평균 칼로리', from: before.mealAvg.kcal, to: after.mealAvg.kcal, unit: 'kcal' },
        ]
      : [
          { label: '이번 주 간식', from: before.snack.count, to: after.snack.count, unit: '회' },
          { label: '간식 식비 합계', from: before.snack.price, to: after.snack.price, unit: '원' },
          { label: '간식 나트륨 합계', from: before.snack.sodium, to: after.snack.sodium, unit: 'mg' },
          { label: '간식 칼로리 합계', from: before.snack.kcal, to: after.snack.kcal, unit: 'kcal' },
        ];

  const isFirst = rows[0].from === 0;
  const shownRows = isFirst ? rows.slice(1) : rows;

  return (
    <div style={{ ...boxStyle, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {isFirst && (
        <div style={{ fontWeight: 700, color: 'var(--green)' }}>
          이번 주 첫 {type === 'meal' ? '끼니' : '간식'} 기록이에요. 이 기록부터 이번 주 통계가 시작돼요.
        </div>
      )}
      {shownRows.map((r) => (
        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-soft)' }}>{r.label}</span>
          <span>
            {!isFirst && (
              <>
                <span style={{ color: 'var(--text-muted)' }}>{fmt(r.from)}</span>
                {' → '}
              </>
            )}
            <b style={{ color: 'var(--text)' }}>
              {fmt(r.to)}
              {r.unit}
            </b>
          </span>
        </div>
      ))}
    </div>
  );
}
