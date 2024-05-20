const express = require("express");
const bodyParser = require("body-parser");
const Wishlist = require("../../models/wishlist");
const Product = require("../../models/product");
const auth = require("../../middleware/auth");
const {
  getStoreProductsQuery,
  getStoreProductsWishlistQuery,
} = require("../../services/queries");

const router = express.Router();

const jsonParser = bodyParser.json();

router.post("/", auth, jsonParser, async (req, res) => {
  try {
    const { product, isLiked } = req.body;

    const user = req.user;

    const update = {
      product,
      isLiked,
      updated: Date.now(),
    };

    const query = { product: update.product, user: user._id };

    const updatedWishlist = await Wishlist.findOneAndUpdate(query, update, {
      new: true,
    });

    if (updatedWishlist !== null) {
      res.status(200).json({
        success: true,
        message: "Your wishlist has been updated successfully!",
        wishlist: updatedWishlist,
      });
    } else {
      const wishlist = new Wishlist({
        product,
        isLiked,
        user: user._id,
      });

      const wishlistDoc = await wishlist.save();

      res.status(200).json({
        success: true,
        message: `Added to your Wishlist successfully!`,
        wishlist: wishlistDoc,
      });
    }
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const user = req.user._id;

    const basicQuery = getStoreProductsQuery({});

    const wishListQuery =
      getStoreProductsWishlistQuery(user).concat(basicQuery);

    const products = await Product.aggregate(
      [{ $addFields: { id: "$_id" } }].concat(wishListQuery),
    );

    const wishlist = await Wishlist.find({ user, isLiked: true })
      .populate({
        path: "product",
        // select: "name price imageUrl",
      })
      .sort("-updated");

    res.status(200).json({
      results: products,
      count: products.length,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.delete("/", auth, jsonParser, async (req, res) => {
  try {
    const user = req.user._id;

    await Wishlist.deleteMany({ user });

    res.status(200).json({
      success: true,
    });
  } catch {
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

module.exports = router;
