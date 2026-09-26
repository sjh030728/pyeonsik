// GET /api/combos/recommend?price=&sodium=&kcal=&exclude=
// 백엔드가 뜨기 전까지, BE2가 만든 꿀조합 목업(combos.json)을 그대로 fallback으로 씁니다.
// 품절 상품이 든 조합은 같은 카테고리의 품절 아닌 상품을 자동으로 대체 상품(alternative)으로 찾아줍니다.
import { FALLBACK_PRODUCTS } from './products';

const byId = Object.fromEntries(FALLBACK_PRODUCTS.map((p) => [p.id, p]));

function findAlternative(product) {
  if (!product.soldOut) return null;
  const alt = FALLBACK_PRODUCTS.find(
    (p) => p.category === product.category && p.id !== product.id && !p.soldOut
  );
  return alt ?? null;
}

// BE2가 만든 combos.json 원본 (productId만 있고 totalPrice 등은 이미 계산돼 있음)
const RAW_COMBOS = [
  { id: 'c001', name: '김치제육 삼각 + 반숙란', items: [{ productId: 'p004', qty: 1 }, { productId: 'p041', qty: 1 }], totalPrice: 4100, totalSodium: 625, totalKcal: 332 },
  { id: 'c002', name: '계란샌드 + 흰우유 브런치', items: [{ productId: 'p026', qty: 1 }, { productId: 'p057', qty: 1 }], totalPrice: 4000, totalSodium: 650, totalKcal: 475 },
  { id: 'c003', name: '단팥빵엔 역시 흰우유', items: [{ productId: 'p021', qty: 1 }, { productId: 'p057', qty: 1 }], totalPrice: 3200, totalSodium: 450, totalKcal: 508 },
  { id: 'c004', name: '햇반 닭가슴살 자취 덮밥', items: [{ productId: 'p010', qty: 1 }, { productId: 'p039', qty: 1 }], totalPrice: 4600, totalSodium: 530, totalKcal: 425 },
  { id: 'c005', name: '페스트리 + 카페라떼 디저트 타임', items: [{ productId: 'p022', qty: 1 }, { productId: 'p059', qty: 1 }], totalPrice: 5000, totalSodium: 330, totalKcal: 614 },
  { id: 'c006', name: '불닭 + 치즈 + 우유 매운맛 세트', items: [{ productId: 'p015', qty: 1 }, { productId: 'p040', qty: 1 }, { productId: 'p057', qty: 1 }], totalPrice: 4700, totalSodium: 1135, totalKcal: 620 },
  { id: 'c007', name: '새우볶음밥 + 미역국 한 상', items: [{ productId: 'p005', qty: 1 }, { productId: 'p031', qty: 1 }], totalPrice: 7000, totalSodium: 1590, totalKcal: 495 },
  { id: 'c008', name: '치즈불고기버거 + 콜라제로', items: [{ productId: 'p027', qty: 1 }, { productId: 'p049', qty: 1 }], totalPrice: 5600, totalSodium: 1120, totalKcal: 416 },
  { id: 'c009', name: '떡국 + 김치제육 삼각', items: [{ productId: 'p036', qty: 1 }, { productId: 'p004', qty: 1 }], totalPrice: 4900, totalSodium: 1615, totalKcal: 577 },
  { id: 'c010', name: '햄치즈토마토샌드 + 카페라떼', items: [{ productId: 'p024', qty: 1 }, { productId: 'p059', qty: 1 }], totalPrice: 7400, totalSodium: 910, totalKcal: 447 },
  { id: 'c011', name: '크런키 + 흰우유 당충전', items: [{ productId: 'p042', qty: 1 }, { productId: 'p057', qty: 1 }], totalPrice: 2900, totalSodium: 145, totalKcal: 325 },
  { id: 'c012', name: '찜질방 st. 반숙란 + 바나나우유', items: [{ productId: 'p041', qty: 1 }, { productId: 'p050', qty: 1 }], totalPrice: 4500, totalSodium: 320, totalKcal: 368 },
  { id: 'c013', name: '하리보 + 복숭아 아이스티', items: [{ productId: 'p043', qty: 1 }, { productId: 'p058', qty: 1 }], totalPrice: 5000, totalSodium: 30, totalKcal: 337 },
  { id: 'c014', name: '시험기간 포카칩 + 핫식스', items: [{ productId: 'p046', qty: 1 }, { productId: 'p060', qty: 1 }], totalPrice: 4200, totalSodium: 433, totalKcal: 386 },
  { id: 'c015', name: '운동 후 단백질 간식', items: [{ productId: 'p039', qty: 1 }, { productId: 'p040', qty: 1 }, { productId: 'p054', qty: 1 }], totalPrice: 5000, totalSodium: 600, totalKcal: 170 },
  { id: 'c016', name: '허니버터칩 + 꼬깔콘 과자 파티', items: [{ productId: 'p044', qty: 1 }, { productId: 'p045', qty: 1 }, { productId: 'p049', qty: 1 }], totalPrice: 6000, totalSodium: 581, totalKcal: 725 },
  { id: 'c017', name: '마늘핫바 + 맥스봉 + 콜라제로', items: [{ productId: 'p038', qty: 1 }, { productId: 'p037', qty: 1 }, { productId: 'p049', qty: 1 }], totalPrice: 7700, totalSodium: 590, totalKcal: 345 },
  { id: 'c018', name: '얼음컵 DIY 아이스 모카', items: [{ productId: 'p053', qty: 1 }, { productId: 'p051', qty: 1 }, { productId: 'p052', qty: 1 }], totalPrice: 5600, totalSodium: 218, totalKcal: 214 },
  { id: 'c019', name: '단호박 오트죽 + 바나나우유', items: [{ productId: 'p035', qty: 1 }, { productId: 'p050', qty: 1 }], totalPrice: 5700, totalSodium: 770, totalKcal: 471 },
  { id: 'c020', name: '밤샘 과제 포스틱 + 몬스터', items: [{ productId: 'p047', qty: 1 }, { productId: 'p048', qty: 1 }], totalPrice: 4100, totalSodium: 805, totalKcal: 409 },
];

