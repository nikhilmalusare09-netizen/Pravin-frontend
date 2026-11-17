import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  PieChart,
  Filter,
} from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const Reports = () => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/sales', {
        params: { startDate, endDate },
      });
      if (res.data.success) {
        setReports(res.data);
      }
    } catch (err) {
      console.error('Error fetching sales reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  return (
    <div className="space-y-6">
      
      {/* Header & Date Range Filter */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Sales & Operational Reports
          </h1>
          <p className="text-xs text-slate-500">
            Analytics on daily revenue, payment methods, dish popularity and item types.
          </p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-400 font-bold">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-400 font-bold">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Computing MongoDB aggregation reports..." />
      ) : (
        <div className="space-y-6">
          
          {/* Key Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Period Revenue
              </span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-700">
                ₹{reports?.summary?.totalSales || 0}
              </p>
              <p className="text-xs text-slate-500">
                Total paid settlements
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Transactions Count
              </span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">
                {reports?.summary?.totalTransactions || 0}
              </p>
              <p className="text-xs text-slate-500">
                Settled orders
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Average Order Value
              </span>
              <p className="text-2xl sm:text-3xl font-black text-brand-orange">
                ₹{reports?.summary?.averageOrderValue || 0}
              </p>
              <p className="text-xs text-slate-500">
                Per table dining session
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Sales Timeline Table / List */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-orange" />
                <span>Daily Sales Trend</span>
              </h3>

              {reports?.salesTimeline?.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">
                  No sales recorded in this date range.
                </p>
              ) : (
                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px]">
                        <th className="py-2">Date</th>
                        <th className="py-2 text-center">Payments</th>
                        <th className="py-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reports?.salesTimeline?.map((item) => (
                        <tr key={item._id} className="hover:bg-slate-50">
                          <td className="py-2 font-mono font-medium text-slate-800">{item._id}</td>
                          <td className="py-2 text-center font-bold text-slate-600">{item.paymentsCount}</td>
                          <td className="py-2 text-right font-black text-emerald-700">₹{item.totalSales}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Payment Methods Breakdown */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-brand-orange" />
                <span>Payment Mode Distribution</span>
              </h3>

              <div className="space-y-3 pt-2">
                {reports?.paymentMethodsBreakdown?.map((method) => {
                  const percent = reports.summary.totalSales > 0
                    ? Math.round((method.totalAmount / reports.summary.totalSales) * 100)
                    : 0;

                  return (
                    <div key={method._id} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-800">{method._id}</span>
                        <span className="text-slate-600">₹{method.totalAmount} ({percent}%)</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className={`h-full rounded-full ${
                            method._id === 'UPI'
                              ? 'bg-blue-600'
                              : method._id === 'CARD'
                              ? 'bg-purple-600'
                              : 'bg-emerald-600'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Top Dishes In Selected Period */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Most Ordered Dishes
            </h3>

            {reports?.topDishes?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No orders recorded in this date range.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400">
                      <th className="py-2.5 px-4">Rank</th>
                      <th className="py-2.5 px-4">Dish</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4 text-center">Quantity Sold</th>
                      <th className="py-2.5 px-4 text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports?.topDishes?.map((d, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-400">#{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{d._id}</td>
                        <td className="py-3 px-4 text-xs font-semibold text-slate-600">{d.foodType}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">{d.quantity}</td>
                        <td className="py-3 px-4 text-right font-black text-brand-red">₹{d.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default Reports;
