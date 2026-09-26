const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const combosPath = path.join(__dirname, '../data/combos.json');
const productsPath = path.join(__dirname, '../data/products.json');

function findAlternative(product, productMap) {
  if (!product || !product.soldOut) return undefined;
  for (const candidate of productMap.values()) {
    if (candidate.category === product.category && candidate.id !== product.id && !candidate.soldOut) {
      return candidate;
    }
  }
  return null;
}

function buildComboPayload(combo, productMap) {
  const items = combo.items.map(({ productId, qty }) => {
    const product = productMap.get(productId);
    const item = { product, qty };
    const alternative = findAlternative(product, productMap);
    if (alternative !== undefined) item.alternative = alternative;
    return item;
  });

  return {
    id: combo.id,
    name: combo.name,
    items,
    totalPrice: combo.totalPrice,
    totalSodium: combo.totalSodium,
    totalKcal: combo.totalKcal,
  };
}

function excessRatio(combo, target) {
  const overPrice = Math.max(0, combo.totalPrice - target.price);
  const overSodium = Math.max(0, combo.totalSodium - target.sodium);
  const overKcal = Math.max(0, combo.totalKcal - target.kcal);
  return (
    (target.price > 0 ? overPrice / target.price : 0) +
    (target.sodium > 0 ? overSodium / target.sodium : 0) +
    (target.kcal > 0 ? overKcal / target.kcal : 0)
  );
}

router.get('/combos/recommend', (req, res) => {
  const target = {
    price: Number(req.query.price),
    sodium: Number(req.query.sodium),
    kcal: Number(req.query.kcal),
  };

  if (Number.isNaN(target.price) || Number.isNaN(target.sodium) || Number.isNaN(target.kcal)) {
    return res.status(400).json({ error: 'price, sodium, kcal 값이 필요합니다.' });
  }

  const excludeIds = (req.query.exclude || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  const combos = JSON.parse(fs.readFileSync(combosPath, 'utf-8'));
  const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
  const productMap = new Map(products.map((p) => [p.id, p]));

  const candidates = combos.filter((c) => !excludeIds.includes(c.id));
  if (candidates.length === 0) {
    return res.status(400).json({ error: '추천할 수 있는 조합이 없습니다.' });
  }

  const fitting = candidates.filter(
    (c) => c.totalPrice <= target.price && c.totalSodium <= target.sodium && c.totalKcal <= target.kcal
  );

  let chosen;
  let fits;
  let over = { price: 0, sodium: 0, kcal: 0 };

  if (fitting.length > 0) {
    chosen = fitting[Math.floor(Math.random() * fitting.length)];
    fits = true;
  } else {
    chosen = candidates.reduce((best, c) =>
      excessRatio(c, target) < excessRatio(best, target) ? c : best
    );
    fits = false;
    over = {
      price: Math.max(0, chosen.totalPrice - target.price),
      sodium: Math.max(0, chosen.totalSodium - target.sodium),
      kcal: Math.max(0, chosen.totalKcal - target.kcal),
    };
  }

  res.json({
    combo: buildComboPayload(chosen, productMap),
    fits,
    over,
  });
});

module.exports = router;
