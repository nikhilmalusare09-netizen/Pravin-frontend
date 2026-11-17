const mongoose = require('mongoose');

const DishSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide dish name'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide price in INR'],
      min: [0, 'Price must be positive'],
    },
    imageUrl: {
      type: String,
      default: '',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    categoryName: {
      type: String,
      required: true,
      trim: true,
    },
    foodType: {
      type: String,
      enum: ['VEG', 'NON_VEG', 'EGG'],
      required: [true, 'Please specify food type (VEG, NON_VEG, or EGG)'],
      default: 'VEG',
    },
    availability: {
      type: String,
      enum: ['AVAILABLE', 'OUT_OF_STOCK'],
      default: 'AVAILABLE',
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    spiceLevel: {
      type: String,
      enum: ['Mild', 'Medium', 'Hot', 'Extra Hot'],
      default: 'Medium',
    },
  },
  { timestamps: true }
);

DishSchema.index({ name: 'text', description: 'text' });
DishSchema.index({ categoryName: 1, foodType: 1, availability: 1 });

module.exports = mongoose.model('Dish', DishSchema);
