const express = require("express");
const router = express.Router();
const { adminAuth } = require("../middleware/auth");
const { getAllLeads, getLeadStats, updateLead, deleteLead } = require("../controllers/LeadController");

router.use(adminAuth);
router.get("/", getAllLeads);
router.get("/stats", getLeadStats);
router.put("/:id", updateLead);
router.delete("/:id", deleteLead);

module.exports = router;
