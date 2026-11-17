const express = require('express');
const router = express.Router();
const {
  placeOrder,
  trackOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  settleAndCompleteOrder,
} = require('../controllers/orderController');
const { protectAdmin } = require('../middleware/auth');

// Customer endpoints (no auth needed, tracking uses secure token)
router.post('/', placeOrder);
router.post('/track', trackOrder);
router.post('/settle', settleAndCompleteOrder);
router.get('/track/:orderNumber', (req, res, next) => {
  // Support GET /api/orders/track/PC-2026-0001?token=xyz
  req.body = {
    orderNumber: req.params.orderNumber,
    trackingToken: req.query.token,
  };
  return trackOrder(req, res, next);
});

// Admin management endpoints
router.get('/', protectAdmin, getOrders);
router.get('/:id', protectAdmin, getOrderById);
router.patch('/:id/status', protectAdmin, updateOrderStatus);

module.exports = router;
