const Dish = require('../models/Dish');
const Category = require('../models/Category');
const { uploadImage } = require('../middleware/upload');

// @desc    Get all dishes with optional filters
// @route   GET /api/dishes
// @access  Public
const getDishes = async (req, res, next) => {
  try {
    const { category, foodType, search, availability, popularOnly } = req.query;
    const query = {};

    if (category && category !== 'ALL') {
      // Find category by ID or name
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        query.categoryName = { $regex: new RegExp(`^${category}$`, 'i') };
      }
    }

    if (foodType && foodType !== 'ALL') {
      query.foodType = foodType.toUpperCase();
    }

    if (availability) {
      query.availability = availability.toUpperCase();
    }

    if (popularOnly === 'true') {
      query.isPopular = true;
    }

    if (search && search.trim() !== '') {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { categoryName: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const dishes = await Dish.find(query).sort({ categoryName: 1, name: 1 });

    res.json({
      success: true,
      count: dishes.length,
      dishes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single dish by ID
// @route   GET /api/dishes/:id
// @access  Public
const getDishById = async (req, res, next) => {
  try {
    const dish = await Dish.findById(req.params.id);
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found',
      });
    }
    res.json({
      success: true,
      dish,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new dish
// @route   POST /api/dishes
// @access  Private (Admin)
const createDish = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      categoryName,
      categoryId,
      foodType,
      availability,
      isPopular,
      spiceLevel,
    } = req.body;

    if (!name || price === undefined || !foodType) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and foodType are required',
      });
    }

    // Resolve category
    let finalCategoryName = categoryName;
    let finalCategoryId = categoryId;

    if (!finalCategoryName && finalCategoryId) {
      const cat = await Category.findById(finalCategoryId);
      if (cat) finalCategoryName = cat.name;
    } else if (finalCategoryName && !finalCategoryId) {
      const cat = await Category.findOne({ name: finalCategoryName });
      if (cat) finalCategoryId = cat._id;
    }

    if (!finalCategoryName) {
      finalCategoryName = 'Starters';
    }

    let imageUrl = req.body.imageUrl || '';
    if (req.file) {
      imageUrl = await uploadImage(req.file.path);
    }

    const dish = await Dish.create({
      name: name.trim(),
      description: description || '',
      price: Number(price),
      imageUrl,
      category: finalCategoryId,
      categoryName: finalCategoryName,
      foodType: foodType.toUpperCase(),
      availability: availability || 'AVAILABLE',
      isPopular: isPopular === true || isPopular === 'true',
      spiceLevel: spiceLevel || 'Medium',
    });

    res.status(201).json({
      success: true,
      message: 'Dish created successfully',
      dish,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update dish
// @route   PUT /api/dishes/:id
// @access  Private (Admin)
const updateDish = async (req, res, next) => {
  try {
    let dish = await Dish.findById(req.params.id);
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found',
      });
    }

    const updateData = { ...req.body };

    if (req.file) {
      updateData.imageUrl = await uploadImage(req.file.path);
    }

    if (updateData.price !== undefined) {
      updateData.price = Number(updateData.price);
    }

    if (updateData.isPopular !== undefined) {
      updateData.isPopular = updateData.isPopular === true || updateData.isPopular === 'true';
    }

    if (updateData.categoryName && !updateData.category) {
      const cat = await Category.findOne({ name: updateData.categoryName });
      if (cat) updateData.category = cat._id;
    }

    dish = await Dish.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Dish updated successfully',
      dish,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete dish
// @route   DELETE /api/dishes/:id
// @access  Private (Admin)
const deleteDish = async (req, res, next) => {
  try {
    const dish = await Dish.findById(req.params.id);
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found',
      });
    }

    await Dish.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Dish deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDishes,
  getDishById,
  createDish,
  updateDish,
  deleteDish,
};
