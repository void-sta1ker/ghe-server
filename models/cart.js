const Mongoose = require("mongoose");
const { CART_ITEM_STATUS } = require("../constants");

const { Schema } = Mongoose;

const CartItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
  },
  quantity: Number,
  totalPrice: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    default: CART_ITEM_STATUS.not_processed,
    enum: [
      CART_ITEM_STATUS.not_processed,
      CART_ITEM_STATUS.processing,
      CART_ITEM_STATUS.shipped,
      CART_ITEM_STATUS.delivered,
      CART_ITEM_STATUS.cancelled,
    ],
  },
});

module.exports = Mongoose.model("CartItem", CartItemSchema);

const CartSchema = new Schema({
  products: [CartItemSchema],
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Mongoose.model("Cart", CartSchema);
