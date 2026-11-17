import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Utensils, Search, Menu as MenuIcon, X, Shield, Navigation } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { totalItems } = useCart();
  const { isAuthenticated } = useAuth();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Menu', path: '/menu' },
    { name: 'Track Order', path: '/track' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-cream-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-red to-brand-red-dark flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-200">
              <span className="text-2xl">🥢</span>
            </div>
            <div>
              <span className="block font-heading text-xl sm:text-2xl font-black tracking-wider text-brand-red uppercase leading-none">
                Pravin Chinese
              </span>
              <span className="text-[10px] sm:text-xs font-semibold tracking-widest text-brand-orange uppercase">
                Authentic Indo-Chinese Delights
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-semibold transition-colors duration-150 py-1 ${
                  isActive(link.path)
                    ? 'text-brand-red border-b-2 border-brand-red'
                    : 'text-slate-600 hover:text-brand-red'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Cart Button */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-brand-red transition-all duration-200 group border border-amber-200/60 shadow-xs"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand-red text-white text-[11px] font-bold flex items-center justify-center shadow-md animate-bounce">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Admin Dashboard shortcut / Login */}
            {isAuthenticated ? (
              <Link
                to="/admin/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-red text-white text-xs font-bold hover:bg-brand-red-dark transition-colors shadow-xs"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin POS</span>
              </Link>
            ) : (
              <Link
                to="/admin/login"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-500 hover:text-brand-red hover:bg-slate-50 text-xs font-semibold transition-colors"
                title="Staff Login"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Staff</span>
              </Link>
            )}

            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                isActive(link.path)
                  ? 'bg-red-50 text-brand-red font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.name}
            </Link>
          ))}

          <div className="pt-2 border-t border-slate-100">
            {isAuthenticated ? (
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-brand-red font-bold bg-red-50"
              >
                <Shield className="w-4 h-4" />
                Admin Dashboard
              </Link>
            ) : (
              <Link
                to="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900"
              >
                <Shield className="w-4 h-4" />
                Staff Admin Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
