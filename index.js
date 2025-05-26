const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let users = {};

app.post('/click', (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id required' });
  }

  if (!users[user_id]) {
    users[user_id] = 0;
  }

  users[user_id]++;
  res.json({ total: users[user_id] });
});

app.get('/', (req, res) => {
  res.send('MiniClicker Backend is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
