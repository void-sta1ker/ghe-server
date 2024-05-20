const express = require("express");
const bodyParser = require("body-parser");
const Address = require("../../models/address");
const auth = require("../../middleware/auth");

const router = express.Router();

const jsonParser = bodyParser.json();

router.post("/", auth, jsonParser, async (req, res) => {
  try {
    const user = req.user;

    if (req.body.isDefault) {
      await Address.findOne({ user: user._id, isDefault: true }).updateOne({
        isDefault: false,
      });
    }

    const address = new Address({
      ...req.body,
      user: user._id,
    });

    const addressDoc = await address.save();

    res.status(200).json({
      success: true,
      message: `Address has been added successfully!`,
      address: addressDoc,
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
    const addresses = await Address.find({ user: req.user._id });

    const count = await Address.countDocuments({ user: req.user._id });

    res.status(200).json({
      results: addresses,
      count,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const addressId = req.params.id;

    const addressDoc = await Address.findOne({ _id: addressId });

    if (!addressDoc) {
      res.status(404).json({
        message: `Cannot find Address with the id: ${addressId}.`,
      });
    }

    res.status(200).json({
      address: addressDoc,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.put("/:id", auth, jsonParser, async (req, res) => {
  try {
    const addressId = req.params.id;
    const update = req.body;
    const query = { _id: addressId };

    if (update.isDefault) {
      await Address.updateMany(
        { user: req.user._id },
        { $set: { isDefault: false } },
      );
    }

    await Address.findOneAndUpdate(query, update, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: "Address has been updated successfully!",
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
    });

    if (address.isDefault) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete the default address.",
      });
    }

    const deletedAddress = await Address.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: `Address has been deleted successfully!`,
      address: deletedAddress,
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
