import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Layers,
  Armchair,
  Receipt,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Menu,
  X,
  Volume2,
  VolumeX,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { socket } from '../services/socket';
import { useSoundAlert } from '../hooks/useSoundAlert';

const AdminLayout = () => {
  const { admin, logout, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { playAlert } = useSoundAlert();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderNotification, setNewOrderNotification] = useState(null);
  const [socketConnected, setSocketConnected] = useState(socket.connected);

  // Authentication protection
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/admin/login', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  // Real-time socket listeners for admin
  useEffect(() => {
    socket.emit('join:admin');

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);

    const handleNewOrder = (order) => {
      if (soundEnabled) {
        playAlert('newOrder');
      }
      setNewOrderNotification(order);
      // Auto-dismiss after 8 seconds
      setTimeout(() => setNewOrderNotification(null), 8000);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('order:new', handleNewOrder);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('order:new', handleNewOrder);
    };
  }, [soundEnabled, playAlert]);

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Orders', path: '/admin/orders', icon: ClipboardList },
    { name: 'Menu Management', path: '/admin/menu', icon: UtensilsCrossed },
    { name: 'Categories', path: '/admin/categories', icon: Layers },
    { name: 'Table Management', path: '/admin/tables', icon: Armchair },
    { name: 'Billing', path: '/admin/billing', icon: Receipt },
    { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { name: 'Settings', path: '/admin/settings', icon: SettingsIcon },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <p className="animate-pulse">Loading Admin Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xl">🥢</span>
          <span className="font-heading font-bold text-sm tracking-wider">PRAVIN ADMIN</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 h-screen z-50 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 shadow-xl transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo & Brand Header */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-red to-brand-orange flex items-center justify-center text-white text-xl shadow-md">
              🥢
            </div>
            <div>
              <h1 className="font-heading font-bold text-white tracking-wider text-base leading-tight">
                PRAVIN CHINESE
              </h1>
              <p className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase">
                Restaurant POS & Admin
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-brand-red text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions & User Profile */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          {/* View Customer Website Link */}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Customer View
            </span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Live</span>
          </a>

          {/* Admin User Info */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-800/60 rounded-xl">
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{admin?.name || 'Administrator'}</p>
              <p className="text-[11px] text-slate-400 truncate">{admin?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 capitalize">
              {location.pathname.split('/').pop().replace('-', ' ') || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Socket Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
              <Radio className={`w-3 h-3 ${socketConnected ? 'text-green-500 animate-pulse' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{socketConnected ? 'Live POS Connected' : 'Connecting...'}</span>
            </div>

            {/* Sound Notification Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                soundEnabled
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
              title={soundEnabled ? 'Order sound alert ON' : 'Order sound alert OFF'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-brand-orange" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Visual Popup Notification for New Orders */}
        {newOrderNotification && (
          <div className="fixed top-20 right-6 z-50 bg-brand-red text-white p-4 rounded-2xl shadow-2xl border-2 border-amber-300 animate-in slide-in-from-top-4 flex items-center gap-4 max-w-md">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-amber-300 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                🔔 New Order Received!
              </p>
              <p className="text-sm font-bold truncate">
                {newOrderNotification.orderNumber} • {newOrderNotification.tableNumber}
              </p>
              <p className="text-xs text-white/90">
                {newOrderNotification.items?.length || 0} items • ₹{newOrderNotification.totalAmount}
              </p>
            </div>
            <button
              onClick={() => {
                navigate('/admin/orders');
                setNewOrderNotification(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors shrink-0"
            >
              View
            </button>
          </div>
        )}

        {/* Child Pages render here */}
        <main className="p-4 sm:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
