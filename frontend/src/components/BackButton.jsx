import { useNavigate } from 'react-router-dom';

// 탭으로 이동하는 화면(고르기·이번 주·목표)에는 필요 없고,
// "장바구니 확인"처럼 눌러서 들어간(push) 화면에서 쓰면 됩니다.
export default function BackButton({ fallback = '/' }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      onClick={handleBack}
      aria-label="뒤로가기"
      style={{
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        fontSize: 18,
        color: 'var(--text)',
      }}
    >
      ‹
    </button>
  );
}