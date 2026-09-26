// ⚠️ 이 파일은 FE2(이나윤) 담당입니다. FE1이 라우팅 확인용으로 최소 버전만 만들어뒀어요.
// useCart()의 items / total / remove를 써서 장바구니 목록, 끼니/간식 선택, 시간대 선택,
// POST /api/stats/preview 변화량 미리보기, POST /api/records 기록을 구현해주세요.
import { useCart } from '../store/useCart';
import BackButton from '../components/BackButton';

export default function CheckoutPage() {
  const { items, total, remove } = useCart();

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <BackButton />
        <h1 style={{ margin: 0 }}>장바구니 확인</h1>
      </div>
      <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            아직 담은 상품이 없어요.
          </div>
        )}
        {items.map(({ product, qty }) => (
          <div key={product.id} className="card" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              {product.name} x{qty}
            </div>
            <button className="btn-secondary" onClick={() => remove(product.id)}>
              빼기
            </button>
          </div>
        ))}
        {items.length > 0 && (
          <div className="card">
            합계 {total.price.toLocaleString()}원 · {total.sodium}mg · {total.kcal}kcal
          </div>
        )}
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          FE2 담당 화면입니다. 끼니/간식 선택, 시간대 선택, 변화량 미리보기, 기록 버튼을 여기에 구현해주세요.
        </div>
      </div>
    </>
  );
}