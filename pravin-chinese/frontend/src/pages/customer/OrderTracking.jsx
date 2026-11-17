import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Armchair,
  Receipt,
  Printer,
  Radio,
  Flame,
  UtensilsCrossed,
  XCircle,
  Banknote,
  Smartphone,
  QrCode,
  Sparkles,
  ShieldCheck,
  Check,
  User,
  Phone,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { printBillReceipt } from '../../utils/printReceipt';
import api from '../../services/api';
import { socket } from '../../services/socket';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

const TIMELINE_STEPS = [
  { key: 'PENDING', label: 'Order Placed', desc: 'Received & sent to kitchen' },
  { key: 'APPROVED', label: 'Order Confirmed', desc: 'Accepted by kitchen staff' },
  { key: 'PREPARING', label: 'Preparing Your Food', desc: 'Chefs are wok-frying your dishes' },
  { key: 'READY', label: 'Ready to Serve', desc: 'Plated hot & ready to enjoy' },
  { key: 'COMPLETED', label: 'Completed', desc: 'Dining session completed' },
];

const OrderTracking = () => {
  const { orderNumber: paramOrderNumber } = useParams();

  // Check if a recent order was saved on this device (used only for optional manual auto-fill)
  const savedOrder = JSON.parse(localStorage.getItem('pravin_active_order') || '{}');

  // Start with clean empty field on /track unless explicitly passed in the URL route
  const [inputOrderNumber, setInputOrderNumber] = useState(paramOrderNumber || '');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [liveSocketActive, setLiveSocketActive] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('CASH');
  const [settleLoading, setSettleLoading] = useState(false);

  const handleCompleteOrder = async () => {
    if (!order) return;
    setSettleLoading(true);
    setError('');

    try {
      const res = await api.post('/orders/settle', {
        orderNumber: order.orderNumber,
        paymentMethod: selectedPaymentMethod,
      });

      if (res.data.success) {
        setOrder(res.data.order);
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#16A34A', '#EA580C', '#991B1B'],
          });
        } catch (e) {}
      }
    } catch (err) {
      console.error('Failed to complete order:', err);
      setError(
        err.response?.data?.message ||
          'Failed to complete order. Please check with restaurant staff.'
      );
    } finally {
      setSettleLoading(false);
    }
  };

  const fetchTracking = async (orderNum) => {
    if (!orderNum || !orderNum.trim()) {
      setError('Please enter your Order Number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/orders/track', {
        orderNumber: orderNum.trim(),
      });

      if (res.data.success) {
        setOrder(res.data.order);
        // Connect to Socket room
        socket.emit('join:order', res.data.order.orderNumber);
        setLiveSocketActive(true);
      }
    } catch (err) {
      console.error('Tracking error:', err);
      const msg =
        err.response?.data?.message ||
        'Unable to connect to server. Please check your connection and try again.';
      setError(msg);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  // Only auto-fetch if explicit orderNumber is provided in URL route (e.g. /track/PC-2026-0001)
  useEffect(() => {
    if (paramOrderNumber) {
      setInputOrderNumber(paramOrderNumber);
      fetchTracking(paramOrderNumber);
    } else {
      // Direct visit to /track starts clean: no order info displayed until entered
      setOrder(null);
    }
  }, [paramOrderNumber]);

  // Real-time socket listener for live status updates
  useEffect(() => {
    if (!order?.orderNumber) return;

    const handleUpdate = (updatedOrder) => {
      if (updatedOrder.orderNumber === order.orderNumber) {
        setOrder((prev) => ({
          ...prev,
          orderStatus: updatedOrder.orderStatus,
          statusHistory: updatedOrder.statusHistory,
          paymentStatus: updatedOrder.paymentStatus,
        }));
      }
    };

    socket.on('order:updated', handleUpdate);

    return () => {
      socket.off('order:updated', handleUpdate);
    };
  }, [order?.orderNumber]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputOrderNumber.trim()) {
      setError('Please enter your Order Number.');
      return;
    }
    fetchTracking(inputOrderNumber);
  };

  const handlePrint = () => {
    if (order) {
      printBillReceipt(order);
    } else {
      window.print();
    }
  };

  // Determine timeline step progression index (5 steps)
  const getStepIndex = (status) => {
    if (status === 'REJECTED') return -1;
    if (status === 'PENDING') return 0;
    if (status === 'APPROVED') return 1;
    if (status === 'PREPARING') return 2;
    if (status === 'READY' || status === 'SERVED') return 3;
    if (status === 'COMPLETED') return 4;
    return 0;
  };

  const currentStepIdx = order ? getStepIndex(order.orderStatus) : -1;
  const isRejected = order?.orderStatus === 'REJECTED';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Search Tracker Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-cream-border shadow-soft no-print">
        <div className="text-center max-w-xl mx-auto mb-6 space-y-1">
          <span className="text-xs font-black uppercase tracking-widest text-brand-orange">
            Live Kitchen Tracking
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-black text-slate-900">
            Track Your Order
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Enter your unique Order Number below to view live kitchen preparation and status.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 text-center sm:text-left">
              Order Number
            </label>
            <input
              type="text"
              placeholder="e.g. PC-2026-0001"
              value={inputOrderNumber}
              onChange={(e) => setInputOrderNumber(e.target.value.toUpperCase())}
              required
              className="w-full px-5 py-3.5 rounded-2xl border border-slate-300 text-base sm:text-lg font-mono font-black text-brand-red placeholder:text-slate-300 tracking-wider text-center focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red focus:outline-hidden shadow-xs"
            />
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-red to-brand-orange hover:opacity-95 text-white font-black text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span>Looking Up Kitchen System...</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Track Order</span>
              </>
            )}
          </button>

          {/* Optional helper to quickly paste recent order number from this device without auto-submitting */}
          {savedOrder?.orderNumber && !order && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  setInputOrderNumber(savedOrder.orderNumber);
                  setError('');
                }}
                className="text-xs text-slate-500 hover:text-brand-red underline cursor-pointer transition-colors"
              >
                Auto-fill recent order ({savedOrder.orderNumber})
              </button>
            </div>
          )}
        </form>
      </div>

      {/* TRACKING DETAILS DISPLAY */}
      {order && (
        <div id="printable-bill" className="space-y-6 animate-in fade-in duration-300">
          
          {/* Status Header Banner */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-cream-border shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Order Number
                  </span>
                  {liveSocketActive && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 no-print">
                      <Radio className="w-3 h-3 text-green-600 animate-pulse" />
                      Live Connected
                    </span>
                  )}
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl font-black text-brand-red font-mono">
                  {order.orderNumber}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors no-print"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                <OrderStatusBadge status={order.orderStatus} />
              </div>
            </div>

            {/* GUEST & DINING DETAILS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 text-xs">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer Name</p>
                <p className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <User className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                  <span className="truncate">{order.customerName || 'Dine-in Guest'}</span>
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mobile No</p>
                <p className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                  <span className="truncate">{order.customerPhone || 'Not provided'}</span>
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Seated Table</p>
                <p className="font-bold text-brand-red flex items-center gap-1.5 mt-0.5">
                  <Armchair className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                  <span>{order.tableNumber}</span>
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order Placed At</p>
                <p className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                  <span>
                    {new Date(order.orderDate || order.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </p>
              </div>
            </div>

            {/* Special Instructions if present */}
            {order.customerNotes && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <FileText className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase text-[10px] tracking-wider text-amber-800 block">
                    Special Cooking Instructions:
                  </span>
                  <span>{order.customerNotes}</span>
                </div>
              </div>
            )}

            {/* TIMELINE PROGRESS BAR (5 LIVE STAGES) */}
            <div className="no-print">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
                Kitchen Timeline
              </h3>

              {isRejected ? (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-800">
                  <XCircle className="w-6 h-6 text-red-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">Order Cancelled or Rejected</p>
                    <p className="text-xs text-red-600 mt-0.5">
                      Please check with restaurant staff or place a new order.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* 5 Timeline steps */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {TIMELINE_STEPS.map((step, idx) => {
                      const isCompleted = order.orderStatus === 'COMPLETED' || idx < currentStepIdx;
                      const isCurrent = order.orderStatus !== 'COMPLETED' && idx === currentStepIdx;
                      const isUpcoming = order.orderStatus !== 'COMPLETED' && idx > currentStepIdx;

                      return (
                        <div key={step.key} className="flex flex-col items-center text-center space-y-2">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                              isCompleted
                                ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                                : isCurrent
                                ? 'bg-brand-orange text-white ring-4 ring-orange-100 animate-pulse'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>
                          <div>
                            <p
                              className={`text-xs font-extrabold ${
                                isCompleted
                                  ? 'text-emerald-700'
                                  : isCurrent
                                  ? 'text-brand-orange'
                                  : 'text-slate-400'
                              }`}
                            >
                              {step.label}
                            </p>
                            <p className="text-[10px] text-slate-400 hidden sm:block mt-0.5">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ORDER ITEMS & BILL RECEIPT DETAILS */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-brand-orange" />
                  <span>Dining Bill Details</span>
                </h3>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                  Table: {order.tableNumber}
                </span>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px]">
                      <th className="py-2">Dish Item</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Unit Price</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.items?.map((it, idx) => (
                      <tr key={idx} className="text-slate-800">
                        <td className="py-2.5 font-medium">
                          {it.dishNameSnapshot}
                          <span className="ml-2 text-[10px] text-slate-400">({it.foodTypeSnapshot})</span>
                        </td>
                        <td className="py-2.5 text-center font-bold">{it.quantity}</td>
                        <td className="py-2.5 text-right text-slate-600">₹{it.unitPriceSnapshot}</td>
                        <td className="py-2.5 text-right font-black text-slate-900">₹{it.itemTotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bill Totals */}
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-xs sm:text-sm max-w-sm ml-auto">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">₹{order.subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax (5% GST)</span>
                  <span className="font-semibold text-slate-900">₹{order.tax}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-base font-black text-slate-900">
                  <span>Grand Total</span>
                  <span className="text-brand-red text-lg">₹{order.totalAmount}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500 font-medium">Payment Status:</span>
                  <span
                    className={`font-black uppercase text-xs px-2 py-0.5 rounded ${
                      order.paymentStatus === 'PAID'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
              </div>

              {/* FINAL STEP: PAYMENT SELECTION (CASH OR ONLINE) & COMPLETE ORDER */}
              {order.paymentStatus === 'PAID' ? (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md no-print animate-in fade-in duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h4 className="font-heading font-black text-lg">
                        Dining Session Completed!
                      </h4>
                      <p className="text-xs text-emerald-100">
                        Bill settled successfully. {order.tableNumber} is cleared and ready to book from the admin side.
                      </p>
                    </div>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full bg-white text-emerald-800 text-xs font-black uppercase tracking-wider shadow-xs">
                    Table Ready To Book ✅
                  </span>
                </div>
              ) : (
                <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-50/90 via-white to-orange-50/60 border-2 border-amber-300 shadow-md space-y-5 no-print animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-brand-orange bg-amber-100 px-2.5 py-0.5 rounded-full">
                        Final Step • Settle Bill & Complete Dining
                      </span>
                      <h4 className="font-heading font-black text-xl text-slate-900 mt-1">
                        Select Payment Method
                      </h4>
                      <p className="text-xs text-slate-500">
                        Choose Cash or Online payment below, then click Complete Order to release {order.tableNumber}.
                      </p>
                    </div>
                    <span className="text-3xl">🥢</span>
                  </div>

                  {/* 2 Options: Cash Payment or Online Payment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Option 1: Cash Payment */}
                    <div
                      onClick={() => setSelectedPaymentMethod('CASH')}
                      className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                        selectedPaymentMethod === 'CASH'
                          ? 'border-emerald-500 bg-emerald-50/80 shadow-md ring-2 ring-emerald-400/40'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                              selectedPaymentMethod === 'CASH'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Banknote className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-extrabold text-sm text-slate-900">
                              Cash Payment
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Pay cash at table or counter
                            </p>
                          </div>
                        </div>
                        <span
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedPaymentMethod === 'CASH'
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {selectedPaymentMethod === 'CASH' && <Check className="w-3 h-3" />}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-3 pt-2 border-t border-slate-100">
                        Hand over exact bill amount (₹{order.totalAmount}) to server staff.
                      </p>
                    </div>

                    {/* Option 2: Online Payment */}
                    <div
                      onClick={() => setSelectedPaymentMethod('ONLINE')}
                      className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                        selectedPaymentMethod === 'ONLINE'
                          ? 'border-brand-orange bg-orange-50/80 shadow-md ring-2 ring-brand-orange/40'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                              selectedPaymentMethod === 'ONLINE'
                                ? 'bg-brand-orange text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <QrCode className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-extrabold text-sm text-slate-900">
                              Online Payment
                            </p>
                            <p className="text-[11px] text-slate-500">
                              UPI / QR / GPay / PhonePe
                            </p>
                          </div>
                        </div>
                        <span
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedPaymentMethod === 'ONLINE'
                              ? 'border-brand-orange bg-brand-orange text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {selectedPaymentMethod === 'ONLINE' && <Check className="w-3 h-3" />}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-3 pt-2 border-t border-slate-100">
                        Instant scan & pay via any UPI app or digital payment.
                      </p>
                    </div>

                  </div>

                  {/* Online QR Code preview if selected */}
                  {selectedPaymentMethod === 'ONLINE' && (
                    <div className="p-4 rounded-2xl bg-white border border-orange-200 shadow-xs flex flex-col sm:flex-row items-center gap-5 animate-in fade-in duration-200">
                      <div className="w-24 h-24 bg-slate-900 rounded-xl p-2 flex flex-col items-center justify-center text-white shrink-0 shadow-xs">
                        <div className="w-full h-full bg-white rounded flex items-center justify-center text-slate-900 p-1">
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            <rect x="0" y="0" width="30" height="30" fill="black" />
                            <rect x="5" y="5" width="20" height="20" fill="white" />
                            <rect x="10" y="10" width="10" height="10" fill="black" />
                            
                            <rect x="70" y="0" width="30" height="30" fill="black" />
                            <rect x="75" y="5" width="20" height="20" fill="white" />
                            <rect x="80" y="10" width="10" height="10" fill="black" />
                            
                            <rect x="0" y="70" width="30" height="30" fill="black" />
                            <rect x="5" y="75" width="20" height="20" fill="white" />
                            <rect x="10" y="80" width="10" height="10" fill="black" />
                            
                            <rect x="40" y="20" width="8" height="8" fill="black" />
                            <rect x="52" y="20" width="8" height="8" fill="black" />
                            <rect x="40" y="40" width="20" height="20" fill="black" />
                            <rect x="70" y="45" width="10" height="10" fill="black" />
                            <rect x="45" y="70" width="12" height="12" fill="black" />
                            <rect x="65" y="75" width="10" height="10" fill="black" />
                          </svg>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-center sm:text-left flex-1">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <span className="text-xs font-black uppercase text-slate-900">
                            PRAVIN CHINESE RESTAURANT UPI
                          </span>
                          <span className="text-[10px] bg-green-100 text-green-800 font-bold px-1.5 py-0.5 rounded">
                            Verified Merchant
                          </span>
                        </div>
                        <p className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg inline-block">
                          pravinchinese@icici • ₹{order.totalAmount}
                        </p>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1 text-[10px] text-slate-500">
                          <span className="bg-slate-100 px-2 py-0.5 rounded font-semibold">Google Pay</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded font-semibold">PhonePe</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded font-semibold">Paytm</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded font-semibold">BHIM UPI</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Complete Order CTA */}
                  <div className="pt-2 space-y-2">
                    <button
                      onClick={handleCompleteOrder}
                      disabled={settleLoading}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:to-green-700 text-white font-black text-sm uppercase tracking-wider shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                    >
                      {settleLoading ? (
                        <span>Completing Order & Releasing Table...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-white" />
                          <span>
                            Complete Order ({selectedPaymentMethod === 'CASH' ? 'Cash Payment' : 'Online Payment'}) • ₹{order.totalAmount}
                          </span>
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-center text-slate-500 font-medium">
                      ⚡ Clicking Complete Order marks this bill as paid and instantly releases {order.tableNumber} to be booked from the admin side.
                    </p>
                  </div>
                </div>
              )}

              {/* Status History Log */}
              {order.statusHistory && order.statusHistory.length > 0 && (
                <div className="border-t border-slate-100 pt-4 no-print">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Order Activity Log
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-500">
                    {order.statusHistory.map((hist, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        <span className="font-semibold text-slate-700">[{hist.status}]</span>
                        <span>{new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>- {hist.note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default OrderTracking;
