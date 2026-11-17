const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema(
  {
    dishId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dish',
      required: true,
    },
    dishNameSnapshot: {
      type: String,
      required: true,
    },
    unitPriceSnapshot: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    itemTotal: {
      type: Number,
      required: true,
    },
    foodTypeSnapshot: {
      type: String,
      enum: ['VEG', 'NON_VEG', 'EGG'],
      default: 'VEG',
    },
  },
  { _id: true }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    trackingTokenHash: {
      type: String,
      required: true,
      index: true,
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RestaurantTable',
      required: true,
    },
    tableNumber: {
      type: String,
      required: true,
    },
    tableSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TableSession',
    },
    items: {
      type: [OrderItemSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Order must have at least one dish',
      },
    },
    customerName: {
      type: String,
      trim: true,
      default: 'Dine-in Guest',
    },
    customerPhone: {
      type: String,
      trim: true,
      default: '',
    },
    trackingToken: {
      type: String,
      trim: true,
    },
    customerNotes: {
      type: String,
      default: '',
    },
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    orderStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID'],
      default: 'PENDING',
      index: true,
    },
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
          default: '',
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);
