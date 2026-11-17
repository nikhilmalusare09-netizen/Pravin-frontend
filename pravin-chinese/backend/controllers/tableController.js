const RestaurantTable = require('../models/RestaurantTable');
const TableSession = require('../models/TableSession');
const Order = require('../models/Order');
const { emitTableUpdate } = require('../socket');

// @desc    Get all tables with session & active orders info
// @route   GET /api/tables
// @access  Public (for table selection) & Private (Admin)
const getTables = async (req, res, next) => {
  try {
    const tables = await RestaurantTable.find()
      .collation({ locale: 'en', numericOrdering: true })
      .sort({ tableNumber: 1 })
      .populate({
        path: 'activeSessionId',
        populate: {
          path: 'orders',
          select: 'orderNumber totalAmount orderStatus paymentStatus items createdAt',
        },
      });

    // Ensure strict natural numerical sorting (Table 1, Table 2 ... Table 9, Table 10)
    tables.sort((a, b) =>
      a.tableNumber.localeCompare(b.tableNumber, undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    );

    res.json({
      success: true,
      count: tables.length,
      tables,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new table
// @route   POST /api/tables
// @access  Private (Admin)
const createTable = async (req, res, next) => {
  try {
    const { tableNumber, capacity } = req.body;

    if (!tableNumber) {
      return res.status(400).json({
        success: false,
        message: 'Table number is required',
      });
    }

    const existing = await RestaurantTable.findOne({ tableNumber: tableNumber.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Table with this number already exists',
      });
    }

    const table = await RestaurantTable.create({
      tableNumber: tableNumber.trim(),
      capacity: capacity ? Number(capacity) : 4,
      status: 'AVAILABLE',
    });

    emitTableUpdate(table);

    res.status(201).json({
      success: true,
      message: 'Table created successfully',
      table,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a table
// @route   PUT /api/tables/:id
// @access  Private (Admin)
const updateTable = async (req, res, next) => {
  try {
    const table = await RestaurantTable.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    emitTableUpdate(table);

    res.json({
      success: true,
      message: 'Table updated successfully',
      table,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a table
// @route   DELETE /api/tables/:id
// @access  Private (Admin)
const deleteTable = async (req, res, next) => {
  try {
    const table = await RestaurantTable.findById(req.params.id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    if (table.status === 'OCCUPIED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an occupied table. Complete or release the active session first.',
      });
    }

    await RestaurantTable.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Table deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Release an occupied table (checks for active orders & unpaid bills)
// @route   POST /api/tables/:id/release
// @access  Private (Admin)
const releaseTable = async (req, res, next) => {
  try {
    const table = await RestaurantTable.findById(req.params.id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    if (table.status === 'AVAILABLE') {
      return res.status(400).json({
        success: false,
        message: 'Table is already available',
      });
    }

    // Check if table has active session
    if (table.activeSessionId) {
      const session = await TableSession.findById(table.activeSessionId).populate('orders');

      if (session) {
        // Check for active (in-progress) orders
        const activeOrders = session.orders.filter((ord) =>
          ['PENDING', 'APPROVED', 'PREPARING', 'READY', 'SERVED'].includes(ord.orderStatus)
        );

        if (activeOrders.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Cannot release table: Has ${activeOrders.length} active order(s) still in preparation or service.`,
          });
        }

        // Check for unpaid bills
        if (session.paymentStatus !== 'PAID') {
          return res.status(400).json({
            success: false,
            message: 'Cannot release table: Running bill has not been settled/paid yet.',
          });
        }

        // Close the session
        session.sessionStatus = 'CLOSED';
        session.closedAt = new Date();
        await session.save();
      }
    }

    table.status = 'AVAILABLE';
    table.activeSessionId = null;
    await table.save();

    emitTableUpdate(table);

    res.json({
      success: true,
      message: `${table.tableNumber} has been successfully released and is now Available.`,
      table,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTables,
  createTable,
  updateTable,
  deleteTable,
  releaseTable,
};
