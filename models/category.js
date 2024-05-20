const Mongoose = require("mongoose");

const { Schema } = Mongoose;

const CategorySchema = new Schema({
  _id: {
    type: Schema.ObjectId,
    auto: true,
  },
  slug: String,
  name: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  products: [
    {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
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

CategorySchema.virtual("id").get(function () {
  return this._id;
});

CategorySchema.set("toJSON", {
  virtuals: true,
});

CategorySchema.set("toObject", {
  virtuals: true,
});

// CategorySchema.pre("save", function (next) {
//   this.updated = Date.now();
//   next();
// });

// CategorySchema.set("toJSON", {
//   transform: (doc, ret) => {
//     delete ret._id;
//     delete ret.__v;
//     return ret;
//   },
// });

// CategorySchema.set("toObject", {
//   transform: (doc, ret) => {
//     delete ret._id;
//     delete ret.__v;
//     return ret;
//   },
// });

module.exports = Mongoose.model("Category", CategorySchema);
