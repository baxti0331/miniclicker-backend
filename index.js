const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const users = {};
/*
users structure:
{
  userId: {
    coins: number,
    clicks: number,
    tasksCompleted: { taskName: boolean },
    lastReset: timestamp,
    referrals: Set(userId),
    autoclickerLevel: number,
    dailyBonusTaken: boolean,
    doubler: boolean,
  }
}
*/

// Задачи и награды
const tasks = {
  click_10_times: { reward: 50 },
  bonus: { reward: 100 },
  invite_friend: { reward: 200 }
};

// Магазин товаров
const shopItems = {
  autoclicker: { price: 500, description: "Автокликер — пассивные клики" },
  doubler: { price: 1000, description: "Удвоитель монет" }
};

// Сброс заданий в полночь (UTC)
function resetDailyTasks() {
  const now = Date.now();
  for (const userId in users) {
    const user = users[userId];
    const lastReset = user.lastReset || 0;
    const dayPassed = new Date(lastReset).getUTCDate() !== new Date(now).getUTCDate();
    if (dayPassed) {
      user.tasksCompleted = {};
      user.dailyBonusTaken = false;
      user.lastReset = now;
      user.clicks = 0; // Можно сбросить клики, чтобы задания заново
    }
  }
}
setInterval(resetDailyTasks, 1000 * 60 * 60); // каждый час

// Создать пользователя, если не существует
function ensureUser(userId) {
  if (!users[userId]) {
    users[userId] = {
      coins: 0,
      clicks: 0,
      tasksCompleted: {},
      lastReset: 0,
      referrals: new Set(),
      autoclickerLevel: 0,
      dailyBonusTaken: false,
      doubler: false,
    };
  }
  return users[userId];
}

// Реферальная система
app.post('/refer', (req, res) => {
  const { user_id, ref_id } = req.body;
  if (!user_id || !ref_id || user_id === ref_id) return res.json({ success: false, error: "Некорректные данные" });
  ensureUser(user_id);
  ensureUser(ref_id);

  // Если пользователь ещё не приглашён этим рефером
  if (!users[ref_id].referrals.has(user_id)) {
    users[ref_id].referrals.add(user_id);
    users[ref_id].coins += 100; // Бонус за приглашение
    return res.json({ success: true, bonus: 100 });
  }
  res.json({ success: false, error: "Реферал уже существует" });
});

// Получить баланс
app.get('/balance/:user_id', (req, res) => {
  const user = ensureUser(req.params.user_id);
  // Добавь пассивный доход автокликера
  user.coins += user.autoclickerLevel;
  res.json({ coins: user.coins });
});

// Клик
app.post('/click', (req, res) => {
  const { user_id } = req.body;
  const user = ensureUser(user_id);
  user.coins += user.doubler ? 2 : 1;
  user.clicks++;
  res.json({ success: true, coins: user.coins });
});

// Выполнить задание
app.post('/reward', (req, res) => {
  const { user_id, task } = req.body;
  const user = ensureUser(user_id);

  if (user.tasksCompleted[task]) return res.json({ success: false, error: "Задание уже выполнено" });
  if (!tasks[task]) return res.json({ success: false, error: "Такого задания нет" });

  // Особые проверки
  if (task === 'click_10_times' && user.clicks < 10)
    return res.json({ success: false, error: "Не хватает кликов" });

  if (task === 'bonus' && user.dailyBonusTaken)
    return res.json({ success: false, error: "Бонус уже взят" });

  user.tasksCompleted[task] = true;
  user.coins += tasks[task].reward;

  if (task === 'bonus') user.dailyBonusTaken = true;

  res.json({ success: true, total: tasks[task].reward });
});

// Купить в магазине
app.post('/buy', (req, res) => {
  const { user_id, item } = req.body;
  const user = ensureUser(user_id);

  if (!shopItems[item]) return res.json({ success: false, error: "Нет такого товара" });

  const price = shopItems[item].price;
  if (user.coins < price) return res.json({ success: false, error: "Недостаточно монет" });

  user.coins -= price;

  if (item === 'autoclicker') {
    user.autoclickerLevel++;
  } else if (item === 'doubler') {
    user.doubler = true;
  }

  res.json({ success: true, coins: user.coins });
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});