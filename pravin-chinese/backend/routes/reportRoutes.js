const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getSalesReports,
} = require('../controllers/reportController');
const { protectAdmin } = require('../middleware/auth');

router.get('/dashboard', protectAdmin, getDashboardStats);
router.get('/sales', protectAdmin, getSalesReports);

module.exports = router;
