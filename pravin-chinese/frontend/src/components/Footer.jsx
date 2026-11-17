import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-red to-brand-orange flex items-center justify-center text-white text-xl font-bold">
                🥢
              </div>
              <span className="font-heading text-xl font-bold tracking-wider text-white">
                PRAVIN CHINESE
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Serving the authentic taste of sizzling Indo-Chinese gravies, wok-tossed noodles, and chef specialty crispy starters since 2010.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/menu" className="hover:text-white transition-colors">Our Menu</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">View Cart & Order</Link></li>
              <li><Link to="/track" className="hover:text-white transition-colors">Track Your Order</Link></li>
              <li><Link to="/admin/login" className="hover:text-white transition-colors">Admin Portal</Link></li>
            </ul>
          </div>

          {/* Contact & Hours */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Contact Us</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                <span>Shop No. 4, Food Court Lane, Main Market, Mumbai, Maharashtra</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-orange shrink-0" />
                <span>+91 98765 43210 / +91 91234 56789</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                <span>11:30 AM – 11:30 PM (All Days Open)</span>
              </li>
            </ul>
          </div>

          {/* Specialities */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Chef Specials</h4>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">Triple Schezwan Rice</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">Chicken Crispy</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">Paneer Satay</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">Manchow Soup</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">Dragon Noodles</span>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Pravin Chinese Restaurant. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" /> for food lovers.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
