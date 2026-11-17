import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('pravin_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [selectedTable, setSelectedTable] = useState(() => {
    try {
      const saved = localStorage.getItem('pravin_selected_table');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('pravin_cart', JSON.stringify(cartItems));
    } catch (e) {}
  }, [cartItems]);

  useEffect(() => {
    try {
      if (selectedTable) {
        localStorage.setItem('pravin_selected_table', JSON.stringify(selectedTable));
      } else {
        localStorage.removeItem('pravin_selected_table');
      }
    } catch (e) {}
  }, [selectedTable]);

  const addToCart = (dish, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.dish._id === dish._id);
      if (existing) {
        return prev.map((item) =>
          item.dish._id === dish._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prev, { dish, quantity }];
      }
    });
  };

  const updateQuantity = (dishId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(dishId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.dish._id === dishId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (dishId) => {
    setCartItems((prev) => prev.filter((item) => item.dish._id !== dishId));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('pravin_cart');
  };

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.dish.price * item.quantity,
    0
  );
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const totalAmount = subtotal + tax;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        selectedTable,
        setSelectedTable,
        totalItems,
        subtotal,
        tax,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
