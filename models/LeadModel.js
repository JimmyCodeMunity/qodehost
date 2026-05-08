const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, default: "" },
  company: { type: String, default: "" },
  serviceType: { type: String, required: true },
  projectTitle: { type: String, default: "" },
  projectDescription: { type: String, default: "" },
  budget: { type: String, default: "" },
  timeline: { type: String, default: "" },
  priority: { type: String, enum: ["Low", "Medium", "High", "Urgent"], default: "Medium" },
  status: {
    type: String,
    enum: ["new", "contacted", "qualified", "proposal", "negotiation", "converted", "lost"],
    default: "new",
  },
  source: { type: String, default: "website" },
  notes: { type: String, default: "" },
  serviceRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceRequest", default: null },
  lastContactedAt: { type: Date, default: null },
  assignedTo: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

leadSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

leadSchema.set("toJSON", { virtuals: true });
leadSchema.set("toObject", { virtuals: true });

leadSchema.pre("save", function () {
  this.updatedAt = new Date();
});

module.exports = mongoose.model("Lead", leadSchema);
