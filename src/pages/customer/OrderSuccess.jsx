import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, Copy, Check, ArrowRight, Utensils, Armchair, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedOrder, setCopiedOrder] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Retrieve state or fallback to localStorage
  const stateData = location.state || {};
  const order = stateData.order;
  const trackingToken = stateData.trackingToken;
  const trackingUrl = stateData.trackingUrl;

  const savedOrder = JSON.parse(localStorage.getItem('pravin_active_order') || '{}');
  const finalOrderNumber = order?.orderNumber || savedOrder.orderNumber;
  const finalTableNumber = order?.tableNumber || savedOrder.tableNumber;
  const finalTotal = order?.totalAmount || savedOrder.totalAmount;
  const finalToken = trackingToken || savedOrder.trackingToken;
  const finalCustomerName = order?.customerName || savedOrder.customerName;
  const finalCustomerPhone = order?.customerPhone || savedOrder.customerPhone;

  useEffect(() => {
    // Fire celebratory confetti on mount
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#991B1B', '#EA580C', '#16A34A', '#FBBF24'],
      });
    } catch (e) {}
  }, []);

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}/track/${finalOrderNumber}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyOrderNumber = () => {
    if (!finalOrderNumber) return;
    navigator.clipboard.writeText(finalOrderNumber);
    setCopiedOrder(true);
    setTimeout(() => setCopiedOrder(false), 2000);
  };

  const handleCopyToken = () => {
    if (!finalToken) return;
    navigator.clipboard.writeText(finalToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  if (!finalOrderNumber) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">No recent order found</h2>
        <Link to="/menu" className="text-sm font-bold text-brand-red underline">
          Browse Menu to place an order
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-brand-cream-border shadow-soft text-center space-y-8 animate-in zoom-in-95 duration-300">
        
        {/* Success Icon */}
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="absolute -top-1 -right-1 text-2xl">✨</span>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Order Transmitted To Kitchen
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-black text-slate-900">
            Your Order Has Been Placed Successfully!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Our chefs are preparing your authentic Indo-Chinese feast. Track live preparation status from your phone below.
          </p>
        </div>

        {/* Order Details Highlight Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left space-y-4">
          
          {/* Order Number & Table */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Order Number</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-brand-red font-mono">{finalOrderNumber}</span>
                <button
                  onClick={handleCopyOrderNumber}
                  title="Copy Order Number"
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                >
                  {copiedOrder ? (
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="sm:text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Seated Table</p>
              <p className="text-base font-bold text-slate-800 flex items-center gap-1.5 sm:justify-end mt-0.5">
                <Armchair className="w-4 h-4 text-brand-orange" />
                <span>{finalTableNumber}</span>
              </p>
            </div>
          </div>

          {/* Customer info if provided */}
          {(finalCustomerName || finalCustomerPhone) && (
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 border-b border-slate-200/80 pb-3">
              {finalCustomerName && (
                <div>
                  <span className="text-slate-400 font-medium">Guest: </span>
                  <span className="font-bold text-slate-800">{finalCustomerName}</span>
                </div>
              )}
              {finalCustomerPhone && (
                <div>
                  <span className="text-slate-400 font-medium">Phone: </span>
                  <span className="font-bold text-slate-800">{finalCustomerPhone}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-600 font-medium">Total Bill Amount</span>
            <span className="text-lg font-black text-slate-900">₹{finalTotal}</span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-600 font-medium">Payment Status</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Pay At Counter / Table After Dining
            </span>
          </div>

          {/* Tracking instructions */}
          <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 flex items-start gap-2.5 text-[11px] text-amber-900">
            <ShieldCheck className="w-4 h-4 shrink-0 text-brand-orange mt-0.5" />
            <p>
              Your <strong>Order Number ({finalOrderNumber})</strong> is saved on this device. You can track preparation status live anytime by simply entering your order number on the Track Order page.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            to={`/track/${finalOrderNumber}`}
            className="w-full py-4 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
          >
            <Clock className="w-4 h-4 text-amber-300" />
            <span>Track Order Status Live</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCopyLink}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-700">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Private Tracking Link</span>
                </>
              )}
            </button>

            <Link
              to="/track"
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <span>Go to Track Order Page</span>
            </Link>

            <Link
              to="/menu"
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Utensils className="w-4 h-4" />
              <span>Order More</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderSuccess;
