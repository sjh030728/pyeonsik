// GET /api/health — 서버가 켜져 있는지 확인
export async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return false;
    const data = await res.json();
    return data?.ok === true;
  } catch {
    return false;
  }
}