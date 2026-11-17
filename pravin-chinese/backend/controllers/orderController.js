const Order = require('../models/Order');
const Dish = require('../models/Dish');
const RestaurantTable = require('../models/RestaurantTable');
const TableSession = require('../models/TableSession');
const Payment = require('../models/Payment');
const { hashToken, generateTrackingToken, verifyToken, generateOrderNumber } = require('../utils/token');
const { emitNewOrder, emitOrderStatusUpdate, emitTableUpdate, emitBillUpdate } = require('../socket');

// @desc    Place a new customer order
// @route   POST /api/orders
// @access  Public
const placeOrder = async (req, res, next) => {
  try {
    const { tableId, items, customerNotes, customerName, customerPhone } = req.body;

    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Table ID and order items are required',
      });
    }

    // 1. Verify Table and handle concurrency / sessions
    const table = await RestaurantTable.findById(tableId);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Selected table was not found',
      });
    }

    // Check / create Table Session
    let session = null;
    if (table.activeSessionId) {
      session = await TableSession.findById(table.activeSessionId);
    }

    if (!session || session.sessionStatus === 'CLOSED') {
      // Concurrency check: If table is marked OCCUPIED but has no active session, or another customer just took it
      if (table.status === 'OCCUPIED' && !session) {
        return res.status(409).json({
          success: false,
          message: `${table.tableNumber} is currently occupied. Please select an available table.`,
        });
      }

      // Create new active session
      session = await TableSession.create({
        tableId: table._id,
        tableNumber: table.tableNumber,
        sessionStatus: 'ACTIVE',
        orders: [],
        totalAmount: 0,
        paymentStatus: 'PENDING',
      });

      table.status = 'OCCUPIED';
      table.activeSessionId = session._id;
      await table.save();
      emitTableUpdate(table);
    }

    // 2. Fetch dishes from DB and calculate prices strictly on backend
    const dishIds = items.map((i) => i.dishId);
    const dbDishes = await Dish.find({ _id: { $in: dishIds } });
    const dishMap = new Map();
    dbDishes.forEach((d) => dishMap.set(d._id.toString(), d));

    let subtotal = 0;
    const validatedOrderItems = [];

    for (const item of items) {
      const dbDish = dishMap.get(item.dishId?.toString());
      if (!dbDish) {
        return res.status(400).json({
          success: false,
          message: `Dish with ID ${item.dishId} does not exist.`,
        });
      }

      if (dbDish.availability === 'OUT_OF_STOCK') {
        return res.status(400).json({
          success: false,
          message: `"${dbDish.name}" is currently Out of Stock. Please remove it from your cart to proceed.`,
        });
      }

      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const unitPrice = dbDish.price;
      const itemTotal = unitPrice * qty;

      subtotal += itemTotal;

      validatedOrderItems.push({
        dishId: dbDish._id,
        dishNameSnapshot: dbDish.name,
        unitPriceSnapshot: unitPrice,
        quantity: qty,
        itemTotal: itemTotal,
        foodTypeSnapshot: dbDish.foodType,
      });
    }

    // 5% GST tax calculation (standard Indian restaurant tax)
    const taxRate = parseFloat(process.env.TAX_RATE || '0.05');
    const tax = Math.round(subtotal * taxRate);
    const totalAmount = subtotal + tax;

    // 3. Generate Order Number & Secure Tracking Token
    const orderNumber = await generateOrderNumber();
    const rawTrackingToken = generateTrackingToken();
    const trackingTokenHash = hashToken(rawTrackingToken);

    // 4. Save Order
    const order = await Order.create({
      orderNumber,
      trackingToken: rawTrackingToken,
      trackingTokenHash,
      customerName: customerName && String(customerName).trim() ? String(customerName).trim() : 'Dine-in Guest',
      customerPhone: customerPhone ? String(customerPhone).trim() : '',
      tableId: table._id,
      tableNumber: table.tableNumber,
      tableSessionId: session._id,
      items: validatedOrderItems,
      customerNotes: customerNotes ? customerNotes.trim() : '',
      subtotal,
      tax,
      totalAmount,
      orderStatus: 'PENDING',
      paymentStatus: 'PENDING',
      statusHistory: [
        {
          status: 'PENDING',
          timestamp: new Date(),
          note: 'Order placed by customer and waiting for restaurant approval.',
        },
      ],
    });

    // 5. Update session running total and order list
    session.orders.push(order._id);
    session.totalAmount += totalAmount;
    await session.save();

    // 6. Notify Admin via Socket.IO
    emitNewOrder(order);

    res.status(201).json({
      success: true,
      message: 'Your order has been placed successfully!',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        tableNumber: order.tableNumber,
        totalAmount: order.totalAmount,
        subtotal: order.subtotal,
        tax: order.tax,
        itemsCount: order.items.length,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
      },
      trackingToken: rawTrackingToken,
      trackingUrl: `/track/${order.orderNumber}?token=${rawTrackingToken}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Track order using Order Number and private tracking token
// @route   POST /api/orders/track
// @access  Public (secure token verified)
const trackOrder = async (req, res, next) => {
  try {
    const { orderNumber, trackingToken } = req.body;

    // Error handling - Missing fields
    if (!orderNumber || !String(orderNumber).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your Order Number.',
      });
    }

    const order = await Order.findOne({
      orderNumber: orderNumber.trim().toUpperCase(),
    }).populate('tableId', 'tableNumber capacity');

    // Error handling - Invalid order number
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // If trackingToken is provided, verify it
    if (trackingToken && String(trackingToken).trim()) {
      const isValidToken = verifyToken(trackingToken, order);
      if (!isValidToken) {
        return res.status(401).json({
          success: false,
          message: 'Invalid tracking token. Please check and try again.',
        });
      }
    }

    res.json({
      success: true,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderDate: order.createdAt,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        customerName: order.customerName || 'Dine-in Guest',
        customerPhone: order.customerPhone || '',
        tableNumber: order.tableNumber,
        items: order.items,
        subtotal: order.subtotal,
        tax: order.tax,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        customerNotes: order.customerNotes,
        statusHistory: order.statusHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders with filters
// @route   GET /api/orders
// @access  Private (Admin)
const getOrders = async (req, res, next) => {
  try {
    const { status, tableNumber, date, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status && status !== 'ALL') {
      query.orderStatus = status.toUpperCase();
    }

    if (tableNumber) {
      query.tableNumber = tableNumber;
    }

    if (date) {
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search.trim(), $options: 'i' } },
        { tableNumber: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private (Admin)
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('tableId')
      .populate('tableSessionId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (Admin workflow)
// @route   PATCH /api/orders/:id/status
// @access  Private (Admin)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const allowedStatuses = [
      'PENDING',
      'APPROVED',
      'PREPARING',
      'READY',
      'SERVED',
      'COMPLETED',
      'REJECTED',
    ];

    if (!status || !allowedStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const newStatus = status.toUpperCase();
    const oldStatus = order.orderStatus;
    order.orderStatus = newStatus;

    order.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      note: note || `Order status updated from ${oldStatus} to ${newStatus} by staff.`,
    });

    await order.save();

    // If order was completed, record payment if needed and release table so it is ready to book
    if (newStatus === 'COMPLETED') {
      const method = (req.body.paymentMethod || 'CASH').toUpperCase();
      const normMethod = method === 'ONLINE' ? 'UPI' : method;

      if (order.paymentStatus !== 'PAID') {
        await Payment.create({
          orderId: order._id,
          tableSessionId: order.tableSessionId,
          orderNumber: order.orderNumber,
          tableNumber: order.tableNumber,
          amount: order.totalAmount,
          paymentMethod: normMethod,
          paymentStatus: 'PAID',
          receivedBy: req.admin ? req.admin.name : 'Staff POS',
          notes: 'Completed & settled by staff',
        });
        order.paymentStatus = 'PAID';
        await order.save();
      }

      // Check if any other active orders exist on this table session
      const session = await TableSession.findById(order.tableSessionId).populate('orders');
      let shouldRelease = true;
      if (session) {
        const otherActive = session.orders.filter(
          (o) => o._id.toString() !== order._id.toString() && !['REJECTED', 'COMPLETED'].includes(o.orderStatus)
        );
        if (otherActive.length > 0) {
          shouldRelease = false;
        } else {
          session.paymentStatus = 'PAID';
          session.sessionStatus = 'CLOSED';
          session.closedAt = new Date();
          await session.save();
        }
      }

      if (shouldRelease) {
        const table = await RestaurantTable.findById(order.tableId);
        if (table && table.status === 'OCCUPIED') {
          table.status = 'AVAILABLE';
          table.activeSessionId = null;
          await table.save();
          emitTableUpdate(table);
        }
      }

      emitBillUpdate({
        orderId: order._id,
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        paymentStatus: 'PAID',
        paymentMethod: normMethod,
        amount: order.totalAmount,
      });
    }

    // If order was rejected, check if table can be released
    if (newStatus === 'REJECTED') {
      const session = await TableSession.findById(order.tableSessionId).populate('orders');
      if (session) {
        const remainingActiveOrders = session.orders.filter(
          (o) => o._id.toString() !== order._id.toString() && !['REJECTED', 'COMPLETED'].includes(o.orderStatus)
        );

        if (remainingActiveOrders.length === 0) {
          // Release table
          const table = await RestaurantTable.findById(order.tableId);
          if (table && table.status === 'OCCUPIED') {
            table.status = 'AVAILABLE';
            table.activeSessionId = null;
            await table.save();
            session.sessionStatus = 'CLOSED';
            session.closedAt = new Date();
            await session.save();
            emitTableUpdate(table);
          }
        }
      }
    }

    // Emit live status update to both customer and admin
    emitOrderStatusUpdate(order);

    res.json({
      success: true,
      message: `Order status updated to ${newStatus}`,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Customer or Admin chooses payment method (Cash or Online) and completes order, freeing the table
// @route   POST /api/orders/settle
// @access  Public (verified by tracking token or Admin auth)
const settleAndCompleteOrder = async (req, res, next) => {
  try {
    const { orderNumber, trackingToken, paymentMethod, transactionReference } = req.body;

    if (!orderNumber || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Order number and payment method (Cash or Online/UPI) are required',
      });
    }

    const order = await Order.findOne({
      orderNumber: orderNumber.trim().toUpperCase(),
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // If customer request and tracking token provided, verify it
    if (!req.admin && trackingToken) {
      const isValid = verifyToken(trackingToken, order);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid tracking token. Please check and try again.',
        });
      }
    }

    const normMethod =
      paymentMethod.toUpperCase() === 'ONLINE' ? 'UPI' : paymentMethod.toUpperCase();

    // 1. Record payment
    const payment = await Payment.create({
      orderId: order._id,
      tableSessionId: order.tableSessionId,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      amount: order.totalAmount,
      paymentMethod: normMethod,
      paymentStatus: 'PAID',
      transactionReference: transactionReference || (paymentMethod === 'ONLINE' ? 'UPI-ONLINE-PAID' : 'CASH-SETTLED'),
      notes: `Settled via ${paymentMethod} payment`,
      receivedBy: req.admin ? req.admin.name : `Customer Self-Checkout (${paymentMethod})`,
    });

    // 2. Update order
    order.paymentStatus = 'PAID';
    order.orderStatus = 'COMPLETED';
    order.statusHistory.push({
      status: 'COMPLETED',
      timestamp: new Date(),
      note: `Payment completed via ${paymentMethod} (₹${order.totalAmount}). Dining session finished and table released.`,
    });
    await order.save();

    // 3. Release table so it is immediately ready to book from admin or customer side!
    const table = await RestaurantTable.findById(order.tableId);
    if (table) {
      table.status = 'AVAILABLE';
      table.activeSessionId = null;
      await table.save();
      emitTableUpdate(table);
    }

    // 4. Close table session
    if (order.tableSessionId) {
      const session = await TableSession.findById(order.tableSessionId);
      if (session) {
        session.paymentStatus = 'PAID';
        session.sessionStatus = 'CLOSED';
        session.closedAt = new Date();
        await session.save();
      }
    }

    // 5. Emit real-time socket events
    emitOrderStatusUpdate(order);
    emitBillUpdate({
      orderId: order._id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      paymentStatus: 'PAID',
      paymentMethod: normMethod,
      amount: order.totalAmount,
    });

    res.json({
      success: true,
      message: `Order ${order.orderNumber} successfully completed via ${paymentMethod}! ${order.tableNumber} is now ready to book.`,
      order,
      payment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  placeOrder,
  trackOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  settleAndCompleteOrder,
};
