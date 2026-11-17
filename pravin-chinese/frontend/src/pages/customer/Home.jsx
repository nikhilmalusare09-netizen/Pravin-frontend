import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Utensils,
  ArrowRight,
  Clock,
  Sparkles,
  Flame,
  Search,
  CheckCircle2,
  Award,
} from 'lucide-react';
import api from '../../services/api';
import FoodCard from '../../components/FoodCard';
import FoodTypeBadge from '../../components/FoodTypeBadge';

const Home = () => {
  const navigate = useNavigate();
  const [popularDishes, setPopularDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const res = await api.get('/dishes?popularOnly=true');
        if (res.data.success) {
          setPopularDishes(res.data.dishes.slice(0, 6));
        }
      } catch (err) {
        console.error('Failed to load popular dishes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPopular();
  }, []);

  const handleFoodTypeSelect = (type) => {
    navigate(`/menu?foodType=${type}`);
  };

  return (
    <div className="space-y-16 sm:space-y-24">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-red via-brand-red-dark to-slate-950 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 shadow-2xl">
        
        {/* Background Decorative Patterns */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-brand-orange/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          
          {/* Hero Text */}
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Authentic Indo-Chinese Kitchen</span>
            </div>

            <h1 className="font-heading text-4xl sm:text-6xl font-black tracking-tight leading-none text-white">
              Savor The True <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200">
                Wok Flame Taste
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-200 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Welcome to <strong className="text-amber-300 font-bold">PRAVIN CHINESE</strong>. Experience sizzling gravies, steaming triple schezwan rice, crispy chicken winglets, and handcrafted dim sum made fresh to your table.
            </p>

            {/* Main Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-4">
              <Link
                to="/menu"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-orange to-amber-500 hover:from-amber-500 hover:to-brand-orange text-slate-950 font-black text-sm uppercase tracking-wider shadow-glow hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>Start Ordering</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/track"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-sm border border-white/25 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4 text-amber-300" />
                <span>Track Your Order</span>
              </Link>

              <Link
                to="/menu"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-black/30 hover:bg-black/50 text-slate-200 font-semibold text-sm border border-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <Utensils className="w-4 h-4" />
                <span>View Menu</span>
              </Link>
            </div>

            {/* Quick trust metrics */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-white/10 text-center sm:text-left">
              <div>
                <p className="text-2xl font-black text-amber-300">130+</p>
                <p className="text-xs text-slate-300">Dishes in Menu</p>
              </div>
              <div>
                <p className="text-2xl font-black text-amber-300">100%</p>
                <p className="text-xs text-slate-300">Fresh Ingredients</p>
              </div>
              <div>
                <p className="text-2xl font-black text-amber-300">Live</p>
                <p className="text-xs text-slate-300">Kitchen Tracking</p>
              </div>
            </div>
          </div>

          {/* Hero Visual Food Banner */}
          <div className="relative flex justify-center">
            <div className="relative w-full max-w-lg aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 group">
              <img
                src="https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=1000&auto=format&fit=crop&q=85"
                alt="Pravin Chinese Specialty"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                <span className="text-amber-300 text-xs font-bold uppercase tracking-widest">
                  Chef Signature
                </span>
                <p className="text-2xl font-heading font-black text-white">
                  Chicken Crispy & Triple Schezwan Rice
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Served with steaming hot schezwan sauce and crispy noodles.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* STEP 1: FOOD TYPE SELECTION CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-extrabold uppercase tracking-widest text-brand-orange">
            Step 1 • Choose Your Preference
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-black text-slate-900 mt-1">
            What Are You Craving Today?
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Select pure vegetarian or hearty non-vegetarian options with a single tap.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          
          {/* PURE VEG CARD */}
          <div
            onClick={() => handleFoodTypeSelect('VEG')}
            className="group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-green-200 bg-gradient-to-br from-green-50/80 to-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-green-500 hover:shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div className="w-16 h-16 rounded-2xl bg-green-100 border-2 border-green-600 flex items-center justify-center shadow-xs">
                <div className="w-8 h-8 rounded-full bg-green-600"></div>
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-green-700 bg-green-100/80 px-3 py-1 rounded-full">
                100% Pure Veg
              </span>
            </div>

            <div className="mt-8 space-y-2">
              <h3 className="font-heading text-2xl sm:text-3xl font-black text-green-950 group-hover:text-green-700 transition-colors">
                VEGETARIAN
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Paneer Crispy, Manchurian, Bamboo Rice, Mushroom Chilly, Veg Hakka Noodles and authentic gravies.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm font-bold text-green-700 group-hover:translate-x-1 transition-transform">
              <span>Browse Veg Dishes</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* NON-VEG CARD */}
          <div
            onClick={() => handleFoodTypeSelect('NON_VEG')}
            className="group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-red-200 bg-gradient-to-br from-red-50/80 to-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand-red hover:shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div className="w-16 h-16 rounded-2xl bg-red-100 border-2 border-red-600 flex items-center justify-center shadow-xs">
                <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[24px] border-b-red-600"></div>
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-red-700 bg-red-100/80 px-3 py-1 rounded-full">
                Chef Specialty
              </span>
            </div>

            <div className="mt-8 space-y-2">
              <h3 className="font-heading text-2xl sm:text-3xl font-black text-red-950 group-hover:text-brand-red transition-colors">
                NON-VEGETARIAN
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Chicken Lollipops, Chicken Crispy, Satay Skewers, Lung Fung Soup, Schezwan Chicken Gravy & Noodles.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm font-bold text-brand-red group-hover:translate-x-1 transition-transform">
              <span>Browse Non-Veg Dishes</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

        </div>

        {/* EGG FILTER QUICK BADGE */}
        <div className="mt-6 flex items-center justify-center">
          <button
            onClick={() => handleFoodTypeSelect('EGG')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-xs font-bold text-amber-900 transition-colors shadow-xs"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-amber-500"></div>
            <span>Looking for Egg Dishes? (Egg Rice, Egg Hakka Noodles & Omelette)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* POPULAR DISHES PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-brand-orange text-xs font-extrabold uppercase tracking-widest">
              <Flame className="w-4 h-4" />
              <span>Customer Favorites</span>
            </div>
            <h2 className="font-heading text-3xl font-black text-slate-900 mt-1">
              Most Loved Dishes
            </h2>
          </div>

          <Link
            to="/menu"
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-red hover:text-brand-red-dark group"
          >
            <span>Explore All 130+ Dishes</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-slate-200/70 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularDishes.map((dish) => (
              <FoodCard key={dish._id} dish={dish} />
            ))}
          </div>
        )}
      </section>

      {/* HOW TO ORDER SECTION */}
      <section className="bg-white border-y border-brand-cream-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-red">
              Easy 3-Step Experience
            </span>
            <h2 className="font-heading text-3xl font-black text-slate-900 mt-1">
              How Dining Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-brand-cream text-center space-y-3 border border-amber-200/60">
              <div className="w-12 h-12 rounded-xl bg-brand-red text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
                1
              </div>
              <h3 className="font-bold text-lg text-slate-900">Choose Dishes & Table</h3>
              <p className="text-xs text-slate-600">
                Browse our complete menu, pick your favorite items and select your seated dining table.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-brand-cream text-center space-y-3 border border-amber-200/60">
              <div className="w-12 h-12 rounded-xl bg-brand-orange text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
                2
              </div>
              <h3 className="font-bold text-lg text-slate-900">Instant Kitchen Notice</h3>
              <p className="text-xs text-slate-600">
                Your order is transmitted directly to our chefs on the kitchen POS dashboard with zero delays.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-brand-cream text-center space-y-3 border border-amber-200/60">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
                3
              </div>
              <h3 className="font-bold text-lg text-slate-900">Live Status & Savor</h3>
              <p className="text-xs text-slate-600">
                Track preparation progress in real time right from your phone until served piping hot.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
