import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  IndianRupee,
  Clock,
  CheckCircle2,
  Armchair,
  Flame,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  ChefHat,
} from 'lucide-react';
import api from '../../services/api';
import { socket } from '../../services/socket';
import LoadingSpinner from '../../components/LoadingSpinner';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get('/reports/dashboard');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Listen to live socket events to update dashboard in real-time
    const handleRefresh = () => fetchStats();
    socket.on('order:new', handleRefresh);
    socket.on('order:status_updated', handleRefresh);
    socket.on('bill:updated', handleRefresh);
    socket.on('table:updated', handleRefresh);

    return () => {
      socket.off('order:new', handleRefresh);
      socket.off('order:status_updated', handleRefresh);
      socket.off('bill:updated', handleRefresh);
      socket.off('table:updated', handleRefresh);
    };
  }, []);

  if (loading) {
    return <LoadingSpinner text="Aggregating live restaurant metrics..." />;
  }

  // Calculate highest revenue in 7 days for bar chart scale
  const maxRevenue = Math.max(...(stats?.dailyRevenueChart?.map((d) => d.revenue) || [1000]), 1000);

  return (
    <div className="space-y-8">
      
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-brand-orange">
            Live Kitchen & Sales POS
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-0.5">
            Pravin Chinese Operational Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time orders, table status and revenue tracking from MongoDB.
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors self-end sm:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* STATS OVERVIEW CARDS (Section 6) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Today's Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Today's Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700">
            ₹{stats?.todayRevenue || 0}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            All-time: ₹{stats?.totalRevenueAllTime || 0}
          </p>
        </div>

        {/* Total Orders Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Today's Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            {stats?.totalOrdersToday || 0}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            Total Orders: {stats?.totalOrdersAllTime || 0}
          </p>
        </div>

        {/* Pending & Kitchen Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              In Kitchen
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <ChefHat className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-brand-orange">
              {stats?.preparingOrders || 0}
            </span>
            <span className="text-xs font-bold text-slate-400">preparing</span>
          </div>
          <p className="text-[11px] text-amber-700 font-bold">
            {stats?.pendingOrders || 0} pending approval
          </p>
        </div>

        {/* Dining Tables Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tables Status
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Armchair className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats?.occupiedTables || 0}
            </span>
            <span className="text-xs font-bold text-slate-400">/ {stats?.totalTables || 10}</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-bold">
            {stats?.availableTables || 0} available tables
          </p>
        </div>

      </div>

      {/* SECONDARY ROW: ORDER STATUS BREAKDOWN PILLS */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Order Pipeline Snapshot
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/admin/orders?status=PENDING"
            className="p-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-amber-900">Pending Orders</p>
              <p className="text-lg font-black text-amber-800">{stats?.pendingOrders || 0}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-600" />
          </Link>

          <Link
            to="/admin/orders?status=APPROVED"
            className="p-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-blue-900">Approved</p>
              <p className="text-lg font-black text-blue-800">{stats?.approvedOrders || 0}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </Link>

          <Link
            to="/admin/orders?status=PREPARING"
            className="p-3.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-orange-900">Preparing</p>
              <p className="text-lg font-black text-orange-800">{stats?.preparingOrders || 0}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-orange-600" />
          </Link>

          <Link
            to="/admin/orders?status=COMPLETED"
            className="p-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-emerald-900">Completed</p>
              <p className="text-lg font-black text-emerald-800">{stats?.completedOrders || 0}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-600" />
          </Link>
        </div>
      </div>

      {/* CHARTS GRID (Section 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Daily Revenue Bar Chart (Last 7 Days) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-orange" />
              <span>Daily Revenue Trend (Last 7 Days)</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">From MongoDB</span>
          </div>

          <div className="h-60 flex items-end justify-between gap-2 pt-8 pb-2 border-b border-slate-100">
            {stats?.dailyRevenueChart?.map((day) => {
              const heightPercent = maxRevenue > 0 ? Math.round((day.revenue / maxRevenue) * 100) : 0;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                    ₹{day.revenue} ({day.orders} orders)
                  </div>

                  <div className="w-full max-w-[36px] bg-slate-100 rounded-t-lg h-44 flex items-end">
                    <div
                      style={{ height: `${Math.max(heightPercent, 6)}%` }}
                      className="w-full bg-gradient-to-t from-brand-red to-brand-orange rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                    />
                  </div>

                  <span className="text-[10px] text-slate-500 font-semibold truncate max-w-[42px]">
                    {day.label.split(',')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span>Hover bars for revenue breakdown</span>
            <Link to="/admin/reports" className="font-bold text-brand-red hover:underline">
              Detailed Sales Reports →
            </Link>
          </div>
        </div>

        {/* Top Popular Dishes */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-brand-orange fill-brand-orange" />
              <span>Popular Dishes</span>
            </h3>
            <Link to="/admin/menu" className="text-xs font-bold text-brand-red hover:underline">
              Manage Menu →
            </Link>
          </div>

          {stats?.popularDishes?.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No orders recorded yet to rank dishes.
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.popularDishes?.map((dish, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-tight">
                        {dish._id}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {dish.foodType} • {dish.count} orders
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-brand-red">
                    ₹{dish.totalSales}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
