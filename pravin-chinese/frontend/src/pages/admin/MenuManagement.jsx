import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Filter,
  Flame,
  Upload,
} from 'lucide-react';
import api from '../../services/api';
import FoodTypeBadge from '../../components/FoodTypeBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';

const CATEGORIES = [
  'Starters',
  'Gravies & Dries',
  'Chopsuey',
  'Rice',
  'Rice With Gravy',
  'Noodles',
  'Noodles With Gravy',
  'Soup',
  'Extra',
];

const MenuManagement = () => {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Form fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Starters');
  const [formFoodType, setFormFoodType] = useState('VEG');
  const [formPrice, setFormPrice] = useState('');
  const [formAvailability, setFormAvailability] = useState('AVAILABLE');
  const [formSpiceLevel, setFormSpiceLevel] = useState('Medium');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formImageFile, setFormImageFile] = useState(null);
  const [formIsPopular, setFormIsPopular] = useState(false);

  const fetchDishes = async () => {
    try {
      const params = {};
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/dishes', { params });
      if (res.data.success) {
        setDishes(res.data.dishes);
      }
    } catch (err) {
      console.error('Error fetching dishes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDishes();
  }, [categoryFilter, searchQuery]);

  const openAddModal = () => {
    setEditingDish(null);
    setFormName('');
    setFormCategory('Starters');
    setFormFoodType('VEG');
    setFormPrice('');
    setFormAvailability('AVAILABLE');
    setFormSpiceLevel('Medium');
    setFormDescription('');
    setFormImageUrl('');
    setFormImageFile(null);
    setFormIsPopular(false);
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (dish) => {
    setEditingDish(dish);
    setFormName(dish.name);
    setFormCategory(dish.categoryName || 'Starters');
    setFormFoodType(dish.foodType || 'VEG');
    setFormPrice(dish.price);
    setFormAvailability(dish.availability || 'AVAILABLE');
    setFormSpiceLevel(dish.spiceLevel || 'Medium');
    setFormDescription(dish.description || '');
    setFormImageUrl(dish.imageUrl || '');
    setFormImageFile(null);
    setFormIsPopular(dish.isPopular || false);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleToggleAvailability = async (dish) => {
    const newStatus = dish.availability === 'AVAILABLE' ? 'OUT_OF_STOCK' : 'AVAILABLE';
    try {
      const res = await api.put(`/dishes/${dish._id}`, {
        availability: newStatus,
      });
      if (res.data.success) {
        setDishes((prev) =>
          prev.map((d) => (d._id === dish._id ? { ...d, availability: newStatus } : d))
        );
      }
    } catch (err) {
      alert('Failed to update dish availability');
    }
  };

  const handleDeleteDish = async (dishId, dishName) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${dishName}" from menu?`)) {
      return;
    }

    try {
      const res = await api.delete(`/dishes/${dishId}`);
      if (res.data.success) {
        setDishes((prev) => prev.filter((d) => d._id !== dishId));
      }
    } catch (err) {
      alert('Failed to delete dish');
    }
  };

  const handleSaveDish = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice) {
      setModalError('Dish name and price are required.');
      return;
    }

    setSubmitting(true);
    setModalError('');

    try {
      const formData = new FormData();
      formData.append('name', formName.trim());
      formData.append('categoryName', formCategory);
      formData.append('foodType', formFoodType);
      formData.append('price', formPrice);
      formData.append('availability', formAvailability);
      formData.append('spiceLevel', formSpiceLevel);
      formData.append('description', formDescription);
      formData.append('isPopular', formIsPopular);

      if (formImageFile) {
        formData.append('image', formImageFile);
      } else if (formImageUrl) {
        formData.append('imageUrl', formImageUrl);
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      if (editingDish) {
        await api.put(`/dishes/${editingDish._id}`, formData, config);
      } else {
        await api.post('/dishes', formData, config);
      }

      setIsModalOpen(false);
      fetchDishes();
    } catch (err) {
      console.error('Error saving dish:', err);
      setModalError(err.response?.data?.message || 'Failed to save dish');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Menu Management
          </h1>
          <p className="text-xs text-slate-500">
            Add, update dishes, modify prices, toggle out of stock, and upload food photos.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors self-end sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search dish by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-brand-red/30 focus:outline-hidden"
          />
        </div>

        {/* Category selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Category:
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-red/30 focus:outline-hidden"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dishes Table */}
      {loading ? (
        <LoadingSpinner text="Loading dishes from MongoDB..." />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Dish Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Food Type</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Availability Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dishes.map((dish) => {
                  const isAvailable = dish.availability === 'AVAILABLE';

                  return (
                    <tr key={dish._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Photo */}
                      <td className="py-3 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={dish.imageUrl || 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=200&q=80'}
                            alt={dish.name}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">
                              {dish.name}
                            </p>
                            {dish.isPopular && (
                              <span className="text-[10px] text-brand-orange font-bold flex items-center gap-0.5">
                                <Flame className="w-3 h-3 fill-brand-orange" />
                                Popular
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 font-semibold text-slate-600">
                        {dish.categoryName}
                      </td>

                      {/* Food Type */}
                      <td className="py-3 px-4">
                        <FoodTypeBadge type={dish.foodType} showLabel />
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-black text-brand-red text-sm">
                        ₹{dish.price}
                      </td>

                      {/* Toggle Stock Switch */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(dish)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-xs ${
                            isAvailable
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isAvailable ? 'bg-emerald-600' : 'bg-red-600'
                            }`}
                          />
                          <span>{isAvailable ? 'Available' : 'Out of Stock'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 sm:px-6 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => openEditModal(dish)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                          title="Edit Dish"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDish(dish._id, dish.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete Dish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT DISH MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDish ? `Edit Dish: ${editingDish.name}` : 'Add New Restaurant Dish'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveDish} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{modalError}</span>
            </div>
          )}

          {/* Dish Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Dish Name *
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Chicken Lollipops"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-brand-red/30 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Category *
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-hidden"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Food Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Food Type *
              </label>
              <select
                value={formFoodType}
                onChange={(e) => setFormFoodType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-hidden"
              >
                <option value="VEG">Pure Veg</option>
                <option value="NON_VEG">Non-Veg</option>
                <option value="EGG">Egg</option>
              </select>
            </div>

            {/* Price in INR */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Price (INR ₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="290"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-brand-red focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Availability */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Availability
              </label>
              <select
                value={formAvailability}
                onChange={(e) => setFormAvailability(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-hidden"
              >
                <option value="AVAILABLE">AVAILABLE (In Stock)</option>
                <option value="OUT_OF_STOCK">OUT_OF_STOCK (Hidden)</option>
              </select>
            </div>

            {/* Spice Level */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Spice Level
              </label>
              <select
                value={formSpiceLevel}
                onChange={(e) => setFormSpiceLevel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-hidden"
              >
                <option value="Mild">Mild</option>
                <option value="Medium">Medium</option>
                <option value="Hot">Hot</option>
                <option value="Extra Hot">Extra Hot</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Crisp seasoned chicken winglets tossed in fiery schezwan garlic..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden"
            />
          </div>

          {/* Image Upload or URL */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Dish Image
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormImageFile(e.target.files[0])}
                  className="text-xs text-slate-500 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
              </div>
              <div>
                <input
                  type="url"
                  placeholder="Or paste image URL..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Checkbox Popular */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isPopular"
              checked={formIsPopular}
              onChange={(e) => setFormIsPopular(e.target.checked)}
              className="w-4 h-4 rounded text-brand-red focus:ring-brand-red"
            />
            <label htmlFor="isPopular" className="text-xs font-bold text-slate-700">
              Feature as Chef Popular Special on Homepage
            </label>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs shadow-xs transition-colors"
            >
              {submitting ? 'Saving Dish...' : editingDish ? 'Update Dish' : 'Create Dish'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default MenuManagement;
