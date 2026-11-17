const Order = require('../models/Order');
const TableSession = require('../models/TableSession');
const RestaurantTable = require('../models/RestaurantTable');
const Payment = require('../models/Payment');
const { emitBillUpdate, emitTableUpdate } = require('../socket');

// @desc    Get all bills / payment records
// @route   GET /api/billing
// @access  Private (Admin)
const getBills = async (req, res, next) => {
  try {
    const { status, paymentMethod, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status && status !== 'ALL') {
      query.paymentStatus = status.toUpperCase();
    }

    if (paymentMethod && paymentMethod !== 'ALL') {
      query.paymentMethod = paymentMethod.toUpperCase();
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('orderId', 'orderNumber orderStatus items subtotal tax totalAmount customerName customerPhone');

    res.json({
      success: true,
      total,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed bill for an order (or session)
// @route   GET /api/billing/:orderId
// @access  Public (if order verified) or Admin
const getBillByOrderId = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('tableId')
      .populate('tableSessionId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order bill not found',
      });
    }

    // Check if table has running session with multiple orders
    let sessionOrders = [order];
    let runningGrandTotal = order.totalAmount;
    let runningSubtotal = order.subtotal;
    let runningTax = order.tax;

    if (order.tableSessionId) {
      const session = await TableSession.findById(order.tableSessionId).populate('orders');
      if (session && session.orders && session.orders.length > 0) {
        sessionOrders = session.orders.filter((o) => o.orderStatus !== 'REJECTED');
        runningSubtotal = sessionOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
        runningTax = sessionOrders.reduce((sum, o) => sum + (o.tax || 0), 0);
        runningGrandTotal = sessionOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      }
    }

    const paymentRecord = await Payment.findOne({ orderId: order._id }).sort({ createdAt: -1 });

    const billData = {
      restaurantName: 'PRAVIN CHINESE',
      address: 'Shop No. 4, Food Court Lane, Main Market, Mumbai',
      contact: '+91 98765 43210',
      gstin: '27AABCP1234F1Z8',
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      customerName: order.customerName || 'Dine-in Guest',
      customerPhone: order.customerPhone || '',
      orderDate: order.createdAt,
      items: order.items,
      subtotal: order.subtotal,
      tax: order.tax,
      totalAmount: order.totalAmount,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: paymentRecord ? paymentRecord.paymentMethod : (order.paymentStatus === 'PAID' ? 'CASH' : 'PENDING'),
      paidAt: paymentRecord ? paymentRecord.paidAt : (order.paymentStatus === 'PAID' ? order.updatedAt : null),
      transactionReference: paymentRecord ? paymentRecord.transactionReference : '',
      // Running session context if table has multiple orders
      session: {
        totalOrders: sessionOrders.length,
        runningSubtotal,
        runningTax,
        runningGrandTotal,
      },
    };

    res.json({
      success: true,
      bill: billData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get running bill for a specific table
// @route   GET /api/billing/table/:tableId
// @access  Private (Admin)
const getTableRunningBill = async (req, res, next) => {
  try {
    const table = await RestaurantTable.findById(req.params.tableId);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    if (!table.activeSessionId) {
      return res.json({
        success: true,
        hasActiveSession: false,
        message: 'Table currently has no active session or running bill.',
        tableNumber: table.tableNumber,
      });
    }

    const session = await TableSession.findById(table.activeSessionId).populate('orders');
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Active session not found',
      });
    }

    const validOrders = session.orders.filter((o) => o.orderStatus !== 'REJECTED');
    const aggregatedItems = [];
    let subtotal = 0;
    let tax = 0;
    let grandTotal = 0;

    validOrders.forEach((ord) => {
      subtotal += ord.subtotal || 0;
      tax += ord.tax || 0;
      grandTotal += ord.totalAmount || 0;
      ord.items.forEach((it) => {
        aggregatedItems.push({
          dishName: it.dishNameSnapshot,
          quantity: it.quantity,
          unitPrice: it.unitPriceSnapshot,
          itemTotal: it.itemTotal,
          orderNumber: ord.orderNumber,
        });
      });
    });

    res.json({
      success: true,
      hasActiveSession: true,
      session: {
        sessionId: session._id,
        tableNumber: table.tableNumber,
        tableId: table._id,
        openedAt: session.openedAt,
        paymentStatus: session.paymentStatus,
        ordersCount: validOrders.length,
        items: aggregatedItems,
        subtotal,
        tax,
        grandTotal,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record payment for an order or session
// @route   POST /api/billing/:orderId/payment
// @access  Private (Admin)
const recordPayment = async (req, res, next) => {
  try {
    const { paymentMethod, amount, transactionReference, notes, settleSession } = req.body;

    if (!paymentMethod || !['CASH', 'UPI', 'CARD'].includes(paymentMethod.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment method (CASH, UPI, CARD) is required',
      });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const paidAmount = amount !== undefined ? Number(amount) : order.totalAmount;

    // Create payment entry
    const payment = await Payment.create({
      orderId: order._id,
      tableSessionId: order.tableSessionId,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      amount: paidAmount,
      paymentMethod: paymentMethod.toUpperCase(),
      paymentStatus: 'PAID',
      transactionReference: transactionReference || '',
      notes: notes || '',
      receivedBy: req.admin ? req.admin.name : 'Admin',
    });

    // Mark order as paid
    order.paymentStatus = 'PAID';
    await order.save();

    // If settleSession is requested or table has session, mark session as paid if all orders settled
    if (order.tableSessionId) {
      const session = await TableSession.findById(order.tableSessionId).populate('orders');
      if (session) {
        if (settleSession) {
          session.paymentStatus = 'PAID';
          await Promise.all(
            session.orders.map(async (ord) => {
              ord.paymentStatus = 'PAID';
              return ord.save();
            })
          );
        } else {
          const allOrdersPaid = session.orders
            .filter((o) => o.orderStatus !== 'REJECTED')
            .every((o) => o.paymentStatus === 'PAID');
          if (allOrdersPaid) {
            session.paymentStatus = 'PAID';
          }
        }
        await session.save();
      }
    }

    emitBillUpdate({
      orderId: order._id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      paymentStatus: 'PAID',
      paymentMethod: payment.paymentMethod,
      amount: payment.amount,
    });

    res.json({
      success: true,
      message: `Payment of ₹${paidAmount} recorded successfully via ${paymentMethod.toUpperCase()}`,
      payment,
      order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBills,
  getBillByOrderId,
  getTableRunningBill,
  recordPayment,
};
