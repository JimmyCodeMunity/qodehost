const express = require('express');

const router = express.Router();
router.use(express.json({ extended: true }));


const { createAdminAcoount, getAdmins, adminLogin, adminLogout, adminForgotPassword, adminResetPassword, getAdminById, updateAdmin, deleteAdmin } = require('../controllers/AdminController');
const { getAllUsers, adminUpdateUser, adminDeleteUser } = require('../controllers/UserController');
const { adminAuth } = require('../middleware/auth');

router.post('/create', createAdminAcoount);
router.post('/login', adminLogin);
router.post('/logout', adminLogout);
router.post('/forgot-password', adminForgotPassword);
router.post('/reset-password', adminResetPassword);

router.use(adminAuth); // protect all routes below

// Admin management
router.get('/all', getAdmins);
router.get('/:id', getAdminById);
router.put('/:id', updateAdmin);
router.delete('/:id', deleteAdmin);

// User management
router.get('/users/all', getAllUsers);
router.put('/users/:id', adminUpdateUser);
router.delete('/users/:id', adminDeleteUser);


module.exports = router;