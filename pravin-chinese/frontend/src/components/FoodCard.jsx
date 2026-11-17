import React, { useState } from 'react';
import { Plus, Minus, Check, Flame } from 'lucide-react';
import FoodTypeBadge from './FoodTypeBadge';
import { useCart } from '../context/CartContext';

const FoodCard = ({ dish }) => {
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const { addToCart, cartItems, updateQuantity } = useCart();

  const isOutOfStock = dish.availability === 'OUT_OF_STOCK';
  const cartItem = cartItems.find((item) => item.dish._id === dish._id);

  const handleAdd = () => {
    if (isOutOfStock) return;
    addToCart(dish, qty);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const fallbackImage =
    'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=800&auto=format&fit=crop&q=80';

  return (
    <div
      className={`group bg-white rounded-2xl overflow-hidden border border-brand-cream-border hover:border-amber-300 transition-all duration-300 flex flex-col justify-between hover:shadow-soft ${
        isOutOfStock ? 'opacity-70 grayscale-[30%]' : ''
      }`}
    >
      <div>
        {/* Image Container with Badge Overlays */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
          <img
            src={dish.imageUrl || fallbackImage}
            alt={dish.name}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = fallbackImage;
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Badges on image */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full shadow-xs">
            <FoodTypeBadge type={dish.foodType} showLabel />
          </div>

          {dish.isPopular && (
            <div className="absolute top-3 right-3 bg-brand-orange text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
              <Flame className="w-3 h-3 fill-white" />
              Popular
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-md">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug group-hover:text-brand-red transition-colors line-clamp-1">
              {dish.name}
            </h3>
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px] mb-3">
            {dish.description || `${dish.categoryName} delicacy seasoned with oriental herbs and spices.`}
          </p>

          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs text-slate-400 font-medium">Price</span>
              <div className="text-lg sm:text-xl font-black text-brand-red">
                ₹{dish.price}
              </div>
            </div>

            {dish.spiceLevel && (
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                🌶️ {dish.spiceLevel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 sm:p-5 pt-0">
        {cartItem ? (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-300 rounded-xl p-1.5">
            <button
              onClick={() => updateQuantity(dish._id, cartItem.quantity - 1)}
              className="w-8 h-8 rounded-lg bg-white text-brand-red font-bold flex items-center justify-center shadow-xs hover:bg-red-50 transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-extrabold text-slate-800 px-3">
              {cartItem.quantity} in Cart
            </span>
            <button
              onClick={() => updateQuantity(dish._id, cartItem.quantity + 1)}
              className="w-8 h-8 rounded-lg bg-brand-red text-white font-bold flex items-center justify-center shadow-xs hover:bg-brand-red-dark transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {!isOutOfStock && (
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 px-1 py-0.5">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors"
                  aria-label="Decrease"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-bold text-slate-800 w-5 text-center">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty(qty + 1)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors"
                  aria-label="Increase"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )}

            <button
              onClick={handleAdd}
              disabled={isOutOfStock}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 shadow-xs ${
                isOutOfStock
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : justAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-brand-red hover:bg-brand-red-dark text-white hover:shadow-md'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added!</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodCard;
