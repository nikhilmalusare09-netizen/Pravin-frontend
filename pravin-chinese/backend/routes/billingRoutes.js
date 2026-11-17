const express = require('express');
const router = express.Router();
const {
  getBills,
  getBillByOrderId,
  getTableRunningBill,
  recordPayment,
} = require('../controllers/billingController');
const { protectAdmin } = require('../middleware/auth');

// Bill details for customer or admin
router.get('/:orderId', getBillByOrderId);

// Admin billing routes
router.get('/', protectAdmin, getBills);
router.get('/table/:tableId', protectAdmin, getTableRunningBill);
router.post('/:orderId/payment', protectAdmin, recordPayment);

module.exports = router;
