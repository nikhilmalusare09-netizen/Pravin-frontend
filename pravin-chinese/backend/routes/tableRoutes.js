const express = require('express');
const router = express.Router();
const {
  getTables,
  createTable,
  updateTable,
  deleteTable,
  releaseTable,
} = require('../controllers/tableController');
const { protectAdmin } = require('../middleware/auth');

// Public can view tables to select available ones for ordering
router.get('/', getTables);

// Admin operations
router.post('/', protectAdmin, createTable);
router.put('/:id', protectAdmin, updateTable);
router.delete('/:id', protectAdmin, deleteTable);
router.post('/:id/release', protectAdmin, releaseTable);

module.exports = router;
