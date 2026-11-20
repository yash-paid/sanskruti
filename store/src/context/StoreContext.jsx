import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_PRODUCTS } from '../data/products';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  // Products (synced with localStorage for Admin updates)
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('febric_products');
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  useEffect(() => {
    localStorage.setItem('febric_products', JSON.stringify(products));
  }, [products]);

  // Cart
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('febric_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('febric_cart', JSON.stringify(cart));
  }, [cart]);

  // Orders
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('febric_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('febric_orders', JSON.stringify(orders));
  }, [orders]);

  // UI States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { ...product, quantity: qty }];
    });
    showToast(`Added "${product.title.substring(0, 32)}..." to cart!`);
    setIsCartOpen(true);
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
    showToast('Item removed from cart');
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Pricing math
  const cartSubtotal = cart.reduce((acc, item) => acc + item.salePrice * item.quantity, 0);
  const cartOriginalTotal = cart.reduce((acc, item) => acc + item.regularPrice * item.quantity, 0);
  const discountAmount = appliedCoupon ? Math.round(cartSubtotal * appliedCoupon.discountPct / 100) : 0;
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const applyCoupon = (code) => {
    const clean = code.trim().toUpperCase();
    if (clean === 'SANSKRUTI10' || clean === 'FEBRIC10' || clean === 'WELCOME10') {
      setAppliedCoupon({ code: clean, discountPct: 10 });
      showToast(`Coupon "${clean}" applied! 10% Extra Discount`);
      return { success: true, message: '10% discount applied!' };
    }
    if (clean === 'SANSKRUTI20' || clean === 'SAVE20') {
      setAppliedCoupon({ code: clean, discountPct: 20 });
      showToast(`Coupon "${clean}" applied! 20% Extra Discount`);
      return { success: true, message: '20% discount applied!' };
    }
    showToast('Invalid coupon code. Try "SANSKRUTI10"');
    return { success: false, message: 'Invalid coupon code. Try SANSKRUTI10' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon removed');
  };

  const createOrder = ({ customer, paymentMethod, items, total }) => {
    const orderId = 'SKT-' + Math.floor(100000 + Math.random() * 900000);
    const newOrder = {
      orderId,
      date: new Date().toISOString(),
      customer,
      paymentMethod,
      items: items || cart,
      total: total !== undefined ? total : cartTotal,
      status: 'Completed (Verified)',
      downloadReady: true
    };
    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  // Admin Actions
  const addProduct = (newProd) => {
    const p = {
      ...newProd,
      id: 'prod-' + Date.now(),
      rating: 5.0,
      reviewsCount: 1,
      downloadUrl: newProd.downloadUrl || 'https://drive.google.com/drive/folders/febric-downloads'
    };
    setProducts(prev => [p, ...prev]);
    showToast('Product added successfully!');
  };

  const updateProduct = (updated) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    showToast('Product updated successfully!');
  };

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast('Product deleted!');
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        cart,
        cartCount,
        cartSubtotal,
        cartOriginalTotal,
        cartTotal,
        discountAmount,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        isCartOpen,
        setIsCartOpen,
        searchQuery,
        setSearchQuery,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        createOrder,
        orders,
        addProduct,
        updateProduct,
        deleteProduct,
        toastMessage,
        showToast
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
