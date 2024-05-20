require("dotenv").config();
const chalk = require("chalk");
const bcrypt = require("bcryptjs");

const { ROLES } = require("../../constants");
const User = require("../../models/user");
const setupDB = require("./setup");

const args = process.argv.slice(2);
const phoneNumber = args[0];
const password = args[1];

const seedDB = async () => {
  try {
    console.log(`${chalk.blue("✓")} ${chalk.blue("seed db started")}`);

    if (!phoneNumber || !password) throw new Error("missing arguments");

    const user = new User({
      phoneNumber,
      password,
      firstName: "admin",
      lastName: "admin",
      role: ROLES.admin,
    });

    const existingUser = await User.findOne({ phoneNumber: user.phoneNumber });
    console.log("existingUser", existingUser);
    if (existingUser) throw new Error("user collection is seeded!");

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user.password, salt);
    user.password = hash;

    await user.save();

    console.log(`${chalk.green("✓")} ${chalk.green("seed db finished")}`);
  } catch (error) {
    console.log(
      `${chalk.red("x")} ${chalk.red("error while seeding database")}`,
    );
    console.log(error);
    return null;
  }
};

(async () => {
  await setupDB().then(async () => {
    await seedDB();
  });
})();
