const crypto = require('crypto');
const Order = require('../models/Order');

// Hash tracking token with SHA-256
const hashToken = (token) => {
  if (!token) return '';
  return crypto.createHash('sha256').update(String(token).trim().toLowerCase()).digest('hex');
};

// Generate clean, secure human-readable tracking token (e.g. TRK-A7B8C9)
const generateTrackingToken = () => {
  const hex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TRK-${hex}`;
};

// Comprehensive verification supporting direct tokens, case insensitivity, and legacy hashes
const verifyToken = (inputToken, order) => {
  if (!inputToken || !order) return false;
  const clean = String(inputToken).trim();
  const upper = clean.toUpperCase();
  const lower = clean.toLowerCase();

  // 1. Direct match with stored trackingToken
  if (order.trackingToken && order.trackingToken.toUpperCase() === upper) {
    return true;
  }

  // 2. Hash matches (raw, lowercase, or uppercase)
  const hashRaw = crypto.createHash('sha256').update(clean).digest('hex');
  const hashLower = crypto.createHash('sha256').update(lower).digest('hex');
  const hashUpper = crypto.createHash('sha256').update(upper).digest('hex');

  if (
    order.trackingTokenHash &&
    (order.trackingTokenHash === hashRaw ||
      order.trackingTokenHash === hashLower ||
      order.trackingTokenHash === hashUpper)
  ) {
    return true;
  }

  return false;
};

// Generate sequential readable order number: PC-YYYY-NNNN
const generateOrderNumber = async () => {
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear + 1, 0, 1);

  const count = await Order.countDocuments({
    createdAt: { $gte: startOfYear, $lt: endOfYear },
  });

  const nextSeq = count + 1;
  const paddedSeq = String(nextSeq).padStart(4, '0');
  return `PC-${currentYear}-${paddedSeq}`;
};

module.exports = {
  hashToken,
  generateTrackingToken,
  verifyToken,
  generateOrderNumber,
};
