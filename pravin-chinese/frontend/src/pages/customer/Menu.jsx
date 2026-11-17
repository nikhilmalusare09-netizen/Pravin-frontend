import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Utensils, X, Sparkles } from 'lucide-react';
import api from '../../services/api';
import FoodCard from '../../components/FoodCard';
import LoadingSpinner from '../../components/LoadingSpinner';

const categoriesList = [
  'ALL',
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

const Menu = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFoodType = searchParams.get('foodType') || 'ALL';
  const initialCategory = searchParams.get('category') || 'ALL';

  const [foodType, setFoodType] = useState(initialFoodType);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync state with URL params
  useEffect(() => {
    const typeParam = searchParams.get('foodType');
    if (typeParam) setFoodType(typeParam);

    const catParam = searchParams.get('category');
    if (catParam) setSelectedCategory(catParam);
  }, [searchParams]);

  useEffect(() => {
    const fetchDishes = async () => {
      setLoading(true);
      try {
        const params = {};
        if (foodType && foodType !== 'ALL') params.foodType = foodType;
        if (selectedCategory && selectedCategory !== 'ALL') params.category = selectedCategory;
        if (searchQuery.trim()) params.search = searchQuery.trim();

        const res = await api.get('/dishes', { params });
        if (res.data.success) {
          setDishes(res.data.dishes);
        }
      } catch (err) {
        console.error('Error fetching menu dishes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDishes();
  }, [foodType, selectedCategory, searchQuery]);

  const handleFoodTypeChange = (type) => {
    setFoodType(type);
    const newParams = new URLSearchParams(searchParams);
    if (type === 'ALL') {
      newParams.delete('foodType');
    } else {
      newParams.set('foodType', type);
    }
    setSearchParams(newParams);
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    const newParams = new URLSearchParams(searchParams);
    if (cat === 'ALL') {
      newParams.delete('category');
    } else {
      newParams.set('category', cat);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* HEADER BANNER */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-extrabold uppercase tracking-widest text-brand-orange">
          Fresh From The Wok
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-black text-slate-900">
          Our Full Restaurant Menu
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Explore delicious appetizers, rich gravies, aromatic fried rices and sizzling noodles.
        </p>
      </div>

      {/* STEP 1: FOOD TYPE SELECTOR (LARGE TABS) */}
      <div className="bg-white p-4 rounded-3xl border border-brand-cream-border shadow-xs">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center sm:text-left">
          Step 1: Choose Food Type
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          
          {/* ALL BUTTON */}
          <button
            onClick={() => handleFoodTypeChange('ALL')}
            className={`py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              foodType === 'ALL'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>All Dishes</span>
          </button>

          {/* VEG BUTTON */}
          <button
            onClick={() => handleFoodTypeChange('VEG')}
            className={`py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              foodType === 'VEG'
                ? 'bg-green-600 text-white shadow-md ring-2 ring-green-600/30'
                : 'bg-green-50 hover:bg-green-100 text-green-800 border border-green-200'
            }`}
          >
            <span className="w-3.5 h-3.5 border-2 border-current rounded-xs flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            </span>
            <span>Pure Veg</span>
          </button>

          {/* NON-VEG BUTTON */}
          <button
            onClick={() => handleFoodTypeChange('NON_VEG')}
            className={`py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              foodType === 'NON_VEG'
                ? 'bg-brand-red text-white shadow-md ring-2 ring-brand-red/30'
                : 'bg-red-50 hover:bg-red-100 text-brand-red border border-red-200'
            }`}
          >
            <span className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[9px] border-b-current"></span>
            <span>Non-Veg</span>
          </button>

          {/* EGG BUTTON */}
          <button
            onClick={() => handleFoodTypeChange('EGG')}
            className={`py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              foodType === 'EGG'
                ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-500/30'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-current"></span>
            <span>Egg Dishes</span>
          </button>

        </div>
      </div>

      {/* SEARCH BAR & CATEGORIES */}
      <div className="space-y-4">
        {/* Search input */}
        <div className="relative max-w-md mx-auto sm:mx-0">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search dish (e.g., Manchurian, Chopsuey, Triple Rice)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white border border-brand-cream-border text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-red/40 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* STEP 2: CATEGORY HORIZONTAL FILTER PILLS */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Step 2: Filter by Category
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 ${
                  selectedCategory === cat
                    ? 'bg-brand-orange text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-amber-50 border border-slate-200/80 hover:border-amber-200'
                }`}
              >
                {cat === 'ALL' ? '🍽️ All Categories' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* STEP 3: FOOD ITEMS GRID */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Showing {dishes.length} {dishes.length === 1 ? 'Dish' : 'Dishes'}
            {selectedCategory !== 'ALL' && ` in "${selectedCategory}"`}
            {foodType !== 'ALL' && ` (${foodType})`}
          </p>
        </div>

        {loading ? (
          <LoadingSpinner text="Cooking up our menu items..." />
        ) : dishes.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-brand-orange flex items-center justify-center mx-auto text-2xl">
              🔍
            </div>
            <h3 className="font-heading font-bold text-xl text-slate-800">
              No Dishes Found
            </h3>
            <p className="text-xs text-slate-500">
              We couldn't find any dishes matching your filters. Try clearing your search query or switching categories.
            </p>
            <button
              onClick={() => {
                setFoodType('ALL');
                setSelectedCategory('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {dishes.map((dish) => (
              <FoodCard key={dish._id} dish={dish} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Menu;
