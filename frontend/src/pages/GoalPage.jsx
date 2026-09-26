// FE2(이나윤) 담당 — 목표 설정 화면 (/goal)
// 한 끼 기준 식비·나트륨·칼로리 목표를 ± 버튼이나 직접 입력으로 바꿉니다.
// 저장은 useGoal()이 localStorage(키 goal)에 알아서 해줍니다.
import { useEffect, useRef, useState } from 'react';
import { useGoal } from '../store/useGoal';

// 한 끼 권장량 = 하루 권장량 ÷ 3
// 기획 문서: 기본값 5,000원 · 670mg · 700kcal, ± 한 번에 500원 · 50mg · 50kcal
const FIELDS = [
  {
    key: 'price',
    label: '한 끼 식비 목표',
    unit: '원',
    step: 500,
    min: 500,
    max: 50000,
    defaultValue: 5000,
  },
  {
    key: 'sodium',
    label: '한 끼 나트륨 목표',
    unit: 'mg',
    step: 50,
    min: 50,
    max: 5000,
    defaultValue: 670,
    // WHO 권고·식약처 1일 영양성분 기준치 2,000mg/일 ÷ 3 ≈ 667mg → 약 670mg
    limit: 670,
    info: {
      title: '성인 나트륨 권장량',
      rows: [['남녀 공통', '하루 2,000mg', '한 끼 약 670mg']],
      source: '출처: WHO 나트륨 섭취 권고, 식약처 1일 영양성분 기준치',
    },
  },
  {
    key: 'kcal',
    label: '한 끼 칼로리 목표',
    unit: 'kcal',
    step: 50,
    min: 50,
    max: 5000,
    defaultValue: 700,
    // 경고는 남성 에너지필요추정량 2,600kcal/일 ÷ 3 ≈ 870kcal 기준
    limit: 870,
    info: {
      title: '19~29세 하루 필요 칼로리',
      rows: [
        ['남성', '하루 2,600kcal', '한 끼 약 870kcal'],
        ['여성', '하루 2,000kcal', '한 끼 약 670kcal'],
      ],
      // 2025 한국인 영양소 섭취기준(보건복지부, 2025.12.) 요약표, 19~29세 에너지필요추정량
      source: '출처: 2025 한국인 영양소 섭취기준 (보건복지부)',
    },
  },
];

const HOLD_DELAY = 400; // 이 시간(ms) 넘게 누르고 있으면 연속 변경 시작
const HOLD_INTERVAL = 80; // 연속 변경 간격(ms)

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function GoalPage() {
  const { goal, setGoal, resetGoal } = useGoal();

  // 꾹 누르는 동안 타이머 안에서도 최신 목표값을 읽을 수 있게 ref에 담아둡니다.
  const goalRef = useRef(goal);
  goalRef.current = goal;

  const isAllDefault = FIELDS.every((f) => goal[f.key] === f.defaultValue);

  const changeBy = (field, delta) => {
    const current = goalRef.current;
    const next = clamp(current[field.key] + delta, field.min, field.max);
    if (next === current[field.key]) return false;
    const nextGoal = { ...current, [field.key]: next };
    goalRef.current = nextGoal;
    setGoal(nextGoal);
    return true;
  };

  const setValue = (field, value) => {
    setGoal({ ...goalRef.current, [field.key]: clamp(value, field.min, field.max) });
  };

  return (
    <>
      <div className="page-header">
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>목표 설정</div>
        <h1>
          한 끼 목표,
          <br />
          이렇게 잡아볼까요?
        </h1>
      </div>

      {/* 스크롤은 되지만 스크롤바는 숨깁니다 (ⓘ를 열고 닫을 때 스크롤바 때문에 화면 폭이 바뀌지 않게) */}
      <div
        className="page"
        style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8, scrollbarWidth: 'none' }}
      >
        {FIELDS.map((field) => (
          <GoalCard
            key={field.key}
            field={field}
            value={goal[field.key]}
            onStep={(delta) => changeBy(field, delta)}
            onInput={(value) => setValue(field, value)}
          />
        ))}

        <button
          type="button"
          className="btn-secondary"
          onClick={resetGoal}
          disabled={isAllDefault}
          style={{ alignSelf: 'center', opacity: isAllDefault ? 0.45 : 1 }}
        >
          {isAllDefault ? '기본값으로 설정되어 있어요' : '기본값으로 되돌리기'}
        </button>
      </div>
    </>
  );
}

