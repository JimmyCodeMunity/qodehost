const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  phone: { type: String, default: "" },
  subscribe: { type: Boolean, default: false },
  status: { type: String, enum: ["new", "replied", "archived"], default: "new" },
  reply: { type: String, default: "" },
  repliedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Contact", contactSchema);
