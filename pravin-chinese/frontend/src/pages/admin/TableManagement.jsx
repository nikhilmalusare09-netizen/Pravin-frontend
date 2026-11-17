import React, { useState, useEffect } from 'react';
import {
  Armchair,
  Plus,
  Trash2,
  Edit2,
  Receipt,
  CheckCircle,
  AlertCircle,
  Clock,
  Unlock,
  Radio,
} from 'lucide-react';
import api from '../../services/api';
import { socket } from '../../services/socket';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  // Table add/edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Table details / running bill modal
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableBillData, setTableBillData] = useState(null);
  const [billLoading, setBillLoading] = useState(false);
  const [releaseLoading, setReleaseLoading] = useState(false);

  const sortTablesNaturally = (list) => {
    return [...list].sort((a, b) =>
      a.tableNumber.localeCompare(b.tableNumber, undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    );
  };

  const fetchTables = async () => {
    try {
      const res = await api.get('/tables');
      if (res.data.success) {
        setTables(sortTablesNaturally(res.data.tables));
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();

    // Listen to real-time table updates
    const handleUpdate = () => fetchTables();
    socket.on('table:updated', handleUpdate);
    socket.on('order:new', handleUpdate);

    return () => {
      socket.off('table:updated', handleUpdate);
      socket.off('order:new', handleUpdate);
    };
  }, []);

  const openAddModal = () => {
    setEditingTable(null);
    setTableNumber(`Table ${tables.length + 1}`);
    setCapacity(4);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (tbl) => {
    setEditingTable(tbl);
    setTableNumber(tbl.tableNumber);
    setCapacity(tbl.capacity || 4);
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveTable = async (e) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      setError('Table number is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (editingTable) {
        await api.put(`/tables/${editingTable._id}`, {
          tableNumber: tableNumber.trim(),
          capacity: Number(capacity),
        });
      } else {
        await api.post('/tables', {
          tableNumber: tableNumber.trim(),
          capacity: Number(capacity),
        });
      }
      setIsModalOpen(false);
      fetchTables();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save table');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTable = async (tableId, num) => {
    if (!window.confirm(`Delete ${num}?`)) return;
    try {
      await api.delete(`/tables/${tableId}`);
      fetchTables();
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete occupied table');
    }
  };

  const handleViewTableDetails = async (tbl) => {
    setSelectedTable(tbl);
    setBillLoading(true);
    try {
      const res = await api.get(`/billing/table/${tbl._id}`);
      if (res.data.success) {
        setTableBillData(res.data);
      }
    } catch (err) {
      console.error('Error fetching table bill:', err);
    } finally {
      setBillLoading(false);
    }
  };

  const handleReleaseTable = async (tableId) => {
    setReleaseLoading(true);
    try {
      const res = await api.post(`/tables/${tableId}/release`);
      if (res.data.success) {
        alert(res.data.message);
        setSelectedTable(null);
        fetchTables();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot release table with active orders or unpaid bills');
    } finally {
      setReleaseLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Table & Session Management
          </h1>
          <p className="text-xs text-slate-500">
            Monitor seated guests, running bills, active kitchen sessions, and table releases.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Dining Table</span>
        </button>
      </div>

      {/* Summary Counts */}
      <div className="flex items-center gap-4 text-xs font-bold bg-white p-4 rounded-2xl border border-slate-200">
        <span className="text-slate-400 uppercase tracking-wider">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span className="text-slate-800">
            Available ({tables.filter((t) => t.status === 'AVAILABLE').length})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span className="text-slate-800">
            Occupied ({tables.filter((t) => t.status === 'OCCUPIED').length})
          </span>
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <LoadingSpinner text="Checking live tables..." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tables.map((tbl) => {
            const isOccupied = tbl.status === 'OCCUPIED';
            const session = tbl.activeSessionId;
            const ordersCount = session?.orders?.length || 0;
            const sessionTotal = session?.totalAmount || 0;

            return (
              <div
                key={tbl._id}
                className={`bg-white rounded-3xl p-5 border-2 transition-all flex flex-col justify-between shadow-xs ${
                  isOccupied
                    ? 'border-red-200 bg-red-50/20'
                    : 'border-emerald-200 bg-emerald-50/20'
                }`}
              >
                <div>
                  {/* Top table info */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                        isOccupied
                          ? 'bg-red-100 text-red-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {tbl.status}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(tbl)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                        title="Edit Table"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!isOccupied && (
                        <button
                          onClick={() => handleDeleteTable(tbl._id, tbl.tableNumber)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                          title="Delete Table"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Table visual icon & number */}
                  <div className="text-center py-2 space-y-1">
                    <div
                      className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center font-bold text-2xl shadow-xs ${
                        isOccupied
                          ? 'bg-red-100 text-red-600'
                          : 'bg-emerald-100 text-emerald-600'
                      }`}
                    >
                      <Armchair className="w-7 h-7" />
                    </div>
                    <h3 className="font-heading font-black text-xl text-slate-900">
                      {tbl.tableNumber}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Capacity: {tbl.capacity || 4} Guests
                    </p>
                  </div>

                  {/* Active session & Running bill details */}
                  {isOccupied && (
                    <div className="mt-4 p-3 bg-white rounded-2xl border border-red-200/80 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Active Orders:</span>
                        <span className="font-bold text-slate-900">{ordersCount} orders</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Running Bill:</span>
                        <span className="font-black text-brand-red">₹{sessionTotal}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Bill Payment:</span>
                        <span
                          className={`font-black uppercase text-[10px] px-1.5 py-0.5 rounded ${
                            session?.paymentStatus === 'PAID'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {session?.paymentStatus || 'PENDING'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100">
                  {isOccupied ? (
                    <button
                      onClick={() => handleViewTableDetails(tbl)}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Manage Session & Bill</span>
                    </button>
                  ) : (
                    <p className="text-center text-[11px] text-emerald-700 font-bold py-1">
                      Ready for Seating
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE SESSION & RUNNING BILL MODAL */}
      <Modal
        isOpen={!!selectedTable}
        onClose={() => setSelectedTable(null)}
        title={`Session Details: ${selectedTable?.tableNumber}`}
        maxWidth="max-w-xl"
      >
        {selectedTable && (
          <div className="space-y-6">
            {billLoading ? (
              <LoadingSpinner text="Loading running bill..." />
            ) : tableBillData?.session ? (
              <div className="space-y-4">
                {/* Session Summary Card */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Orders In Session
                    </p>
                    <p className="font-bold text-slate-800">
                      {tableBillData.session.ordersCount} Dining Orders
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Payment Status
                    </p>
                    <span
                      className={`font-black uppercase text-xs px-2 py-0.5 rounded ${
                        tableBillData.session.paymentStatus === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {tableBillData.session.paymentStatus}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Running Total
                    </p>
                    <p className="text-lg font-black text-brand-red">
                      ₹{tableBillData.session.grandTotal}
                    </p>
                  </div>
                </div>

                {/* Aggregated Dishes */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Combined Order Items
                  </h4>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs max-h-56 overflow-y-auto">
                    {tableBillData.session.items?.map((it, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800">{it.dishName}</p>
                          <p className="text-[10px] text-slate-400">Order: {it.orderNumber}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-slate-600 mr-3">{it.quantity}x ₹{it.unitPrice}</span>
                          <span className="font-black text-slate-900">₹{it.itemTotal}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Release Table Alert / Instructions */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <p className="font-bold">Table Release Rules:</p>
                  <p className="text-[11px] text-amber-800">
                    Tables can only be released after all active orders are marked Completed or Served and the running bill is settled/marked Paid.
                  </p>
                </div>

                {/* Action button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedTable(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                  >
                    Close
                  </button>

                  <button
                    disabled={releaseLoading}
                    onClick={() => handleReleaseTable(selectedTable._id)}
                    className="px-6 py-2.5 rounded-xl bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>{releaseLoading ? 'Releasing...' : 'Release Table Now'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No active session on this table.</p>
            )}
          </div>
        )}
      </Modal>

      {/* ADD / EDIT TABLE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTable ? 'Edit Table' : 'Add New Dining Table'}
      >
        <form onSubmit={handleSaveTable} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Table Name / Number *
            </label>
            <input
              type="text"
              required
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="e.g. Table 11 or Patio 1"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Guest Capacity (Seats)
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded-xl bg-brand-red text-white text-xs font-bold"
            >
              {submitting ? 'Saving...' : 'Save Table'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default TableManagement;
