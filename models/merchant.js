const Mongoose = require("mongoose");
const { MERCHANT_STATUS } = require("../constants");

const { Schema } = Mongoose;

const MerchantSchema = new Schema({
  name: {
    type: String,
    trim: true,
  },
  phoneNumber: {
    type: String, // 998901234567
  },
  brandName: {
    type: String,
  },
  business: {
    type: String,
    trim: true,
  },
  brand: {
    type: Schema.Types.ObjectId,
    ref: "Brand",
    default: null,
  },
  status: {
    type: String,
    default: MERCHANT_STATUS.waiting_approval,
    enum: [
      MERCHANT_STATUS.waiting_approval,
      MERCHANT_STATUS.rejected,
      MERCHANT_STATUS.approved,
    ],
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now,
  },
});

MerchantSchema.virtual("id").get(function () {
  return this._id;
});

MerchantSchema.set("toJSON", {
  virtuals: true,
});

MerchantSchema.set("toObject", {
  virtuals: true,
});

// MerchantSchema.pre("save", function (next) {
//   this.updated = Date.now();
//   next();
// });

// MerchantSchema.set("toJSON", {
//   transform: (doc, ret) => {
//     delete ret._id;
//     delete ret.__v;
//     return ret;
//   },
// });

// MerchantSchema.set("toObject", {
//   transform: (doc, ret) => {
//     delete ret._id;
//     delete ret.__v;
//     return ret;
//   },
// });

module.exports = Mongoose.model("Merchant", MerchantSchema);
