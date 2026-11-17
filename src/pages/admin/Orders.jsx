import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  Check,
  X,
  Flame,
  ChefHat,
  Utensils,
  CheckCircle,
  Clock,
  Printer,
  Radio,
  Armchair,
  Banknote,
  QrCode,
  CheckCircle2,
} from 'lucide-react';
import api from '../../services/api';
import { socket } from '../../services/socket';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';

const STATUS_FILTERS = [
  'ALL',
  'PENDING',
  'APPROVED',
  'PREPARING',
  'READY',
  'SERVED',
  'COMPLETED',
  'REJECTED',
];

const Orders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';

  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [orderToComplete, setOrderToComplete] = useState(null);
  const [adminPaymentMethod, setAdminPaymentMethod] = useState('CASH');

  const handleConfirmCompleteOrder = async () => {
    if (!orderToComplete) return;
    setActionLoading(orderToComplete._id);
    try {
      const res = await api.patch(`/orders/${orderToComplete._id}/status`, {
        status: 'COMPLETED',
        paymentMethod: adminPaymentMethod,
        note: `Completed via ${adminPaymentMethod} payment and table released.`,
      });

      if (res.data.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderToComplete._id ? { ...o, ...res.data.order } : o))
        );
        if (selectedOrder && selectedOrder._id === orderToComplete._id) {
          setSelectedOrder(res.data.order);
        }
        setOrderToComplete(null);
      }
    } catch (err) {
      console.error('Error completing order:', err);
      alert(err.response?.data?.message || 'Failed to complete order');
    } finally {
      setActionLoading(null);
    }
  };

  const fetchOrders = async () => {
    try {
      const params = {};
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/orders', { params });
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, searchQuery]);

  // Real-time socket updates for order management
  useEffect(() => {
    const handleNewOrder = (newOrder) => {
      setOrders((prev) => [newOrder, ...prev.filter((o) => o._id !== newOrder._id)]);
    };

    const handleStatusUpdate = (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? { ...o, ...updatedOrder } : o))
      );
      if (selectedOrder && selectedOrder._id === updatedOrder._id) {
        setSelectedOrder((prev) => ({ ...prev, ...updatedOrder }));
      }
    };

    socket.on('order:new', handleNewOrder);
    socket.on('order:status_updated', handleStatusUpdate);

    return () => {
      socket.off('order:new', handleNewOrder);
      socket.off('order:status_updated', handleStatusUpdate);
    };
  }, [selectedOrder]);

  const handleUpdateStatus = async (orderId, newStatus, note = '') => {
    setActionLoading(orderId);
    try {
      const res = await api.patch(`/orders/${orderId}/status`, {
        status: newStatus,
        note,
      });

      if (res.data.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, ...res.data.order } : o))
        );
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(res.data.order);
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Kitchen & Dine-in Orders
          </h1>
          <p className="text-xs text-slate-500">
            Real-time kitchen workflow and live status transitions.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Order # or Table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-brand-red/30 focus:outline-hidden shadow-xs"
          />
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {STATUS_FILTERS.map((st) => (
          <button
            key={st}
            onClick={() => {
              setStatusFilter(st);
              const p = new URLSearchParams(searchParams);
              if (st === 'ALL') p.delete('status');
              else p.set('status', st);
              setSearchParams(p);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === st
                ? 'bg-brand-red text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {st === 'ALL' ? 'All Orders' : st}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      {loading ? (
        <LoadingSpinner text="Fetching active kitchen orders..." />
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-base">No Orders Found</h3>
          <p className="text-xs text-slate-400 mt-1">
            There are currently no orders matching the selected status filter.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Order #</th>
                  <th className="py-3.5 px-4">Table</th>
                  <th className="py-3.5 px-4">Items Summary</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Time</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Kitchen Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => {
                  const isCurrentAction = actionLoading === ord._id;

                  return (
                    <tr
                      key={ord._id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Order Number */}
                      <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-slate-900">
                        {ord.orderNumber}
                      </td>

                      {/* Table */}
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-900 border border-purple-200 font-extrabold text-xs">
                          <Armchair className="w-3.5 h-3.5 text-purple-600" />
                          {ord.tableNumber}
                        </span>
                      </td>

                      {/* Items preview */}
                      <td className="py-3.5 px-4 max-w-xs truncate">
                        <span className="font-semibold text-slate-800">
                          {ord.items?.length || 0} items:
                        </span>{' '}
                        <span className="text-slate-500 text-xs">
                          {ord.items
                            ?.map((it) => `${it.quantity}x ${it.dishNameSnapshot}`)
                            .join(', ')}
                        </span>
                        {ord.customerNotes && (
                          <span className="block text-[11px] text-brand-orange font-medium truncate">
                            📝 Note: {ord.customerNotes}
                          </span>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 text-right font-black text-brand-red text-sm">
                        ₹{ord.totalAmount}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <OrderStatusBadge status={ord.orderStatus} />
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-4 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(ord.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Quick Action buttons */}
                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap space-x-1.5">
                        
                        {/* View Button */}
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Status Transition buttons depending on current state */}
                        {ord.orderStatus === 'PENDING' && (
                          <>
                            <button
                              disabled={isCurrentAction}
                              onClick={() => handleUpdateStatus(ord._id, 'APPROVED')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              disabled={isCurrentAction}
                              onClick={() => handleUpdateStatus(ord._id, 'REJECTED', 'Kitchen at capacity or dish unavailable')}
                              className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold transition-colors inline-flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {ord.orderStatus === 'APPROVED' && (
                          <button
                            disabled={isCurrentAction}
                            onClick={() => handleUpdateStatus(ord._id, 'PREPARING')}
                            className="px-2.5 py-1 rounded-lg bg-brand-orange hover:bg-orange-600 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-xs"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>Start Prep</span>
                          </button>
                        )}

                        {ord.orderStatus === 'PREPARING' && (
                          <button
                            disabled={isCurrentAction}
                            onClick={() => handleUpdateStatus(ord._id, 'READY')}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-xs"
                          >
                            <ChefHat className="w-3.5 h-3.5" />
                            <span>Mark Ready</span>
                          </button>
                        )}

                        {ord.orderStatus === 'READY' && (
                          <button
                            disabled={isCurrentAction}
                            onClick={() => handleUpdateStatus(ord._id, 'SERVED')}
                            className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-xs"
                          >
                            <Utensils className="w-3.5 h-3.5" />
                            <span>Mark Served</span>
                          </button>
                        )}

                        {ord.orderStatus === 'SERVED' && (
                          <button
                            disabled={isCurrentAction}
                            onClick={() => setOrderToComplete(ord)}
                            className="px-2.5 py-1 rounded-lg bg-green-700 hover:bg-green-800 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Complete Order</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW ORDER DETAILS MODAL */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order Details: ${selectedOrder?.orderNumber}`}
        maxWidth="max-w-2xl"
      >
        {selectedOrder && (
          <div className="space-y-6">
            
            {/* Top row info */}
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Table</p>
                <p className="text-lg font-black text-slate-900">{selectedOrder.tableNumber}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</p>
                <OrderStatusBadge status={selectedOrder.orderStatus} />
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Amount</p>
                <p className="text-lg font-black text-brand-red">₹{selectedOrder.totalAmount}</p>
              </div>
            </div>

            {/* Special Instructions if any */}
            {selectedOrder.customerNotes && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <span className="font-bold">Customer Instructions:</span> {selectedOrder.customerNotes}
              </div>
            )}

            {/* Items list */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Order Items ({selectedOrder.items?.length})
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs sm:text-sm">
                {selectedOrder.items?.map((it, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">
                        {it.dishNameSnapshot}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        ₹{it.unitPriceSnapshot} × {it.quantity}
                      </p>
                    </div>
                    <span className="font-black text-slate-900">
                      ₹{it.itemTotal}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status updates action bar */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
              {selectedOrder.orderStatus === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'APPROVED')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    Approve Order
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'REJECTED')}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                  >
                    Reject Order
                  </button>
                </>
              )}

              {selectedOrder.orderStatus === 'APPROVED' && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder._id, 'PREPARING')}
                  className="px-4 py-2 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs"
                >
                  Start Preparing
                </button>
              )}

              {selectedOrder.orderStatus === 'PREPARING' && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder._id, 'READY')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  Mark as Ready
                </button>
              )}

              {selectedOrder.orderStatus === 'READY' && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder._id, 'SERVED')}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
                >
                  Mark as Served
                </button>
              )}

              {selectedOrder.orderStatus === 'SERVED' && (
                <button
                  onClick={() => setOrderToComplete(selectedOrder)}
                  className="px-4 py-2 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-xs"
                >
                  Complete Order & Free Table
                </button>
              )}
            </div>

          </div>
        )}
      </Modal>

      {/* COMPLETE ORDER & PAYMENT MODAL */}
      <Modal
        isOpen={!!orderToComplete}
        onClose={() => setOrderToComplete(null)}
        title={`Complete Order & Free Table: ${orderToComplete?.tableNumber}`}
        maxWidth="max-w-md"
      >
        {orderToComplete && (
          <div className="space-y-5">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Order Number:</span>
                <span className="font-mono font-bold text-slate-800">{orderToComplete.orderNumber}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Dining Table:</span>
                <span className="font-bold text-brand-red">{orderToComplete.tableNumber}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-slate-200 pt-2 font-black">
                <span className="text-slate-800">Total Bill:</span>
                <span className="text-brand-red text-base">₹{orderToComplete.totalAmount}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Select Customer Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAdminPaymentMethod('CASH')}
                  className={`p-3.5 rounded-2xl border-2 flex items-center gap-2.5 transition-all ${
                    adminPaymentMethod === 'CASH'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-300'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-bold">Cash</p>
                    <p className="text-[10px] text-slate-500">Paid in cash</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminPaymentMethod('ONLINE')}
                  className={`p-3.5 rounded-2xl border-2 flex items-center gap-2.5 transition-all ${
                    adminPaymentMethod === 'ONLINE'
                      ? 'border-brand-orange bg-orange-50 text-orange-950 ring-2 ring-orange-300'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-brand-orange shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-bold">Online / UPI</p>
                    <p className="text-[10px] text-slate-500">GPay/PhonePe/Card</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800">
              ⚡ Completing this order marks the bill as PAID and immediately releases <strong>{orderToComplete.tableNumber}</strong> so it is <strong>ready to book</strong> for incoming guests.
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOrderToComplete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCompleteOrder}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Payment & Release Table</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Orders;
