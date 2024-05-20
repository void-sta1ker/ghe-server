const Mongoose = require("mongoose");

const { Schema } = Mongoose;

const BrandSchema = new Schema({
  name: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  // image: {
  //   data: Buffer,
  //   contentType: String,
  // },
  // image: {
  //   type: { imageUrl: String, imageKey: String },
  //   default: null,
  // },
  merchant: {
    type: Schema.Types.ObjectId,
    ref: "Merchant",
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now,
  },
});

BrandSchema.virtual("id").get(function () {
  return this._id;
});

BrandSchema.set("toJSON", {
  virtuals: true,
});

BrandSchema.set("toObject", {
  virtuals: true,
});

// BrandSchema.pre("save", function (next) {
//   this.updated = Date.now();
//   next();
// });

// BrandSchema.set("toJSON", {
//   transform: (doc, ret) => {
//     delete ret._id;
//     delete ret.__v;
//     return ret;
//   },
// });

// BrandSchema.set("toObject", {
//   transform: (doc, ret) => {
//     delete ret._id;
//     delete ret.__v;
//     return ret;
//   },
// });

module.exports = Mongoose.model("Brand", BrandSchema);
