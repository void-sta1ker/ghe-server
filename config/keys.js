module.exports = {
  app: {
    name: "GreenHaven Express API",
    apiURL: `${process.env.BASE_API_URL}`,
    clientURL: process.env.CLIENT_URL,
  },
  port: process.env.PORT || 3000,
  database: {
    url: process.env.MONGODB_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    tokenLife: "1d", // 1m
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    bucketName: process.env.AWS_BUCKET_NAME,
  },
  bot: {
    token: process.env.BOT_TOKEN,
    chatId: process.env.BOT_CHAT_ID,
  },
};
