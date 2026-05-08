const jwt = require("jsonwebtoken");
const Admin = require("../models/AdminModel");
const User = require("../models/UserModel");

const JWT_SECRET = process.env.JWT_SECRET;

// Generic JWT verification
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }

    // Check httpOnly cookie
    if (!token && req.cookies && req.cookies.admintoken) {
      token = req.cookies.admintoken;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Invalid or expired token." });
    }

    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) {
      return res.status(401).json({ success: false, message: "Admin not found." });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// User authentication middleware
const userAuth = async (req, res, next) => {
  try {
    let token;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }

    if (!token && req.cookies && req.cookies.usertoken) {
      token = req.cookies.usertoken;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Invalid or expired token." });
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { adminAuth, userAuth };
