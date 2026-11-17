import React from 'react';

const OrderStatusBadge = ({ status }) => {
  const norm = (status || 'PENDING').toUpperCase();

  const styles = {
    PENDING: 'bg-amber-100 text-amber-800 border-amber-300',
    APPROVED: 'bg-blue-100 text-blue-800 border-blue-300',
    PREPARING: 'bg-orange-100 text-orange-800 border-orange-300 animate-pulse',
    READY: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    SERVED: 'bg-teal-100 text-teal-800 border-teal-300',
    COMPLETED: 'bg-green-100 text-green-800 border-green-300',
    REJECTED: 'bg-red-100 text-red-800 border-red-300',
  };

  const labels = {
    PENDING: 'Pending Approval',
    APPROVED: 'Approved',
    PREPARING: 'Preparing',
    READY: 'Ready to Serve',
    SERVED: 'Served',
    COMPLETED: 'Completed',
    REJECTED: 'Rejected',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
        styles[norm] || styles.PENDING
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          norm === 'REJECTED'
            ? 'bg-red-600'
            : norm === 'COMPLETED' || norm === 'READY'
            ? 'bg-green-600'
            : norm === 'PREPARING'
            ? 'bg-orange-500'
            : 'bg-blue-600'
        }`}
      />
      {labels[norm] || norm}
    </span>
  );
};

export default OrderStatusBadge;
