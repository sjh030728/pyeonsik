// 이번 주 통계 계산 (BE 2 담당)
// GET /api/stats/week 와 POST /api/stats/preview(BE 1)가 함께 씁니다.
// 한 주 = 월요일 00:00 ~ 일요일 23:59 (한국 시간), 이번 주인지는 record.date 로 판단합니다.

// 한국 날짜 문자열 'YYYY-MM-DD'
function todayKST(now = new Date()) {
  return now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
}

// 'YYYY-MM-DD' 에 days 일을 더한 날짜 문자열
function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// 해당 날짜가 속한 주의 월요일
function getWeekStart(dateStr) {
  const day = new Date(dateStr + 'T00:00:00Z').getUTCDay(); // 0=일 ... 6=토
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(dateStr, diff);
}

// records: records.json 배열, today: 'YYYY-MM-DD'(생략하면 오늘, 테스트할 때만 넘김)
function calcStats(records, today) {
  const list = Array.isArray(records) ? records : [];
  const weekStart = getWeekStart(today || todayKST());
  const weekEnd = addDays(weekStart, 6);

  const thisWeek = list.filter(
    (r) => r && typeof r.date === 'string' && r.date >= weekStart && r.date <= weekEnd
  );

  const meals = thisWeek.filter((r) => r.type === 'meal');
  const snacks = thisWeek.filter((r) => r.type === 'snack');

  const sum = (arr, key) =>
    arr.reduce((acc, r) => acc + (Number(r.total && r.total[key]) || 0), 0);

  const mealCount = meals.length;
  const avg = (key) => (mealCount === 0 ? 0 : Math.round(sum(meals, key) / mealCount));

  const recent = [...thisWeek]
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 5);

  return {
    weekStart,
    mealCount,
    mealAvg: { price: avg('price'), sodium: avg('sodium'), kcal: avg('kcal') },
    snack: {
      count: snacks.length,
      price: sum(snacks, 'price'),
      sodium: sum(snacks, 'sodium'),
      kcal: sum(snacks, 'kcal'),
    },
    recent,
  };
}

module.exports = { calcStats, todayKST, getWeekStart };
