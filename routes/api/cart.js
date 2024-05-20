const express = require("express");
const bodyParser = require("body-parser");
const Cart = require("../../models/cart");
const Product = require("../../models/product");
const auth = require("../../middleware/auth");
const { CART_ITEM_STATUS } = require("../../constants");
// const store = require("../../services/store");

const router = express.Router();

const jsonParser = bodyParser.json();

router.post("/", auth, jsonParser, async (req, res) => {
  try {
    const user = req.user._id;
    const products = req.body.products;

    // const products = store.caculateItemsSalesTax(items);

    const cart = new Cart({
      user,
      products,
    });

    const cartDoc = await cart.save();

    decreaseQuantity(products);

    res.status(200).json({
      success: true,
      cartId: cartDoc.id,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const user = req.user._id;

    const cart = await Cart.findOne({
      user,
      "products.status": CART_ITEM_STATUS.not_processed,
    }).populate({
      path: "products.product",
      populate: {
        path: "brand",
      },
    });

    res.status(200).json(cart);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.delete("/:cartId", auth, async (req, res) => {
  try {
    await Cart.deleteOne({ _id: req.params.cartId });

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

router.post("/:cartId", auth, jsonParser, async (req, res) => {
  try {
    const product = req.body.product;
    const query = { _id: req.params.cartId };

    await Cart.updateOne(query, { $push: { products: product } }).exec();

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

router.put(
  "/:cartId/:productId/:action",
  auth,
  jsonParser,
  async (req, res) => {
    try {
      const product = { product: req.params.productId };
      const query = {
        _id: req.params.cartId,
        "products.product": product.product,
      };
      const action = req.params.action;

      if (action === "inc") {
        await Cart.updateOne(query, {
          $inc: { "products.$.quantity": 1 },
        }).exec();
      }

      if (action === "dec") {
        await Cart.updateOne(query, {
          $inc: { "products.$.quantity": -1 },
        }).exec();
      }

      res.status(200).json({
        success: true,
      });
    } catch {
      console.error(error);

      res.status(400).json({
        success: false,
        message: "Your request could not be processed. Please try again.",
      });
    }
  },
);

router.delete("/:cartId/:productId", auth, async (req, res) => {
  try {
    const product = { product: req.params.productId };
    const query = { _id: req.params.cartId };

    await Cart.updateOne(query, { $pull: { products: product } }).exec();

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

const decreaseQuantity = (products) => {
  let bulkOptions = products.map((item) => {
    return {
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quantity: -item.quantity } },
      },
    };
  });

  Product.bulkWrite(bulkOptions);
};

module.exports = router;
