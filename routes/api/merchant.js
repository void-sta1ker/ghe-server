const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const bodyParser = require("body-parser");
const Merchant = require("../../models/merchant");
const User = require("../../models/user");
const Brand = require("../../models/brand");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const { MERCHANT_STATUS, ROLES } = require("../../constants");
const bot = require("../../utils/bot");
const keys = require("../../config/keys");

const router = express.Router();

const jsonParser = bodyParser.json();

router.post("/", jsonParser, async (req, res) => {
  try {
    const { name, business, phoneNumber, brandName } = req.body;

    if (!name || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "You must enter your name and phone number.",
      });
    }

    if (!business) {
      return res.status(400).json({
        success: false,
        message: "You must enter a business description.",
      });
    }

    const existingMerchant = await Merchant.findOne({ phoneNumber });

    if (existingMerchant) {
      return res.status(400).json({
        success: false,
        message: "That phone number is already in use.",
      });
    }

    const merchant = new Merchant({
      name,
      phoneNumber,
      business,
      brandName,
    });
    const merchantDoc = await merchant.save();

    bot.sendMessage(
      keys.bot.chatId,
      `Your merchant application has been received. We will reach you on your phone number ${phoneNumber}!`,
    );

    res.status(200).json({
      success: true,
      message: `We received your request! we will reach you on your phone number ${phoneNumber}!`,
      merchant: merchantDoc,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.get("/search", auth, role.check(ROLES.admin), async (req, res) => {
  try {
    const { search = "" } = req.query;

    const regex = new RegExp(search, "i");

    const merchants = await Merchant.find({
      $or: [
        { phoneNumber: { $regex: regex } },
        { name: { $regex: regex } },
        { brandName: { $regex: regex } },
        { status: { $regex: regex } },
      ],
    }).populate("brand", "name");

    res.status(200).json({
      merchants,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.get("/", auth, role.check(ROLES.admin), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const merchants = await Merchant.find()
      .populate("brand")
      .sort("-created")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Merchant.countDocuments();

    res.status(200).json({
      results: merchants,
      // totalPages: Math.ceil(count / limit),
      // currentPage: Number(page),
      count,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.get("/:id", auth, role.check(ROLES.admin), async (req, res) => {
  try {
    const merchantId = req.params.id;
    const merchant = await Merchant.findById(merchantId);

    res.status(200).json(merchant);
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.put("/:id/active", auth, jsonParser, async (req, res) => {
  try {
    const merchantId = req.params.id;
    const update = req.body;
    const query = { _id: merchantId };

    const merchantDoc = await Merchant.findOneAndUpdate(query, update, {
      new: true,
    });

    if (!update.isActive) {
      await deactivateBrand(merchantId);

      bot.sendMessage(
        keys.bot.chatId,
        `Your merchant ${merchantDoc.name} has been deactivated. Please contact admin to request access again.`,
      );
    }

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

router.put("/approve/:id", auth, jsonParser, async (req, res) => {
  try {
    const merchantId = req.params.id;
    const query = { _id: merchantId };
    const update = {
      status: MERCHANT_STATUS.approved,
      isActive: true,
    };

    const merchantDoc = await Merchant.findOneAndUpdate(query, update, {
      new: true,
    });

    await createMerchantUser(
      merchantDoc.phoneNumber,
      merchantDoc.name,
      merchantId,
      // req.headers.host,
      keys.app.clientURL,
      true, // should activate brand
    );

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.put("/reject/:id", auth, jsonParser, async (req, res) => {
  try {
    const merchantId = req.params.id;

    const query = { _id: merchantId };
    const update = {
      status: MERCHANT_STATUS.rejected,
    };

    await Merchant.findOneAndUpdate(query, update, {
      new: true,
    });

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

router.post("/signup/:token", jsonParser, async (req, res) => {
  try {
    const { phoneNumber, firstName, lastName, password } = req.body;

    if (!phoneNumber) {
      return res
        .status(400)
        .json({ success: false, message: "You must enter an phone number." });
    }

    if (!firstName || !lastName) {
      return res
        .status(400)
        .json({ success: false, message: "You must enter your full name." });
    }

    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "You must enter a password." });
    }

    const userDoc = await User.findOne({
      phoneNumber,
      resetPasswordToken: req.params.token,
    });

    if (!userDoc) {
      return res
        .status(400)
        .json({ success: false, message: "Token or phone number is invalid" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const query = { _id: userDoc._id };
    const update = {
      phoneNumber,
      firstName,
      lastName,
      password: hash,
      resetPasswordToken: undefined,
    };

    await User.findOneAndUpdate(query, update, {
      new: true,
    });

    const merchantDoc = await Merchant.findOne({
      phoneNumber,
    });

    await createMerchantBrand(merchantDoc, true);

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

router.delete("/:id", auth, role.check(ROLES.admin), async (req, res) => {
  try {
    const merchantId = req.params.id;
    await deactivateBrand(merchantId);
    const merchant = await Merchant.deleteOne({ _id: merchantId });

    res.status(200).json({
      success: true,
      message: `Merchant has been deleted successfully!`,
      merchant,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

const deactivateBrand = async (merchantId) => {
  const merchantDoc = await Merchant.findOne({ _id: merchantId }).populate(
    "brand",
    "_id",
  );
  if (!merchantDoc || !merchantDoc.brand) return;
  const brandId = merchantDoc.brand._id;
  const query = { _id: brandId };
  const update = {
    isActive: false,
  };
  return await Brand.findOneAndUpdate(query, update, {
    new: true,
  });
};

const createMerchantBrand = async (
  { _id, brandName, business },
  isActive = false,
) => {
  const newBrand = new Brand({
    name: brandName,
    description: business,
    merchant: _id,
    isActive,
  });

  const brandDoc = await newBrand.save();

  const update = {
    brand: brandDoc._id,
  };
  await Merchant.findOneAndUpdate({ _id }, update);
};

const createMerchantUser = async (
  phoneNumber,
  name,
  merchant,
  host,
  shouldActivateBrand = false,
) => {
  const firstName = name;
  const lastName = "";

  const existingUser = await User.findOne({ phoneNumber });

  if (existingUser) {
    const query = { _id: existingUser._id };
    const update = {
      merchant,
      role: ROLES.merchant,
    };

    const merchantDoc = await Merchant.findOne({
      phoneNumber,
    });

    await createMerchantBrand(merchantDoc, shouldActivateBrand);

    bot.sendMessage(
      keys.bot.chatId,
      `Welcome ${name}, you are now a merchant!`,
    );

    return await User.findOneAndUpdate(query, update, {
      new: true,
    });
  } else {
    const buffer = crypto.randomBytes(48);
    const resetToken = buffer.toString("hex");
    const resetPasswordToken = resetToken;

    const user = new User({
      phoneNumber,
      firstName,
      lastName,
      resetPasswordToken,
      merchant,
      role: ROLES.merchant,
    });

    bot.sendMessage(
      keys.bot.chatId,
      `${
        "Congratulations! Your application has been accepted. Please complete your Merchant account signup by clicking on the link below. \n\n" +
        "Please click on the following link, or paste this into your browser to complete the process:\n\n"
      }${host}/merchant/${resetToken}?phone_number=${phoneNumber}\n\n`,
    );

    return await user.save();
  }
};

module.exports = router;
