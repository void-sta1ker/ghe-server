const Mongoose = require("mongoose");

const { Schema } = Mongoose;

const OrderSchema = new Schema({
  cart: {
    type: Schema.Types.ObjectId,
    ref: "Cart",
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  total: {
    type: Number,
    default: 0,
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now,
  },
});

OrderSchema.virtual("id").get(function () {
  return this._id;
});

OrderSchema.set("toJSON", {
  virtuals: true,
});

OrderSchema.set("toObject", {
  virtuals: true,
});

module.exports = Mongoose.model("Order", OrderSchema);
