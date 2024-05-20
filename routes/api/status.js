const router = require("express").Router();
const auth = require("../../middleware/auth");
const {
  REVIEW_STATUS,
  MERCHANT_STATUS,
  CART_ITEM_STATUS,
} = require("../../constants");

router.get("/review", auth, (req, res) => {
  res.status(200).json({
    results: Object.values(REVIEW_STATUS),
  });
});

router.get("/merchant", auth, (req, res) => {
  res.status(200).json({
    results: Object.values(MERCHANT_STATUS),
  });
});

router.get("/cart-item", auth, (req, res) => {
  res.status(200).json({
    results: Object.values(CART_ITEM_STATUS),
  });
});

module.exports = router;
