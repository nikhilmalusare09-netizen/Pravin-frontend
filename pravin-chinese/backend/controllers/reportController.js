const Order = require('../models/Order');
const RestaurantTable = require('../models/RestaurantTable');
const Payment = require('../models/Payment');

// @desc    Get Admin Dashboard Key Statistics
// @route   GET /api/reports/dashboard
// @access  Private (Admin)
const getDashboardStats = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Orders counts
    const [
      totalOrdersToday,
      pendingOrders,
      approvedOrders,
      preparingOrders,
      completedOrders,
      totalOrdersAllTime,
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Order.countDocuments({ orderStatus: 'PENDING' }),
      Order.countDocuments({ orderStatus: 'APPROVED' }),
      Order.countDocuments({ orderStatus: 'PREPARING' }),
      Order.countDocuments({ orderStatus: 'COMPLETED' }),
      Order.countDocuments(),
    ]);

    // Today's Revenue
    const todayRevenueAgg = await Payment.aggregate([
      {
        $match: {
          paidAt: { $gte: todayStart, $lte: todayEnd },
          paymentStatus: 'PAID',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);
    const todayRevenue = todayRevenueAgg.length > 0 ? todayRevenueAgg[0].total : 0;

    // Total revenue all time
    const totalRevenueAgg = await Payment.aggregate([
      {
        $match: {
          paymentStatus: 'PAID',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);
    const totalRevenueAllTime = totalRevenueAgg.length > 0 ? totalRevenueAgg[0].total : 0;

    // Table statistics
    const [totalTables, occupiedTables, availableTables] = await Promise.all([
      RestaurantTable.countDocuments(),
      RestaurantTable.countDocuments({ status: 'OCCUPIED' }),
      RestaurantTable.countDocuments({ status: 'AVAILABLE' }),
    ]);

    // Top 5 Popular Dishes (aggregated from non-rejected orders)
    const popularDishes = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'REJECTED' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.dishNameSnapshot',
          count: { $sum: '$items.quantity' },
          totalSales: { $sum: '$items.itemTotal' },
          foodType: { $first: '$items.foodTypeSnapshot' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    // Last 7 days daily revenue for charts
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyRevenueRaw = await Payment.aggregate([
      {
        $match: {
          paidAt: { $gte: sevenDaysAgo },
          paymentStatus: 'PAID',
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format last 7 days chart array with 0 fills
    const dailyRevenueChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const match = dailyRevenueRaw.find((item) => item._id === dateStr);
      dailyRevenueChart.push({
        date: dateStr,
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        revenue: match ? match.revenue : 0,
        orders: match ? match.count : 0,
      });
    }

    res.json({
      success: true,
      stats: {
        totalOrdersToday,
        pendingOrders,
        approvedOrders,
        preparingOrders,
        completedOrders,
        todayRevenue,
        totalRevenueAllTime,
        totalOrdersAllTime,
        totalTables,
        occupiedTables,
        availableTables,
        popularDishes,
        dailyRevenueChart,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Detailed Sales and Category Analytics with date filters
// @route   GET /api/reports/sales
// @access  Private (Admin)
const getSalesReports = async (req, res, next) => {
  try {
    const { startDate, endDate, period = 'daily' } = req.query;

    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(new Date(startDate).setHours(0, 0, 0, 0));
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      dateFilter.$gte = thirtyDaysAgo;
    }

    if (endDate) {
      dateFilter.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    } else {
      dateFilter.$lte = new Date();
    }

    // Revenue aggregations by day
    const salesTimeline = await Payment.aggregate([
      {
        $match: {
          paidAt: dateFilter,
          paymentStatus: 'PAID',
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
          totalSales: { $sum: '$amount' },
          paymentsCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Payment methods breakdown
    const paymentMethodsBreakdown = await Payment.aggregate([
      {
        $match: {
          paidAt: dateFilter,
          paymentStatus: 'PAID',
        },
      },
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Most ordered dishes in this period
    const topDishes = await Order.aggregate([
      {
        $match: {
          createdAt: dateFilter,
          orderStatus: { $ne: 'REJECTED' },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.dishNameSnapshot',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.itemTotal' },
          foodType: { $first: '$items.foodTypeSnapshot' },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 15 },
    ]);

    // Veg vs Non-Veg vs Egg distribution
    const foodTypeDistribution = await Order.aggregate([
      {
        $match: {
          createdAt: dateFilter,
          orderStatus: { $ne: 'REJECTED' },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.foodTypeSnapshot',
          totalItems: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.itemTotal' },
        },
      },
    ]);

    // Total summary for this period
    const totalSalesSum = salesTimeline.reduce((acc, curr) => acc + curr.totalSales, 0);
    const totalTransactions = salesTimeline.reduce((acc, curr) => acc + curr.paymentsCount, 0);

    res.json({
      success: true,
      summary: {
        totalSales: totalSalesSum,
        totalTransactions,
        averageOrderValue: totalTransactions > 0 ? Math.round(totalSalesSum / totalTransactions) : 0,
      },
      salesTimeline,
      paymentMethodsBreakdown,
      topDishes,
      foodTypeDistribution,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getSalesReports,
};
