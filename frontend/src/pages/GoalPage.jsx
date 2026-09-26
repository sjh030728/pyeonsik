// ⚠️ 이 파일은 FE2(이나윤) 담당입니다. FE1이 라우팅 확인용으로 최소 버전만 만들어뒀어요.
// useGoal()의 goal / setGoal / resetGoal을 써서 ± 버튼, 기본값 되돌리기를 구현해주세요.
import { useGoal } from '../store/useGoal';

export default function GoalPage() {
  const { goal } = useGoal();

  return (
    <>
      <div className="page-header">
        <h1>목표 설정</h1>
      </div>
      <div className="page">
        <div className="card">
          현재 목표: {goal.price.toLocaleString()}원 · {goal.sodium}mg · {goal.kcal}kcal
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            FE2 담당 화면입니다. ± 버튼, 기본값 되돌리기를 여기에 구현해주세요.
          </div>
        </div>
      </div>
    </>
  );
}
