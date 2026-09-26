const express = require('express');
const fs = require('fs');
const path = require('path');
const { todayKST } = require('../utils/stats');

const router = express.Router();
const productsPath = path.join(__dirname, '../data/products.json');
const recordsPath = path.join(__dirname, '../data/records.json');

function readRecords() {
  if (!fs.existsSync(recordsPath)) return [];
  return JSON.parse(fs.readFileSync(recordsPath, 'utf-8'));
}

function writeRecords(records) {
  fs.writeFileSync(recordsPath, JSON.stringify(records, null, 2));
}

router.post('/records', (req, res) => {
  const { type, timeSlot, items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: '장바구니가 비어 있습니다.' });
  }

  const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

  const filledItems = [];
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      return res.status(400).json({ error: `상품을 찾을 수 없습니다: ${item.productId}` });
    }
    filledItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      sodium: product.sodium,
      kcal: product.kcal,
      qty: item.qty || 1,
    });
  }

  const total = filledItems.reduce(
    (acc, item) => ({
      price: acc.price + item.price * item.qty,
      sodium: acc.sodium + item.sodium * item.qty,
      kcal: acc.kcal + item.kcal * item.qty,
    }),
    { price: 0, sodium: 0, kcal: 0 }
  );

  const record = {
    id: `r${Date.now()}`,
    date: todayKST(),
    type,
    timeSlot,
    items: filledItems,
    total,
    createdAt: new Date().toISOString(),
  };

  const records = readRecords();
  records.push(record);
  writeRecords(records);

  res.json(record);
});

module.exports = router;
