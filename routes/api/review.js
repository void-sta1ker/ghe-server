const express = require("express");
const bodyParser = require("body-parser");
const Review = require("../../models/review");
const Product = require("../../models/product");
const auth = require("../../middleware/auth");
const { REVIEW_STATUS } = require("../../constants");

const router = express.Router();

const jsonParser = bodyParser.json();

router.post("/", auth, jsonParser, async (req, res) => {
  try {
    const user = req.user;

    const review = new Review({
      ...req.body,
      user: user._id,
    });

    const reviewDoc = await review.save();

    res.status(200).json({
      success: true,
      message: `Your review has been added successfully and will appear when approved!`,
      review: reviewDoc,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    let query = {};

    if (search) {
      query = {
        $or: [
          { title: { $regex: new RegExp(search, "i") } },
          { review: { $regex: new RegExp(search, "i") } },
        ],
      };
    }

    const reviews = await Review.find(query)
      .sort("-created")
      .populate({
        path: "user",
        select: "firstName",
      })
      .populate({
        path: "product",
        select: "name slug imageUrl",
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Review.countDocuments();

    res.status(200).json({
      results: reviews,
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

router.get("/me", auth, async (req, res) => {
  try {
    const user = req.user._id;

    const reviews = await Review.find({ user }).populate({
      path: "product",
      select: "name slug imageUrl",
    });

    res.status(200).json({
      results: reviews,
      count: reviews.length,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const productDoc = await Product.findOne({ _id: req.params.slug });

    const hasNoBrand =
      productDoc?.brand === null || productDoc?.brand?.isActive === false;

    if (!productDoc || hasNoBrand) {
      return res.status(200).json({
        results: [],
        count: 0,
      });
    }

    const reviews = await Review.find({
      product: productDoc._id,
      status: REVIEW_STATUS.approved,
    })
      // .populate({
      //   path: "user",
      //   select: "firstName",
      // })
      .sort("-created");

    res.status(200).json({
      results: reviews,
      count: reviews.length,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.put("/:id", jsonParser, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const update = req.body;
    const query = { _id: reviewId };

    await Review.findOneAndUpdate(query, update, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: "review has been updated successfully!",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.put("/approve/:reviewId", auth, async (req, res) => {
  try {
    const reviewId = req.params.reviewId;

    const query = { _id: reviewId };
    const update = {
      status: REVIEW_STATUS.approved,
      isActive: true,
    };

    await Review.findOneAndUpdate(query, update, {
      new: true,
    });

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

router.put("/reject/:reviewId", auth, async (req, res) => {
  try {
    const reviewId = req.params.reviewId;

    const query = { _id: reviewId };
    const update = {
      status: REVIEW_STATUS.rejected,
    };

    await Review.findOneAndUpdate(query, update, {
      new: true,
    });

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

router.delete("/:id", async (req, res) => {
  try {
    const review = await Review.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: `review has been deleted successfully!`,
      review,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

module.exports = router;
