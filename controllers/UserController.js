const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/UserModel");
const { sendEmail, passwordResetTemplate } = require("../services/emailService");
const config = require("../config/config");

const JWT_SECRET = config.JWT_SECRET;
const CLIENT_URL = config.FRONTEND_URL;

// Helper: generate JWT
const generateToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: "7d" });

// Register
const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "An account with this email already exists." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone: phone || "",
      password: hashed,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}&backgroundColor=b6e3f4`,
    });

    const token = generateToken(user._id);
    res.cookie("usertoken", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: { token, user },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ success: false, message: "Invalid email or password." });
    }

    const token = generateToken(user._id);
    res.cookie("usertoken", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      data: { token, user },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Logout
const logoutUser = async (req, res) => {
  try {
    res.clearCookie("usertoken", { httpOnly: true });
    return res.status(200).json({ success: true, message: "Logged out successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Always return success to avoid email enumeration
      return res.status(200).json({ success: true, message: "If an account exists, a reset link has been sent." });
    }

    const rawToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${CLIENT_URL}/reset-password?token=${rawToken}`;
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";

    await sendEmail({
      to: user.email,
      subject: "Reset Your Qode Password",
      html: passwordResetTemplate(name, resetUrl),
    });

    return res.status(200).json({
      success: true,
      message: "If an account exists, a reset link has been sent.",
    });
  } catch (error) {
    // If email fails, still don't leak whether the user exists
    console.error("Password reset email error:", error.message);
    return res.status(200).json({ success: true, message: "If an account exists, a reset link has been sent." });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Token is invalid or has expired." });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get profile
const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update profile
const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, password } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (password && password.trim()) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    return res.status(200).json({ success: true, message: "Profile updated.", data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ joined: -1 });
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: update user (role, status, etc.)
const adminUpdateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, role, status, avatar } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;
    if (avatar !== undefined) user.avatar = avatar;
    await user.save();
    return res.status(200).json({ success: true, message: "User updated.", data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: delete user
const adminDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    return res.status(200).json({ success: true, message: "User deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  adminUpdateUser,
  adminDeleteUser,
};
