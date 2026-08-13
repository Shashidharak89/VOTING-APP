const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const adminController = require("../controllers/adminController");

// Admin authentication middleware comparing incoming plain password with process.env.ADMIN_PASSWORD hash
function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers["x-admin-password"];
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized: Missing authorization header" });
  }

  const providedPassword = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  const storedHash = process.env.ADMIN_PASSWORD;
  if (!storedHash) {
    console.error("[adminAuth] ADMIN_PASSWORD environment variable is missing!");
    return res.status(500).json({ message: "Server error: Admin password not configured" });
  }

  try {
    const isValid = bcrypt.compareSync(providedPassword, storedHash);
    if (!isValid) {
      return res.status(401).json({ message: "Unauthorized: Invalid admin password" });
    }
    next();
  } catch (err) {
    console.error("[adminAuth] Error comparing password hash:", err.message);
    return res.status(401).json({ message: "Unauthorized: Invalid admin credentials" });
  }
}

// Verify password endpoint for Admin Login
router.post("/verify-password", adminAuth, (_req, res) => {
  res.json({ success: true, message: "Admin password verified" });
});

router.post("/set-due-date", adminAuth, adminController.setDueDate);
router.get("/get-due-date", adminAuth, adminController.getDueDate);
router.post("/set-voting-window", adminAuth, adminController.setVotingWindow);
router.get("/get-voting-window", adminAuth, adminController.getVotingWindow);
router.post("/set-voting-enabled", adminAuth, adminController.setVotingEnabled);
router.get("/get-voting-enabled", adminAuth, adminController.getVotingEnabled);
router.post("/candidate", adminAuth, adminController.addCandidate);
router.put("/candidate/:id", adminAuth, adminController.editCandidate);
router.delete("/candidate/:id", adminAuth, adminController.deleteCandidate);
router.get("/voted-users", adminAuth, adminController.getVotedUsers);

module.exports = { router, adminAuth };
