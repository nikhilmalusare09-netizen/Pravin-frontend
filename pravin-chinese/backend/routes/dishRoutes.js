const express = require('express');
const router = express.Router();
const {
  getDishes,
  getDishById,
  createDish,
  updateDish,
  deleteDish,
} = require('../controllers/dishController');
const { protectAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.get('/', getDishes);
router.get('/:id', getDishById);
router.post('/', protectAdmin, upload.single('image'), createDish);
router.put('/:id', protectAdmin, upload.single('image'), updateDish);
router.delete('/:id', protectAdmin, deleteDish);

module.exports = router;
