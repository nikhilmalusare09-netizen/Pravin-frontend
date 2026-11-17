import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Store,
  ShieldCheck,
  Percent,
  CheckCircle,
  Database,
  Radio,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Settings = () => {
  const { admin } = useAuth();
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [restaurantName, setRestaurantName] = useState('PRAVIN CHINESE');
  const [contactPhone, setContactPhone] = useState('+91 98765 43210');
  const [address, setAddress] = useState('Shop No. 4, Food Court Lane, Main Market, Mumbai');
  const [gstin, setGstin] = useState('27AABCP1234F1Z8');
  const [taxRate, setTaxRate] = useState('5');

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      
      <div>
        <h1 className="text-2xl font-black text-slate-900">
          Restaurant System Settings
        </h1>
        <p className="text-xs text-slate-500">
          Configure restaurant billing metadata, tax rules, and staff security.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-2xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Restaurant profile settings updated successfully.</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Store className="w-4 h-4 text-brand-orange" />
          <span>Restaurant Profile Details</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Restaurant Name
            </label>
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-brand-red focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Contact Phone Numbers
            </label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Physical Outlet Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              GSTIN / Tax ID Number
            </label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              GST Restaurant Tax Rate (%)
            </label>
            <div className="relative">
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-hidden"
              />
              <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* System Diagnostics Box */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Architecture & Environment Status</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block text-[10px]">Database</span>
              <span className="font-bold text-emerald-700">MongoDB Atlas / Local</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block text-[10px]">Realtime Engine</span>
              <span className="font-bold text-blue-700">Socket.IO WebSockets</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block text-[10px]">Image CDN</span>
              <span className="font-bold text-purple-700">Cloudinary / Express</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs shadow-xs transition-colors"
          >
            Save Settings
          </button>
        </div>

      </form>

    </div>
  );
};

export default Settings;