const FALLBACK_COMBOS = RAW_COMBOS.map((c) => ({
  id: c.id,
  name: c.name,
  totalPrice: c.totalPrice,
  totalSodium: c.totalSodium,
  totalKcal: c.totalKcal,
  items: c.items.map(({ productId, qty }) => {
    const product = byId[productId];
    return { product, qty, alternative: findAlternative(product) };
  }),
}));

function overAmount(combo, price, sodium, kcal) {
  return {
    price: Math.max(0, combo.totalPrice - price),
    sodium: Math.max(0, combo.totalSodium - sodium),
    kcal: Math.max(0, combo.totalKcal - kcal),
  };
}

function overRatioScore(combo, price, sodium, kcal) {
  const p = Math.max(0, (combo.totalPrice - price) / Math.max(price, 1));
  const s = Math.max(0, (combo.totalSodium - sodium) / Math.max(sodium, 1));
  const k = Math.max(0, (combo.totalKcal - kcal) / Math.max(kcal, 1));
  return p + s + k;
}

function pickCombo({ price = 5000, sodium = 670, kcal = 700, exclude } = {}) {
  const pool = FALLBACK_COMBOS.filter((c) => c.id !== exclude);
  const candidates = pool.length ? pool : FALLBACK_COMBOS; // 후보가 다 빠지면 exclude 무시

  const fitting = candidates.filter(
    (c) => c.totalPrice <= price && c.totalSodium <= sodium && c.totalKcal <= kcal
  );

  let chosen;
  let fits;
  if (fitting.length > 0) {
    chosen = fitting[Math.floor(Math.random() * fitting.length)];
    fits = true;
  } else {
    // 목표를 가장 적게 넘는 조합 선택 (비율 합이 가장 작은 것)
    chosen = [...candidates].sort(
      (a, b) => overRatioScore(a, price, sodium, kcal) - overRatioScore(b, price, sodium, kcal)
    )[0];
    fits = false;
  }

  return {
    combo: chosen,
    fits,
    over: fits ? { price: 0, sodium: 0, kcal: 0 } : overAmount(chosen, price, sodium, kcal),
  };
}

export async function recommendCombo({ price, sodium, kcal, exclude } = {}) {
  const params = new URLSearchParams();
  if (price != null) params.set('price', price);
  if (sodium != null) params.set('sodium', sodium);
  if (kcal != null) params.set('kcal', kcal);
  if (exclude) params.set('exclude', exclude);

  try {
    const res = await fetch(`/api/combos/recommend?${params.toString()}`);
    if (!res.ok) throw new Error('조합을 불러오지 못했어요.');
    return await res.json();
  } catch (err) {
    console.warn('[recommendCombo] API 실패, 임시 조합 로직으로 대체합니다:', err.message);
    return pickCombo({ price, sodium, kcal, exclude });
  }
}