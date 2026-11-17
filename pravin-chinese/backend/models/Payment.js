const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    tableSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TableSession',
    },
    orderNumber: {
      type: String,
    },
    tableNumber: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD', 'ONLINE'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID'],
      default: 'PAID',
    },
    transactionReference: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    receivedBy: {
      type: String,
      default: 'Admin',
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', PaymentSchema);
