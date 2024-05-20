const Mongoose = require("mongoose");
const { ROLES } = require("../constants");

const { Schema } = Mongoose;

const UserSchema = new Schema({
  phoneNumber: {
    type: String, // 998901234567
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  password: {
    type: String,
  },
  merchant: {
    type: Schema.Types.ObjectId,
    ref: "Merchant",
    default: null,
  },
  avatar: {
    type: String,
  },
  role: {
    type: String,
    default: ROLES.user,
    enum: [ROLES.admin, ROLES.user, ROLES.merchant],
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  updated: Date,
  created: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.virtual("id").get(function () {
  return this._id;
});

UserSchema.virtual("name").get(function () {
  return `${this.firstName ?? ""} ${this.lastName ?? ""}`.trim();
});

UserSchema.set("toJSON", {
  virtuals: true,
});

UserSchema.set("toObject", {
  virtuals: true,
});

// UserSchema.pre("save", function (next) {
//   this.updated = Date.now();
//   next();
// });

// UserSchema.set("toJSON", {
//   transform: (doc, ret) => {
//     delete ret._id;
//     delete ret.__v;
//     return ret;
//   },
// });

// UserSchema.set("toObject", {
//   transform: (doc, ret) => {
//     delete ret._id;
//     delete ret.__v;
//     return ret;
//   },
// });

module.exports = Mongoose.model("User", UserSchema);
