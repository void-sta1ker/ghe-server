const Mongoose = require("mongoose");

const { Schema } = Mongoose;

const AddressSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  address: {
    type: String,
  },
  city: {
    type: String,
  },
  state: {
    type: String,
  },
  country: {
    type: String,
    default: "Uzbekistan",
  },
  zipCode: {
    type: String,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now,
  },
});

AddressSchema.virtual("id").get(function () {
  return this._id;
});

AddressSchema.set("toJSON", {
  virtuals: true,
});

AddressSchema.set("toObject", {
  virtuals: true,
});

module.exports = Mongoose.model("Address", AddressSchema);
