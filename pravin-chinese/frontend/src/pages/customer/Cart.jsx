import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Armchair,
  CheckCircle2,
  AlertCircle,
  User,
  Phone,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import FoodTypeBadge from '../../components/FoodTypeBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

const Cart = () => {
  const navigate = useNavigate();
  const tableSectionRef = useRef(null);

  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    tax,
    totalAmount,
    totalItems,
    selectedTable,
    setSelectedTable,
  } = useCart();

  // Tables state for Step 5
  const [tables, setTables] = useState([]);
  const [tablesLoading, setTablesLoading] = useState(true);

  // Form states
  const [customerNotes, setCustomerNotes] = useState(
    localStorage.getItem('pravin_customer_notes') || ''
  );
  const [customerName, setCustomerName] = useState(
    localStorage.getItem('pravin_guest_name') || ''
  );
  const [customerPhone, setCustomerPhone] = useState(
    localStorage.getItem('pravin_guest_phone') || ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Natural sorting helper so Table 10 comes after Table 9, not after Table 1
  const sortTablesNaturally = (list) => {
    return [...list].sort((a, b) =>
      a.tableNumber.localeCompare(b.tableNumber, undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    );
  };

  // Fetch real-time tables from MongoDB
  const fetchTables = async () => {
    try {
      const res = await api.get('/tables');
      if (res.data.success) {
        setTables(sortTablesNaturally(res.data.tables));
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setTablesLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 10000); // Poll status every 10s
    return () => clearInterval(interval);
  }, []);

  const handleSelectTable = (table) => {
    if (table.status === 'OCCUPIED' && selectedTable?._id !== table._id) {
      setErrorMessage(`${table.tableNumber} is currently occupied by guests. Please choose an available green table.`);
      return;
    }
    setErrorMessage('');
    setSelectedTable(table);
  };

  const handlePhoneChange = (e) => {
    // Only accept numeric digits and restrict to maximum 10 digits
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setCustomerPhone(digitsOnly);
  };

  const handleConfirmOrder = async () => {
    if (!selectedTable) {
      setErrorMessage('Please select a seated dining table (Step 5) to place your order.');
      if (tableSectionRef.current) {
        tableSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (customerPhone.trim() && customerPhone.trim().length !== 10) {
      setErrorMessage('Please enter a valid 10-digit phone number, or leave it blank.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        tableId: selectedTable._id,
        customerName: customerName.trim() || 'Dine-in Guest',
        customerPhone: customerPhone.trim(),
        items: cartItems.map((item) => ({
          dishId: item.dish._id,
          quantity: item.quantity,
        })),
        customerNotes: customerNotes.trim(),
      };

      const res = await api.post('/orders', payload);

      if (res.data.success) {
        if (customerName.trim()) localStorage.setItem('pravin_guest_name', customerName.trim());
        if (customerPhone.trim()) localStorage.setItem('pravin_guest_phone', customerPhone.trim());
        localStorage.removeItem('pravin_customer_notes');
        clearCart();

        // Save active order info for easy customer retrieval
        localStorage.setItem(
          'pravin_active_order',
          JSON.stringify({
            orderNumber: res.data.order.orderNumber,
            trackingToken: res.data.trackingToken,
            tableNumber: res.data.order.tableNumber,
            totalAmount: res.data.order.totalAmount,
            customerName: res.data.order.customerName,
            customerPhone: res.data.order.customerPhone,
          })
        );

        // Navigate to Order Success confirmation
        navigate('/order-success', {
          state: {
            order: res.data.order,
            trackingToken: res.data.trackingToken,
            trackingUrl: res.data.trackingUrl,
          },
        });
      }
    } catch (err) {
      console.error('Failed to place order:', err);
      const msg =
        err.response?.data?.message ||
        'Could not complete your order. The table might have just been reserved. Please try again.';
      setErrorMessage(msg);
      fetchTables();
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-24 h-24 rounded-3xl bg-amber-50 border border-amber-200 text-brand-red flex items-center justify-center mx-auto text-4xl shadow-xs">
          🥢
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-3xl font-black text-slate-900">
            Your Order Basket is Empty
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Looks like you haven't added any delicious Indo-Chinese dishes yet!
          </p>
        </div>
        <div>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-sm uppercase tracking-wider shadow-md transition-all hover:scale-[1.02]"
          >
            <span>Explore Pravin Menu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-brand-cream-border pb-5">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-brand-orange bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            Steps 4, 5 & 6 • All-in-One Checkout
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            Order Basket & Dining Placement
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review your dishes, choose your dining table, and confirm your order in one simple step.
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Basket</span>
        </button>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <p>{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Step 4 Dishes + Step 5 Table Grid + Guest Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* STEP 4: SELECTED DISHES */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-brand-cream-border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-orange">
                  Step 4 • Review Dishes
                </span>
                <h2 className="font-heading font-black text-lg text-slate-900">
                  Your Order Basket ({totalItems} {totalItems === 1 ? 'dish' : 'dishes'})
                </h2>
              </div>
              <Link
                to="/menu"
                className="text-xs font-bold text-brand-red hover:underline flex items-center gap-1"
              >
                <span>+ Add More Dishes</span>
              </Link>
            </div>

            <div className="space-y-3">
              {cartItems.map(({ dish, quantity }) => {
                const itemTotal = dish.price * quantity;
                return (
                  <div
                    key={dish._id}
                    className="p-3.5 sm:p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:bg-white hover:border-amber-200"
                  >
                    {/* Image and Info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60">
                        <img
                          src={dish.imageUrl || 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=400&q=80'}
                          alt={dish.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <FoodTypeBadge type={dish.foodType} />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {dish.categoryName}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate">
                          {dish.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          ₹{dish.price} each
                        </p>
                      </div>
                    </div>

                    {/* Quantity controls & Price */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-200/60">
                      {/* Quantity controls */}
                      <div className="flex items-center border border-slate-200 rounded-xl bg-white px-1 py-0.5 shadow-2xs">
                        <button
                          onClick={() => updateQuantity(dish._id, quantity - 1)}
                          className="w-7 h-7 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 font-bold flex items-center justify-center transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-black text-slate-800">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(dish._id, quantity + 1)}
                          className="w-7 h-7 rounded-lg text-slate-600 hover:bg-green-50 hover:text-green-600 font-bold flex items-center justify-center transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="text-right min-w-[70px]">
                        <span className="text-sm sm:text-base font-black text-brand-red">
                          ₹{itemTotal}
                        </span>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => removeFromCart(dish._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 5: TABLE SELECTION (INTEGRATED DIRECTLY IN CART) */}
          <div
            ref={tableSectionRef}
            className="bg-white rounded-3xl p-5 sm:p-6 border border-brand-cream-border shadow-xs space-y-5"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-orange">
                  Step 5 • Dining Table Selection
                </span>
                <h2 className="font-heading font-black text-lg text-slate-900">
                  Select Your Seated Table
                </h2>
                <p className="text-xs text-slate-500">
                  Click your table number below. Available tables are highlighted in green.
                </p>
              </div>

              {/* Tables Legend */}
              <div className="flex items-center gap-3 text-[11px] font-bold self-start sm:self-auto pt-1 sm:pt-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-600">Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="text-slate-600">Occupied</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-red ring-1 ring-amber-400"></span>
                  <span className="text-slate-600">Your Seat</span>
                </div>
              </div>
            </div>

            {/* Table Grid */}
            {tablesLoading ? (
              <LoadingSpinner text="Checking table availability..." />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {tables.map((table) => {
                  const isSelected = selectedTable?._id === table._id;
                  const isOccupied = table.status === 'OCCUPIED' && !isSelected;

                  return (
                    <button
                      key={table._id}
                      type="button"
                      disabled={isOccupied}
                      onClick={() => handleSelectTable(table)}
                      className={`relative p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-1.5 ${
                        isSelected
                          ? 'border-brand-red bg-red-50/90 shadow-md ring-2 ring-amber-400 scale-102'
                          : isOccupied
                          ? 'border-red-200 bg-red-50/40 text-slate-400 cursor-not-allowed opacity-75'
                          : 'border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/70 hover:border-emerald-500 hover:shadow-xs cursor-pointer'
                      }`}
                    >
                      {/* Status indicator dot */}
                      <div className="absolute top-2 right-2">
                        <span
                          className={`w-2 h-2 rounded-full inline-block ${
                            isSelected
                              ? 'bg-brand-red ring-2 ring-amber-300'
                              : isOccupied
                              ? 'bg-red-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                      </div>

                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                          isSelected
                            ? 'bg-brand-red text-white'
                            : isOccupied
                            ? 'bg-red-100 text-red-500'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        <Armchair className="w-5 h-5" />
                      </div>

                      <div>
                        <h4
                          className={`font-black text-xs sm:text-sm leading-tight ${
                            isSelected
                              ? 'text-brand-red'
                              : isOccupied
                              ? 'text-slate-500 line-through'
                              : 'text-slate-900'
                          }`}
                        >
                          {table.tableNumber}
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          {table.capacity || 4} Seats
                        </p>
                      </div>

                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-brand-red text-white'
                            : isOccupied
                            ? 'bg-red-200 text-red-800'
                            : 'bg-emerald-200 text-emerald-800'
                        }`}
                      >
                        {isSelected ? 'Selected' : isOccupied ? 'Occupied' : 'Available'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected table banner feedback */}
            {selectedTable ? (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{selectedTable.tableNumber} Selected ({selectedTable.capacity || 4} Guests Capacity)</span>
                </div>
                <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded font-black uppercase">
                  Ready
                </span>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-2 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-brand-orange shrink-0" />
                <span>Please click your seated table above to assign it to this order.</span>
              </div>
            )}
          </div>

          {/* GUEST DETAILS & COOKING INSTRUCTIONS */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-brand-cream-border shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-heading font-black text-lg text-slate-900">
                Guest Details & Special Requests
              </h3>
              <p className="text-xs text-slate-500">
                Enter your contact info for order updates and tracking (Optional for dine-in).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Guest / Customer Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma (or Dine-in Guest)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-brand-red/30 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Phone Number
                  </label>
                  {customerPhone.length > 0 && (
                    <span
                      className={`text-[10px] font-bold ${
                        customerPhone.length === 10 ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {customerPhone.length}/10 digits
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="9876543210 (Max 10 digits)"
                    value={customerPhone}
                    onChange={handlePhoneChange}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-brand-red/30 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Special Kitchen Instructions / Cooking Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={customerNotes}
                onChange={(e) => {
                  setCustomerNotes(e.target.value);
                  localStorage.setItem('pravin_customer_notes', e.target.value);
                }}
                placeholder="e.g. Extra spicy schezwan sauce, less oil, no garlic, crispy noodles..."
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-red/30"
              />
            </div>
          </div>

        </div>

        {/* Right Column: Step 6 Sticky Order Summary & Confirm CTA */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-brand-cream-border shadow-soft space-y-5 lg:sticky lg:top-24">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange">
                Step 6 • Review & Confirm
              </span>
              <h3 className="font-heading text-xl font-black text-slate-900 mt-0.5">
                Order Bill Summary
              </h3>
            </div>

            {/* Price & Seated Table Details */}
            <div className="space-y-2.5 text-xs sm:text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900">₹{subtotal}</span>
              </div>

              <div className="flex justify-between">
                <span>Tax (5% GST)</span>
                <span className="font-semibold text-slate-900">₹{tax}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span>Seated Table</span>
                {selectedTable ? (
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                    {selectedTable.tableNumber}
                  </span>
                ) : (
                  <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                    Select in Step 5
                  </span>
                )}
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between text-base sm:text-lg font-black text-slate-900">
                <span>Grand Total</span>
                <span className="text-brand-red text-2xl">₹{totalAmount}</span>
              </div>
            </div>

            {/* Confirm & Place Order CTA */}
            <button
              onClick={handleConfirmOrder}
              disabled={submitting}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all ${
                !selectedTable
                  ? 'bg-gradient-to-r from-brand-orange to-amber-500 hover:opacity-95 text-white hover:scale-[1.01] cursor-pointer'
                  : 'bg-gradient-to-r from-brand-red to-brand-orange hover:opacity-95 text-white hover:scale-[1.01] cursor-pointer'
              } disabled:opacity-75 disabled:cursor-not-allowed`}
            >
              {submitting ? (
                <span>Placing Your Order...</span>
              ) : !selectedTable ? (
                <>
                  <Armchair className="w-5 h-5" />
                  <span>Choose Table in Step 5</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Confirm & Place Order</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-400">
              ⚡ No advance payment required. You will receive an Order Number and Live Tracking Token instantly upon confirmation.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Cart;
