const express = require("express");
const bodyParser = require("body-parser");
const User = require("../../models/user");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const { ROLES } = require("../../constants");

const router = express.Router();

const jsonParser = bodyParser.json();

router.get("/search", auth, role.check(ROLES.admin), async (req, res) => {
  try {
    const { search = "" } = req.query;

    const regex = new RegExp(search, "i");

    const users = await User.find(
      {
        $or: [
          { firstName: { $regex: regex } },
          { lastName: { $regex: regex } },
        ],
      },
      { password: 0, _id: 0 },
    ).populate("merchant", "name");

    res.status(200).json({
      users,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    let query = {};

    if (search) {
      query = {
        $or: [
          { firstName: { $regex: new RegExp(search, "i") } },
          { lastName: { $regex: new RegExp(search, "i") } },
        ],
      };
    }

    const users = await User.find(query, {
      password: 0,
      resetPasswordToken: 0,
      resetPasswordExpires: 0,
    }) // added: resetPasswordToken, resetPasswordExpires, removed: _id
      .sort("-created")
      .populate("merchant", "name")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await User.countDocuments();

    res.status(200).json({
      results: users,
      // totalPages: Math.ceil(count / limit),
      // currentPage: Number(page),
      count,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const user = req.user._id;
    const userDoc = await User.findById(user, { password: 0 }).populate({
      path: "merchant",
      model: "Merchant",
      populate: {
        path: "brand",
        model: "Brand",
      },
    });

    res.status(200).json(userDoc);
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.put("/me", auth, jsonParser, async (req, res) => {
  try {
    const user = req.user._id;
    const update = req.body.profile;
    const query = { _id: user };

    const userDoc = await User.findOneAndUpdate(query, update, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: "Your profile is successfully updated!",
      user: userDoc,
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
