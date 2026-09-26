const express = require('express');
const fs = require('fs');
const path = require('path');
const { calcStats, todayKST } = require('../utils/stats');

const router = express.Router();
const recordsPath = path.join(__dirname, '../data/records.json');

function readRecords() {
  if (!fs.existsSync(recordsPath)) return [];
  return JSON.parse(fs.readFileSync(recordsPath, 'utf-8'));
}

function diffStats(before, after) {
  return {
    mealCount: after.mealCount - before.mealCount,
    mealAvg: {
      price: after.mealAvg.price - before.mealAvg.price,
      sodium: after.mealAvg.sodium - before.mealAvg.sodium,
      kcal: after.mealAvg.kcal - before.mealAvg.kcal,
    },
    snack: {
      count: after.snack.count - before.snack.count,
      price: after.snack.price - before.snack.price,
      sodium: after.snack.sodium - before.snack.sodium,
      kcal: after.snack.kcal - before.snack.kcal,
    },
  };
}

router.post('/stats/preview', (req, res) => {
  const { type, total } = req.body;

  if ((type !== 'meal' && type !== 'snack') || !total) {
    return res.status(400).json({ error: 'type과 total이 필요합니다.' });
  }

  const records = readRecords();
  const virtualRecord = {
    type,
    date: todayKST(),
    total,
    createdAt: new Date().toISOString(),
  };

  const before = calcStats(records);
  const after = calcStats([...records, virtualRecord]);

  res.json({
    before: { mealCount: before.mealCount, mealAvg: before.mealAvg, snack: before.snack },
    after: { mealCount: after.mealCount, mealAvg: after.mealAvg, snack: after.snack },
    diff: diffStats(before, after),
  });
});

module.exports = router;
