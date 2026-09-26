const express = require('express');
const cors = require('cors');

const productsRouter = require('./routes/products');
const combosRouter = require('./routes/combos');
const recordsRouter = require('./routes/records');
const previewRouter = require('./routes/preview');
const statsRouter = require('./routes/stats');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api', productsRouter);
app.use('/api', combosRouter);
app.use('/api', recordsRouter);
app.use('/api', previewRouter);
app.use('/api', statsRouter);  

app.listen(PORT, () => {
  console.log(`backend listening on http://localhost:${PORT}`);
});
