const Mongoose = require("mongoose");

const { Schema } = Mongoose;

const ContactSchema = new Schema({
  name: {
    type: String,
    trim: true,
  },
  phoneNumber: {
    type: String,
  },
  message: {
    type: String,
    trim: true,
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Mongoose.model("Contact", ContactSchema);
