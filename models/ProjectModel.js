const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true, enum: ["Web Development", "Mobile Development", "AI & Automation", "UI/UX Design", "DevOps", "Other"] },
  icon: { type: String, default: "Globe" },
  accentColor: { type: String, default: "lime" },
  status: { type: String, enum: ["In Progress", "Completed", "Pending", "On Hold"], default: "In Progress" },
  link: { type: String, default: "" },
  tags: { type: [String], default: [] },
  featured: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Project", projectSchema);
