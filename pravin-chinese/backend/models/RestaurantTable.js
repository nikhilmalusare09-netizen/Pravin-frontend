const mongoose = require('mongoose');

const RestaurantTableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: String,
      required: [true, 'Please provide table number/name'],
      unique: true,
      trim: true,
    },
    capacity: {
      type: Number,
      default: 4,
      min: 1,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED'],
      default: 'AVAILABLE',
    },
    activeSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TableSession',
      default: null,
    },
    qrCodeUrl: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RestaurantTable', RestaurantTableSchema);
