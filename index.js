const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Временное хранилище для монет пользователей
const usersCoins = {};

// Роут "клик" - увеличивает счётчик монет на 1
app.post('/click', (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  usersCoins[user_id] = (usersCoins[user_id] || 0) + 1;
  res.json({ total: usersCoins[user_id] });
});

// Роут "бонус" - добавляет ежедневный бонус (например, +10 монет)
// Здесь упрощённо: бонус можно получать без ограничений
app.post('/bonus', (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  usersCoins[user_id] = (usersCoins[user_id] || 0) + 10;
  res.json({ total: usersCoins[user_id] });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});