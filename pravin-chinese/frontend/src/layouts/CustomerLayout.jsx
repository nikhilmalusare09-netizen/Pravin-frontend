import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { ShoppingBag, ArrowRight } from 'lucide-react';

const CustomerLayout = () => {
  const { totalItems, subtotal } = useCart();
  const location = useLocation();

  // Hide floating cart button on cart page itself
  const showFloatingCart = totalItems > 0 && location.pathname !== '/cart';

  return (
    <div className="flex flex-col min-h-screen bg-brand-cream">
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Floating Bottom Cart Bar for Mobile & Quick Checkout */}
      {showFloatingCart && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 animate-in slide-in-from-bottom-4 duration-300">
          <Link
            to="/cart"
            className="flex items-center justify-between p-3.5 sm:p-4 bg-brand-red hover:bg-brand-red-dark text-white rounded-2xl shadow-xl transition-all duration-200 border-2 border-amber-300/40"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <p className="text-xs text-white/80 font-medium">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'} in cart
                </p>
                <p className="text-base font-extrabold text-white">₹{subtotal}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold bg-white text-brand-red px-3.5 py-2 rounded-xl shadow-xs">
              <span>View Cart</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default CustomerLayout;
