const router = require("express").Router();
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../../models/user");
const auth = require("../../middleware/auth");
const bot = require("../../utils/bot");
const keys = require("../../config/keys");
const { ROLES } = require("../../constants");

const { secret, tokenLife } = keys.jwt;

const jsonParser = bodyParser.json();

const otps = new Map();

const platform2Role = {
  admin_panel: [ROLES.admin, ROLES.merchant],
  web: [ROLES.admin, ROLES.merchant, ROLES.user, "MEMBER"], // remove deprecated role MEMBER
};

router.post("/login", jsonParser, async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const { platform } = req.query;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "You must enter a phone number.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "You must enter a password.",
      });
    }

    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(400).send({
        success: false,
        message: "No user found for this phone number.",
      });
    }

    const hasAccess =
      platform &&
      platform2Role[platform] &&
      platform2Role[platform].includes(user.role);

    if (!hasAccess) {
      return res.status(400).send({
        success: false,
        message: "You do not have access to this platform.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Password Incorrect",
      });
    }

    const payload = {
      id: user.id,
    };

    const token = jwt.sign(payload, secret, { expiresIn: tokenLife });

    if (!token) {
      throw new Error();
    }

    // generate otp with length of 6
    const otp = Math.floor(100000 + Math.random() * 900000);

    otps.set(phoneNumber, otp.toString());

    bot.sendMessage(
      keys.bot.chatId,
      `Your phone number is: ${phoneNumber}\nYour otp is: ${otp}`,
    );

    res.status(200).json({
      success: true,
      token, // Bearer <token>
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.post("/register", jsonParser, async (req, res) => {
  try {
    const { phoneNumber, firstName, lastName, password } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "You must enter a phone number.",
      });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "You must enter your full name.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "You must enter a password.",
      });
    }

    const existingUser = await User.findOne({ phoneNumber });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "That phone number is already in use.",
      });
    }

    // generate otp with length of 6
    const otp = Math.floor(100000 + Math.random() * 900000);

    otps.set(phoneNumber, otp.toString());

    bot.sendMessage(
      keys.bot.chatId,
      `Your phone number is: ${phoneNumber}\nYour otp is: ${otp}`,
    );

    const user = new User({
      phoneNumber,
      password,
      firstName,
      lastName,
    });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user.password, salt);

    user.password = hash;
    const registeredUser = await user.save();

    const payload = {
      id: registeredUser.id,
    };

    const token = jwt.sign(payload, secret, { expiresIn: tokenLife });

    res.status(200).json({
      success: true,
      message: "Registered successfully.",
      token, // Bearer <token>
      user: {
        id: registeredUser.id,
        firstName: registeredUser.firstName,
        lastName: registeredUser.lastName,
        phoneNumber: registeredUser.phoneNumber,
        role: registeredUser.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.post("/check-phone", jsonParser, async (req, res) => {
  try {
    const { phoneNumber, otp, token } = req.body;

    // don't validate otp
    // otps.get(phoneNumber) !== otp
    if (false) {
      return res.status(400).json({
        success: false,

        message: "Invalid OTP.",
      });
    }

    const payload = jwt.verify(token, secret);

    if (!payload) {
      return res.status(400).json({
        success: false,
        message: "Invalid Token.",
      });
    }

    otps.delete(phoneNumber);

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.post("/forgot", jsonParser, async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "You must enter a phone number.",
      });
    }

    const existingUser = await User.findOne({ phoneNumber });

    if (!existingUser) {
      return res.status(400).send({
        success: false,
        message: "No user found for this phone number.",
      });
    }

    const buffer = crypto.randomBytes(48);
    const resetToken = buffer.toString("hex");

    existingUser.resetPasswordToken = resetToken;
    existingUser.resetPasswordExpires = Date.now() + 3600000;

    existingUser.save();

    bot.sendMessage(
      keys.bot.chatId,
      `Your password reset token is: ${resetToken}`,
    );

    res.status(200).json({
      success: true,
      message: "Please check your phone for the link to reset your password.",
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.post("/reset/:token", jsonParser, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "You must enter a password.",
      });
    }

    const resetUser = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!resetUser) {
      return res.status(400).json({
        success: false,
        message:
          "Your token has expired. Please attempt to reset your password again.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    resetUser.password = hash;
    resetUser.resetPasswordToken = undefined;
    resetUser.resetPasswordExpires = undefined;

    resetUser.save();

    bot.sendMessage(
      keys.bot.chatId,
      `Your password has been changed successfully. Please login with your new password.`,
    );

    res.status(200).json({
      success: true,
      message:
        "Password changed successfully. Please login with your new password.",
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.post("/reset", auth, jsonParser, async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const phoneNumber = req.user.phoneNumber;

    if (!phoneNumber) {
      return res.status(401).send({
        success: false,
        message: "Unauthenticated",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "You must enter a password.",
      });
    }

    const existingUser = await User.findOne({ phoneNumber });
    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: "That phone number is already in use.",
      });
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Please enter your correct old password.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(confirmPassword, salt);
    existingUser.password = hash;
    existingUser.save();

    bot.sendMessage(
      keys.bot.chatId,
      `Your password has been changed successfully. Please login with your new password.`,
    );

    res.status(200).json({
      success: true,
      message:
        "Password changed successfully. Please login with your new password.",
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

module.exports = router;
