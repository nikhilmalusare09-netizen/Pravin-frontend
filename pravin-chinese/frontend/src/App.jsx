import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';

// Customer Pages
import Home from './pages/customer/Home';
import Menu from './pages/customer/Menu';
import Cart from './pages/customer/Cart';
import OrderSuccess from './pages/customer/OrderSuccess';
import OrderTracking from './pages/customer/OrderTracking';

// Admin Pages
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Orders from './pages/admin/Orders';
import MenuManagement from './pages/admin/MenuManagement';
import Categories from './pages/admin/Categories';
import TableManagement from './pages/admin/TableManagement';
import Billing from './pages/admin/Billing';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';

function App() {
  return (
    <Routes>
      {/* Customer Routes (No auth required) */}
      <Route path="/" element={<CustomerLayout />}>
        <Route index element={<Home />} />
        <Route path="menu" element={<Menu />} />
        <Route path="cart" element={<Cart />} />
        <Route path="table-select" element={<Navigate to="/cart" replace />} />
        <Route path="order-success" element={<OrderSuccess />} />
        <Route path="track" element={<OrderTracking />} />
        <Route path="track/:orderNumber" element={<OrderTracking />} />
      </Route>

      {/* Admin Authentication */}
      <Route path="/admin/login" element={<Login />} />

      {/* Protected Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="menu" element={<MenuManagement />} />
        <Route path="categories" element={<Categories />} />
        <Route path="tables" element={<TableManagement />} />
        <Route path="billing" element={<Billing />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
