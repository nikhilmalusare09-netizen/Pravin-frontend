import React from 'react';

const FoodTypeBadge = ({ type, showLabel = false }) => {
  const normType = (type || 'VEG').toUpperCase();

  if (normType === 'VEG') {
    return (
      <span className="inline-flex items-center gap-1.5" title="Pure Vegetarian">
        <span className="inline-flex items-center justify-center w-4 h-4 border border-green-600 rounded-sm bg-white p-0.5">
          <span className="w-2 h-2 rounded-full bg-green-600"></span>
        </span>
        {showLabel && <span className="text-xs font-semibold text-green-700">Veg</span>}
      </span>
    );
  }

  if (normType === 'EGG') {
    return (
      <span className="inline-flex items-center gap-1.5" title="Contains Egg">
        <span className="inline-flex items-center justify-center w-4 h-4 border border-amber-600 rounded-sm bg-white p-0.5">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
        </span>
        {showLabel && <span className="text-xs font-semibold text-amber-700">Egg</span>}
      </span>
    );
  }

  // NON_VEG
  return (
    <span className="inline-flex items-center gap-1.5" title="Non-Vegetarian">
      <span className="inline-flex items-center justify-center w-4 h-4 border border-red-600 rounded-sm bg-white p-0.5">
        <span className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-red-600"></span>
      </span>
      {showLabel && <span className="text-xs font-semibold text-red-700">Non-Veg</span>}
    </span>
  );
};

export default FoodTypeBadge;
