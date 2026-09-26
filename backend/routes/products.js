const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const productsPath = path.join(__dirname, '../data/products.json');

router.get('/products', (req, res) => {
  const { category } = req.query;
  const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

  if (!category) {
    return res.json(products);
  }

  res.json(products.filter((p) => p.category === category));
});

module.exports = router;
