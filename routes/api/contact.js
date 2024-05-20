const express = require("express");
const bodyParser = require("body-parser");
const Contact = require("../../models/contact");
const bot = require("../../utils/bot");
const keys = require("../../config/keys");

const router = express.Router();

const jsonParser = bodyParser.json();

router.post("/", jsonParser, async (req, res) => {
  try {
    const name = req.body.name;
    const phoneNumber = req.body.phoneNumber;
    const message = req.body.message;

    if (!phoneNumber) {
      return res
        .status(400)
        .json({ success: false, message: "You must enter a phone number." });
    }

    if (!name) {
      return res
        .status(400)
        .json({
          success: false,
          message: "You must enter description & name.",
        });
    }

    if (!message) {
      return res
        .status(400)
        .json({ success: false, message: "You must enter a message." });
    }

    const existingContact = await Contact.findOne({ phoneNumber });

    if (existingContact) {
      return res
        .status(400)
        .json({
          success: false,
          message: "A request already existed for same phone number",
        });
    }

    const contact = new Contact({
      name,
      phoneNumber,
      message,
    });

    const contactDoc = await contact.save();

    bot.sendMessage(
      keys.bot.chatId,
      `We received your message, we will reach you on your phone number ${phoneNumber}!`,
    );

    res.status(200).json({
      success: true,
      message: `We received your message, we will reach you on your phone number ${phoneNumber}!`,
      contact: contactDoc,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

module.exports = router;
