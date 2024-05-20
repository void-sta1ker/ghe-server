const TelegramBot = require("node-telegram-bot-api");
const keys = require("../config/keys");

const bot = new TelegramBot(keys.bot.token, { polling: true });

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = "Hello, " + msg.from.first_name + "! This is your Telegram Bot.";
  bot.sendMessage(chatId, text);
});

module.exports = bot;
