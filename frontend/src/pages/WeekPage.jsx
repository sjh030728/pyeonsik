// ⚠️ 이 파일은 FE2(이나윤) 담당입니다. FE1이 라우팅 확인용으로 최소 버전만 만들어뒀어요.
// GET /api/stats/week를 불러와서 끼니 수, 한 끼 평균, 간식 별도, 최근 기록을 구현해주세요.
export default function WeekPage() {
  return (
    <>
      <div className="page-header">
        <h1>이번 주 현황</h1>
      </div>
      <div className="page">
        <div className="card" style={{ color: 'var(--text-muted)' }}>
          FE2 담당 화면입니다. GET /api/stats/week 연결해서 채워주세요.
        </div>
      </div>
    </>
  );
}