function GoalCard({ field, value, onStep, onInput }) {
  const diff = value - field.defaultValue;

  const [showInfo, setShowInfo] = useState(false);
  const isOver = field.limit !== undefined && value > field.limit;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{field.label}</span>
          {field.info && (
            <button
              type="button"
              aria-label={`${field.info.title} 보기`}
              aria-expanded={showInfo}
              onClick={() => setShowInfo((v) => !v)}
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: `1px solid ${showInfo ? 'var(--green)' : 'var(--text-muted)'}`,
                background: showInfo ? 'var(--green)' : 'transparent',
                color: showInfo ? '#fff' : 'var(--text-muted)',
                fontSize: 11,
                fontWeight: 700,
                lineHeight: '16px',
                padding: 0,
              }}
            >
              i
            </button>
          )}
        </span>
        {diff === 0 ? (
          <span className="tag tag-neutral">기본값</span>
        ) : (
          <span
            className="tag"
            style={{
              background: diff > 0 ? 'var(--warn-bg)' : 'var(--green-bg)',
              color: diff > 0 ? 'var(--warn-text)' : 'var(--green)',
            }}
          >
            기본보다 {diff > 0 ? '+' : '−'}
            {Math.abs(diff).toLocaleString()}
            {field.unit}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <StepButton label="−" disabled={value <= field.min} onStep={() => onStep(-field.step)} />
        <EditableNumber value={value} unit={field.unit} label={field.label} onCommit={onInput} />
        <StepButton label="+" disabled={value >= field.max} onStep={() => onStep(field.step)} />
      </div>

      {isOver && (
        <div
          role="status"
          style={{
            marginTop: 10,
            padding: '8px 10px',
            borderRadius: 10,
            background: 'var(--danger-bg)',
            color: 'var(--danger-text)',
            fontSize: 12.5,
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          너무 많아요! 한 끼 권장량은 약 {field.limit.toLocaleString()}
          {field.unit}이에요.
        </div>
      )}

      {showInfo && <InfoPanel info={field.info} />}
    </div>
  );
}

// ⓘ 버튼을 누르면 카드 안에 펼쳐지는 19~29세 권장량 안내
function InfoPanel({ info }) {
  return (
    <div
      style={{
        marginTop: 10,
        padding: '10px 12px',
        borderRadius: 10,
        background: 'var(--chip-bg)',
        fontSize: 12,
        lineHeight: 1.6,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{info.title}</div>
      {info.rows.map(([who, perDay, perMeal]) => (
        <div key={who} style={{ display: 'flex', gap: 8 }}>
          <span style={{ width: 56, color: 'var(--text-soft)' }}>{who}</span>
          <span style={{ flex: 1 }}>{perDay}</span>
          <span style={{ fontWeight: 700 }}>{perMeal}</span>
        </div>
      ))}
      <div style={{ marginTop: 4, fontSize: 10, color: 'var(--text-muted)' }}>{info.source}</div>
    </div>
  );
}

// ± 버튼: 한 번 누르면 한 칸, 꾹 누르고 있으면 계속 바뀝니다.
// onStep()이 false를 돌려주면(최소·최대에 닿으면) 연속 변경을 멈춥니다.
function StepButton({ label, disabled, onStep }) {
  const timers = useRef({ delay: null, repeat: null });

  const stop = () => {
    clearTimeout(timers.current.delay);
    clearInterval(timers.current.repeat);
  };

  useEffect(() => stop, []);

  const start = (e) => {
    if (disabled || e.button > 0) return;
    stop();
    onStep();
    timers.current.delay = setTimeout(() => {
      timers.current.repeat = setInterval(() => {
        if (!onStep()) stop();
      }, HOLD_INTERVAL);
    }, HOLD_DELAY);
  };

  return (
    <button
      type="button"
      aria-label={label === '+' ? '올리기' : '내리기'}
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      // 키보드(Enter·Space)로 누른 경우에만 처리 — 마우스·터치는 onPointerDown에서 이미 처리됨
      onClick={(e) => e.detail === 0 && onStep()}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: 'var(--card)',
        fontSize: 20,
        color: disabled ? 'var(--border)' : 'var(--text)',
        cursor: disabled ? 'default' : 'pointer',
        touchAction: 'manipulation',
        userSelect: 'none',
      }}
    >
      {label}
    </button>
  );
}

// 숫자를 누르면 입력칸으로 바뀝니다. Enter나 바깥 클릭이면 저장, Esc면 취소.
// 숫자가 아닌 값(빈칸 등)은 저장하지 않고 원래 값으로 돌아갑니다.
function EditableNumber({ value, unit, label, onCommit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const cancelled = useRef(false); // Esc로 닫을 때 뒤따르는 blur에서 저장되지 않게

  const startEdit = () => {
    cancelled.current = false;
    setDraft(String(value));
    setEditing(true);
  };

  const commit = () => {
    if (cancelled.current) return;
    const number = Number(draft.replace(/[^0-9]/g, ''));
    if (draft.trim() !== '' && Number.isFinite(number) && number > 0) onCommit(Math.round(number));
    setEditing(false);
  };

  const numberStyle = { fontSize: 26, fontWeight: 800, textAlign: 'center' };

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, flex: 1 }}>
        <input
          autoFocus
          inputMode="numeric"
          aria-label={`${label} 직접 입력`}
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
          onFocus={(e) => e.target.select()}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') {
              cancelled.current = true;
              setEditing(false);
            }
          }}
          style={{
            ...numberStyle,
            width: 120,
            padding: '2px 6px',
            border: '2px solid var(--green)',
            borderRadius: 10,
            outline: 'none',
            fontFamily: 'inherit',
            color: 'var(--text)',
            background: 'var(--card)',
          }}
        />
        <span style={{ fontSize: 16, fontWeight: 700 }}>{unit}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      aria-label={`${label} ${value.toLocaleString()}${unit}, 눌러서 직접 입력`}
      style={{ ...numberStyle, flex: 1, color: 'var(--text)', padding: '4px 0' }}
    >
      {value.toLocaleString()}
      <span style={{ fontSize: 16, fontWeight: 700, marginLeft: 2 }}>{unit}</span>
    </button>
  );
}
