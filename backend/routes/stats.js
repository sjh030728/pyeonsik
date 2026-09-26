// GET /api/stats/week (BE 2 담당)
// server.js 에서 app.use('/api', require('./routes/stats')) 로 붙입니다.
const express = require('express');
const fs = require('fs');
const path = require('path');
const { calcStats } = require('../utils/stats');

const router = express.Router();
const RECORDS_PATH = path.join(__dirname, '../data/records.json');

// 요청마다 새로 읽습니다(require로 읽으면 값이 고정돼서 새 기록이 반영되지 않음).
function readRecords() {
  if (!fs.existsSync(RECORDS_PATH)) return []; // 파일이 없으면 기록 0개
  const text = fs.readFileSync(RECORDS_PATH, 'utf-8');
  if (text.trim() === '') return [];
  const data = JSON.parse(text);
  return Array.isArray(data) ? data : [];
}

router.get('/stats/week', (req, res) => {
  try {
    res.json(calcStats(readRecords()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '이번 주 통계를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.' });
  }
});

module.exports = router;
