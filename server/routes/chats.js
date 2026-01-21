const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");

router.post("/message", async (req, res) => {
  const { message } = req.body;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: "openrouter/auto",  // auto-select free model
        messages: [
          { role: "system", content: "You are a helpful customer support assistant." },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    console.log("OpenRouter raw response:", data);

    // Check for errors
    if (!data.choices || data.choices.length === 0) {
      return res.json({
        reply: "AI service error: " + (data.error?.message || "No valid response from model.")
      });
    }

    const botReply = data.choices[0].message.content;

    // Save chat in database
    const chat = new Chat({ user: message, bot: botReply });
    await chat.save();

    res.json({ reply: botReply });

  } catch (error) {
    console.error("OpenRouter error:", error);
    res.status(500).json({ reply: "AI service is unavailable." });
  }
});

module.exports = router;
