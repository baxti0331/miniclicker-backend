const express = require('express');
const cors = require('cors');
const app = express();

const buyRoutes = require('./routes/buy');
const referralRoutes = require('./routes/referral');

app.use(cors());
app.use(express.json());

app.use('/api/buy', buyRoutes);
app.use('/api/referral', referralRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});