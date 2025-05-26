const express = require('express');
const router = express.Router();
const users = require('../data/users');

router.post('/', (req, res) => {
  const { userId, code } = req.body;

  if (!userId || !code) {
    return res.status(400).json({ message: 'Не указан userId или код' });
  }

  const user = users[userId] || { coins: 100 };

  // Пример: проверка, использовал ли пользователь уже реферальный код
  if (user.referralUsed) {
    return res.status(400).json({ message: 'Реферальный код уже использован' });
  }

  user.coins += 10;
  user.referralUsed = true;
  users[userId] = user;

  res.json({ message: 'Реферальный код успешно применен', coins: user.coins });
});

module.exports = router;