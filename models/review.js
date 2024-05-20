const Mongoose = require("mongoose");
const { REVIEW_STATUS } = require("../constants");

const { Schema } = Mongoose;

const ReviewSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    default: null,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  title: {
    type: String,
    trim: true,
  },
  rating: {
    type: Number,
    default: 0,
  },
  review: {
    type: String,
    trim: true,
  },
  isRecommended: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    default: REVIEW_STATUS.waiting_approval,
    enum: [
      REVIEW_STATUS.waiting_approval,
      REVIEW_STATUS.rejected,
      REVIEW_STATUS.approved,
    ],
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now,
  },
});

ReviewSchema.virtual("id").get(function () {
  return this._id;
});

ReviewSchema.set("toJSON", {
  virtuals: true,
});

ReviewSchema.set("toObject", {
  virtuals: true,
});

module.exports = Mongoose.model("Review", ReviewSchema);
