const dotenv = require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const cors = require("cors");
const chalk = require("chalk");
const routes = require("./routes");
const passportInstance = require("./utils/passport");
const setupDB = require("./services/db/setup");
const { port } = require("./config/keys");

const app = express();

app.use(cors());

app.use(passportInstance.initialize());

// middlewares
app.use(routes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Internal Server Error");
});

app.listen(port, () => {
  console.log(
    `${chalk.green("✓")} ${chalk.blue(
      `Listening on port ${port}. Visit http://localhost:${port}/ in your browser.`,
    )}`,
  );
});

setupDB();
