const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Admin = require("../models/AdminModel");
const jwt = require('jsonwebtoken');
const { sendEmail, passwordResetTemplate } = require("../services/emailService");
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";


// create admin account

const createAdminAcoount = async (req, res) => {
    console.log("sending admin data....");
    const { username, fullname, email, phone, password } = req.body;

    try {


        const existingadmin = await Admin.findOne({ email });
        if (existingadmin) {
            return res.status(400).json({
                success: false,
                message: "Admin with this email already exists"
            })
        } else {
            const newpassword = await bcrypt.hash(password, 10);

            const newadmin = await Admin.create({
                username,
                fullname,
                email,
                phone,
                password: newpassword
            })

            return res.status(200).json({
                success: true,
                message: "Admin created successfully"
            })
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })

    }
}


// admin login
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingadmin = await Admin.findOne({ email });

        if (!existingadmin) {
            return res.status(400).json({
                success: false,
                message: "Admin with this email does not exist"
            })
        }
        else {
            const isPasswordCorrect = await bcrypt.compare(password, existingadmin.password);

            if (!isPasswordCorrect) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid password"
                })
            }
            else {
                // generate token
                const token = jwt.sign({ id: existingadmin._id }, JWT_SECRET, { expiresIn: "1d" });
                // set token in front end
                res.cookie("admintoken", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
                return res.status(200).json({
                    success: true,
                    message: "Admin logged in successfully",
                    data: {
                        token,
                        admin: existingadmin
                    }
                })
            }
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


// fetch admin accounts
const getAdmins = async (req, res) => {
    try {
        const admins = await Admin.find();
        return res.status(200).json({
            success: true,
            message: "Admins fetched successfully",
            data: admins
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// get admin by id
const getAdminById = async (req, res) => {
    try {
        const { id } = req.params;
        const admin = await Admin.findById(id);
        if (admin) {
            return res.status(200).json({
                success: true,
                message: "Admin fetched successfully",
                data: admin
            });
        }
        else {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// update admin data
const updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, password, fullname, phone, username } = req.body;
        const admin = await Admin.findById(id);
        if (admin) {
            if (email) admin.email = email;
            if (fullname) admin.fullname = fullname;
            if (phone) admin.phone = phone;
            if (username) admin.username = username;
            if (password && password.trim()) {
                admin.password = await bcrypt.hash(password, 10);
            }
            await admin.save();
            return res.status(200).json({
                success: true,
                message: "Admin updated successfully",
                data: admin
            });
        }
        else {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// admin logout
const adminLogout = async (req, res) => {
    try {
        res.clearCookie("admintoken", { httpOnly: true });
        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// admin forgot password
const adminForgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(200).json({ success: true, message: "If an account exists, a reset link has been sent." });
        }

        const rawToken = admin.createPasswordResetToken();
        await admin.save({ validateBeforeSave: false });

        const resetUrl = `${CLIENT_URL}/admin/reset-password?token=${rawToken}`;
        const name = admin.fullname || admin.username || "Admin";

        await sendEmail({
            to: admin.email,
            subject: "Reset Your Qode Admin Password",
            html: passwordResetTemplate(name, resetUrl),
        });

        return res.status(200).json({ success: true, message: "If an account exists, a reset link has been sent." });
    } catch (error) {
        console.error("Admin password reset email error:", error.message);
        return res.status(200).json({ success: true, message: "If an account exists, a reset link has been sent." });
    }
}

// admin reset password
const adminResetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const admin = await Admin.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!admin) {
            return res.status(400).json({ success: false, message: "Token is invalid or has expired." });
        }

        admin.password = await bcrypt.hash(password, 10);
        admin.resetPasswordToken = null;
        admin.resetPasswordExpires = null;
        await admin.save();

        return res.status(200).json({ success: true, message: "Password reset successfully. You can now log in." });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

// delete admin account
const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const admin = await Admin.findByIdAndDelete(id);
        if (admin) {
            return res.status(200).json({
                success: true,
                message: "Admin deleted successfully",
                data: admin
            });
        }
        else {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}



module.exports = {
    createAdminAcoount,
    getAdmins,
    adminLogin,
    adminLogout,
    adminForgotPassword,
    adminResetPassword,
    getAdminById,
    updateAdmin,
    deleteAdmin
}
