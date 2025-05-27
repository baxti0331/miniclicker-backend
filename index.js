import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 3000;

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CLARIFAI_API_KEY = process.env.CLARIFAI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

app.post("/", async (req, res) => {
  try {
    const update = req.body;

    if (!update.message) return res.status(200).send("No message");

    const chatId = update.message.chat.id;

    if (update.message.photo && update.message.photo.length > 0) {
      const photo = update.message.photo[update.message.photo.length - 1];
      const fileId = photo.file_id;

      // Получаем ссылку на файл у Telegram
      const fileLinkRes = await fetch(`${TELEGRAM_API_URL}/getFile?file_id=${fileId}`);
      const fileLinkData = await fileLinkRes.json();

      if (!fileLinkData.ok) throw new Error("Failed to get file link from Telegram");

      const filePath = fileLinkData.result.file_path;
      const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

      // Загружаем файл и конвертируем в base64
      const imageRes = await fetch(fileUrl);
      const imageBuffer = await imageRes.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString("base64");

      // Отправляем фото в Clarifai
      const clarifaiResponse = await fetch("https://api.clarifai.com/v2/models/food-item-v1/outputs", {
        method: "POST",
        headers: {
          Authorization: `Key ${CLARIFAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: [
            {
              data: {
                image: {
                  base64: imageBase64,
                },
              },
            },
          ],
        }),
      });

      const clarifaiData = await clarifaiResponse.json();

      if (!clarifaiResponse.ok || !clarifaiData.outputs) throw new Error("Clarifai error");

      const concepts = clarifaiData.outputs[0].data.concepts
        .slice(0, 3)
        .map((c) => c.name)
        .join(", ");

      const prompt = `Ты диетолог и ИИ. Опиши и оцени пищевую ценность этих продуктов: ${concepts}. Напиши калории, белки, жиры, углеводы, если можно.`;

      // Запрос к OpenAI
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 300,
        }),
      });

      const openaiData = await openaiResponse.json();

      if (!openaiResponse.ok) throw new Error("OpenAI error");

      const aiText = openaiData.choices?.[0]?.message?.content || "Нет ответа от ИИ";

      // Отправляем ответ в Telegram
      await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: aiText,
        }),
      });

      return res.status(200).send("OK");
    }

    if (update.message.text) {
      await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "Пожалуйста, отправьте фотографию еды, чтобы получить оценку калорийности.",
        }),
      });
      return res.status(200).send("OK");
    }

    res.status(200).send("No photo or text");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});