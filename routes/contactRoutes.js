const express = require("express");
const router = express.Router();

const {
  submitContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
} = require("../controllers/ContactController");
const { adminAuth } = require("../middleware/auth");

router.post("/submit", submitContact);

router.use(adminAuth);
router.get("/", getContacts);
router.get("/:id", getContactById);
router.put("/:id", updateContact);
router.delete("/:id", deleteContact);

module.exports = router;
