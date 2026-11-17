import React, { useState, useEffect } from 'react';
import {
  Receipt,
  CreditCard,
  IndianRupee,
  Printer,
  Search,
  CheckCircle,
  Clock,
  Filter,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';
import { socket } from '../../services/socket';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { printBillReceipt } from '../../utils/printReceipt';

const Billing = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState('ALL');

  // Record payment modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // View printable receipt modal
  const [viewingBill, setViewingBill] = useState(null);
  const [billLoading, setBillLoading] = useState(false);

  const fetchPayments = async () => {
    try {
      const params = {};
      if (methodFilter !== 'ALL') params.paymentMethod = methodFilter;
      const res = await api.get('/billing', { params });
      if (res.data.success) {
        setPayments(res.data.payments);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingOrders = async () => {
    try {
      const res = await api.get('/orders?status=ALL');
      if (res.data.success) {
        // Find orders whose paymentStatus is PENDING
        const unpaid = res.data.orders.filter(
          (o) => o.paymentStatus === 'PENDING' && o.orderStatus !== 'REJECTED'
        );
        setPendingOrders(unpaid);
        if (unpaid.length > 0 && !selectedOrderId) {
          setSelectedOrderId(unpaid[0]._id);
          setPaymentAmount(unpaid[0].totalAmount);
        }
      }
    } catch (err) {
      console.error('Error fetching pending orders for billing:', err);
    }
  };

  useEffect(() => {
    fetchPayments();

    const handleUpdate = () => fetchPayments();
    socket.on('bill:updated', handleUpdate);
    socket.on('order:new', handleUpdate);

    return () => {
      socket.off('bill:updated', handleUpdate);
      socket.off('order:new', handleUpdate);
    };
  }, [methodFilter]);

  const openRecordModal = () => {
    fetchPendingOrders();
    setPaymentMethod('CASH');
    setTransactionRef('');
    setPaymentNotes('');
    setError('');
    setIsRecordModalOpen(true);
  };

  const handleOrderSelectChange = (ordId) => {
    setSelectedOrderId(ordId);
    const ord = pendingOrders.find((o) => o._id === ordId);
    if (ord) {
      setPaymentAmount(ord.totalAmount);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedOrderId) {
      setError('Please select an order to record payment');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.post(`/billing/${selectedOrderId}/payment`, {
        paymentMethod,
        amount: Number(paymentAmount),
        transactionReference: transactionRef,
        notes: paymentNotes,
        settleSession: true,
      });

      if (res.data.success) {
        setIsRecordModalOpen(false);
        fetchPayments();
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewBill = async (orderId) => {
    if (!orderId) return;
    setBillLoading(true);
    try {
      const res = await api.get(`/billing/${orderId}`);
      if (res.data.success) {
        setViewingBill(res.data.bill);
      }
    } catch (err) {
      console.error('Error loading bill:', err);
      alert('Could not load bill details');
    } finally {
      setBillLoading(false);
    }
  };

  const handlePrint = () => {
    if (viewingBill) {
      printBillReceipt(viewingBill);
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Billing & Payments
          </h1>
          <p className="text-xs text-slate-500">
            Record customer settlements, print restaurant tax invoices, and track revenue.
          </p>
        </div>

        <button
          onClick={openRecordModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
        >
          <IndianRupee className="w-4 h-4" />
          <span>Record Customer Payment</span>
        </button>
      </div>

      {/* Filter by Method */}
      <div className="flex items-center gap-2">
        {['ALL', 'CASH', 'UPI', 'CARD'].map((m) => (
          <button
            key={m}
            onClick={() => setMethodFilter(m)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              methodFilter === m
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {m === 'ALL' ? 'All Payment Methods' : m}
          </button>
        ))}
      </div>

      {/* Payment records table */}
      {loading ? (
        <LoadingSpinner text="Fetching billing transaction logs..." />
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-base">No Payments Recorded Yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Click "Record Customer Payment" to settle pending dine-in orders.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-6">Order Number</th>
                  <th className="py-3.5 px-4">Table</th>
                  <th className="py-3.5 px-4">Customer & Mobile</th>
                  <th className="py-3.5 px-4">Amount Paid</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Received By</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-6 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900">
                      {p.orderNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {p.tableNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 text-xs">
                        {p.orderId?.customerName || 'Dine-in Guest'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {p.orderId?.customerPhone || 'No mobile'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-700 text-sm">
                      ₹{p.amount}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold ${
                          p.paymentMethod === 'UPI'
                            ? 'bg-blue-100 text-blue-800'
                            : p.paymentMethod === 'CARD'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {p.receivedBy || 'Admin'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-xs">
                      {new Date(p.paidAt).toLocaleDateString()} {new Date(p.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleViewBill(p.orderId?._id || p.orderId)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Bill</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Bill Payment"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Select Unpaid Order *
            </label>
            {pendingOrders.length === 0 ? (
              <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl">
                No orders are currently waiting for payment settlement.
              </p>
            ) : (
              <select
                value={selectedOrderId}
                onChange={(e) => handleOrderSelectChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-hidden"
              >
                {pendingOrders.map((ord) => (
                  <option key={ord._id} value={ord._id}>
                    {ord.orderNumber} • {ord.tableNumber} (₹{ord.totalAmount})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Amount Received (INR ₹) *
            </label>
            <input
              type="number"
              required
              min="0"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-black text-emerald-700 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Payment Method *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['CASH', 'UPI', 'CARD'].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    paymentMethod === m
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Transaction / UPI Ref ID (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. UPI/1234567890"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || pendingOrders.length === 0}
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              {submitting ? 'Recording...' : 'Record Payment (PAID)'}
            </button>
          </div>
        </form>
      </Modal>

      {/* PRINTABLE BILL MODAL */}
      <Modal
        isOpen={!!viewingBill}
        onClose={() => setViewingBill(null)}
        title="Official Tax Invoice / Bill"
        maxWidth="max-w-lg"
      >
        {viewingBill && (
          <div className="space-y-6">
            
            {/* Printable Receipt Container */}
            <div id="printable-bill" className="p-6 bg-white border border-slate-300 rounded-2xl text-slate-900 font-sans space-y-4">
              
              {/* Receipt Header */}
              <div className="text-center border-b border-dashed border-slate-300 pb-4 space-y-1">
                <h2 className="font-heading font-black text-2xl tracking-wider uppercase text-slate-900">
                  {viewingBill.restaurantName}
                </h2>
                <p className="text-xs text-slate-600">{viewingBill.address}</p>
                <p className="text-xs text-slate-600">Tel: {viewingBill.contact} | GSTIN: {viewingBill.gstin}</p>
              </div>

              {/* Order Info */}
              <div className="flex justify-between text-xs border-b border-dashed border-slate-300 pb-3">
                <div className="space-y-0.5">
                  <p><span className="font-bold text-slate-500">Order No:</span> <span className="font-mono font-bold text-slate-900">{viewingBill.orderNumber}</span></p>
                  <p><span className="font-bold text-slate-500">Table:</span> <span className="font-bold text-slate-900">{viewingBill.tableNumber}</span></p>
                  <p><span className="font-bold text-slate-500">Customer Name:</span> <span className="font-bold text-slate-900">{viewingBill.customerName || 'Dine-in Guest'}</span></p>
                  <p><span className="font-bold text-slate-500">Mobile No:</span> <span className="font-mono font-bold text-slate-900">{viewingBill.customerPhone || 'Not provided'}</span></p>
                </div>
                <div className="text-right space-y-0.5">
                  <p><span className="font-bold text-slate-500">Date:</span> <span className="font-bold text-slate-800">{new Date(viewingBill.orderDate || viewingBill.createdAt || Date.now()).toLocaleDateString()}</span></p>
                  <p><span className="font-bold text-slate-500">Time:</span> <span className="font-bold text-slate-800">{new Date(viewingBill.orderDate || viewingBill.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
                  {viewingBill.paymentMethod && (
                    <p><span className="font-bold text-slate-500">Payment Mode:</span> <span className="font-bold text-emerald-700">{viewingBill.paymentMethod}</span></p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-1.5">Dish</th>
                    <th className="py-1.5 text-center">Qty</th>
                    <th className="py-1.5 text-right">Price</th>
                    <th className="py-1.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewingBill.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-1.5 font-medium">{it.dishNameSnapshot}</td>
                      <td className="py-1.5 text-center">{it.quantity}</td>
                      <td className="py-1.5 text-right">₹{it.unitPriceSnapshot}</td>
                      <td className="py-1.5 text-right font-bold">₹{it.itemTotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold">₹{viewingBill.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (5% GST):</span>
                  <span className="font-bold">₹{viewingBill.tax}</span>
                </div>
                <div className="flex justify-between text-sm font-black border-t border-slate-200 pt-1.5 text-slate-900">
                  <span>Grand Total:</span>
                  <span>₹{viewingBill.totalAmount}</span>
                </div>
                <div className="flex justify-between text-xs pt-1">
                  <span>Payment Status:</span>
                  <span className="font-extrabold uppercase">{viewingBill.paymentStatus}</span>
                </div>
              </div>

              {/* Footer thank you */}
              <div className="text-center border-t border-dashed border-slate-300 pt-3 text-[11px] text-slate-500">
                <p>Thank you for dining at Pravin Chinese!</p>
                <p>Please visit again.</p>
              </div>
            </div>

            {/* Print action buttons */}
            <div className="flex items-center justify-between no-print pt-2">
              <button
                onClick={() => setViewingBill(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="px-6 py-2.5 rounded-xl bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs flex items-center gap-2 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
};

export default Billing;
