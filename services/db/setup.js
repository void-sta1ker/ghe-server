const mongoose = require("mongoose");
const chalk = require("chalk");
const keys = require("../../config/keys");

const mongoURI = keys.database.url;

const db = mongoose.connection;

// Check if the connection is successful
db.on("error", console.error.bind(console, "MongoDB connection error:"));

db.once("open", () => {
  console.log(`${chalk.green("✓")} ${chalk.blue("Connected to MongoDB")}`);
});

const setupDB = async () => {
  // try {
  // mongoose.set("useCreateIndex", true);
  // Connect to MongoDB
  mongoose.connect(mongoURI, {
    // useCreateIndex: true, // Optional, for index creation
    // useFindAndModify: false, // Optional, to avoid deprecated methods
  });
  // .then(() =>
  //   console.log(`${chalk.green("✓")} ${chalk.blue("MongoDB Connected!")}`),
  // )
  // .catch((err) => console.log(err));
  // } catch (error) {
  //   return null;
  // }
};

module.exports = setupDB;
