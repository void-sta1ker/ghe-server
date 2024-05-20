const Mongoose = require("mongoose");

const { Schema } = Mongoose;

const ProductSchema = new Schema({
  name: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  images: [
    {
      imageUrl: {
        type: String,
      },
      imageKey: {
        type: String,
      },
    },
  ],
  sku: {
    type: String,
  },
  barcode: {
    type: String,
  },
  quantity: {
    type: Number,
  },
  price: {
    type: Number,
  },
  discountedPrice: {
    type: Number,
    default: 0,
  },
  discountStart: {
    type: Date,
    default: null,
  },
  discountEnd: {
    type: Date,
    default: null,
  },
  colors: {
    type: [String],
    default: [],
  },
  brand: {
    type: Schema.Types.ObjectId,
    ref: "Brand",
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

ProductSchema.virtual("isDiscounted").get(function () {
  const now = new Date();

  const hasDiscountedPrice = Boolean(this.discountedPrice);

  // if only discountedPrice defined, perpetual discount
  if (!this.discountStart && !this.discountEnd) {
    return hasDiscountedPrice && this.discountedPrice > 0;
  }

  if (!this.discountEnd) {
    return (
      hasDiscountedPrice && this.discountStart && now >= this.discountStart
    );
  }

  if (!this.discountStart) {
    return hasDiscountedPrice && this.discountEnd && now <= this.discountEnd;
  }

  return (
    hasDiscountedPrice &&
    this.discountStart &&
    this.discountEnd &&
    now >= this.discountStart &&
    now <= this.discountEnd
  );
});

ProductSchema.virtual("id").get(function () {
  return this._id;
});

ProductSchema.set("toJSON", {
  virtuals: true,
});

ProductSchema.set("toObject", {
  virtuals: true,
});

module.exports = Mongoose.model("Product", ProductSchema);
