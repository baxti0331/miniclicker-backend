const express = require('express');
const fs = require('fs').promises;
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// Чтение базы данных
async function readDB() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data || '{}');
  } catch {
    return {};
  }
}

// Запись в базу данных
async function writeDB(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// 📌 Получение баланса пользователя
app.get('/balance/:user_id', async (req, res) => {
  const userId = req.params.user_id;
  const db = await readDB();
  const user = db[userId] || { coins: 0 };
  res.json({ coins: user.coins });
});

// 📌 Увеличение баланса (клик)
app.post('/click', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' });

  const db = await readDB();
  const user = db[user_id] || { coins: 0, tasks: {} };
  user.coins += 1;

  db[user_id] = user;
  await writeDB(db);

  res.json({ success: true, coins: user.coins });
});

// 📌 Выполнение задания
app.post('/reward', async (req, res) => {
  const { user_id, task } = req.body;
  if (!user_id || !task) return res.status(400).json({ error: 'Missing data' });

  const db = await readDB();
  const user = db[user_id] || { coins: 0, tasks: {} };

  if (user.tasks[task]) {
    return res.status(400).json({ error: 'Задание уже выполнено' });
  }

  const rewardMap = {
    'click_10_times': 10,
    'invite_friend': 20,
    'bonus': 5
  };

  const reward = rewardMap[task] || 0;
  user.coins += reward;
  user.tasks[task] = true;

  db[user_id] = user;
  await writeDB(db);

  res.json({ success: true, total: reward });
});

// 🚀 Запуск сервера
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
