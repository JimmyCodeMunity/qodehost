const express = require('express');

const router = express.Router();
router.use(express.json({ extended: true }));


const { createAdminAcoount, getAdmins, adminLogin, adminLogout, adminForgotPassword, adminResetPassword, getAdminById, updateAdmin, deleteAdmin } = require('../controllers/AdminController');
const { adminAuth } = require('../middleware/auth');

router.post('/create', createAdminAcoount);
router.post('/login', adminLogin);
router.post('/logout', adminLogout);
router.post('/forgot-password', adminForgotPassword);
router.post('/reset-password', adminResetPassword);

router.use(adminAuth); // protect all routes below
router.get('/all', getAdmins);
router.get('/:id', getAdminById);
router.put('/:id', updateAdmin);
router.delete('/:id', deleteAdmin);


module.exports = router;