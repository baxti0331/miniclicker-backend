const express = require('express');
const router = express.Router();
const users = require('../data/users');

router.post('/', (req, res) => {
  const { userId, itemId } = req.body;

  if (!userId || !itemId) {
    return res.status(400).json({ message: 'Не указан userId или itemId' });
  }

  const user = users[userId] || { coins: 100 };
  let price = 0;
  let reward = 0;

  switch (itemId) {
    case 'small_pack':
      price = 5;
      reward = 10;
      break;
    case 'big_pack':
      price = 20;
      reward = 50;
      break;
    default:
      return res.status(400).json({ message: 'Неверный товар' });
  }

  if (user.coins < price) {
    return res.status(400).json({ message: 'Недостаточно монет' });
  }

  user.coins = user.coins - price + reward;
  users[userId] = user;

  res.json({ message: 'Покупка успешно обработана', coins: user.coins });
});

module.exports = router;