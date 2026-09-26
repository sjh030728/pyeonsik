import { createContext, createElement, useContext, useMemo, useState } from 'react';

// items: [{ product, qty }]
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const add = (product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, { product, qty }];
    });
  };

  const remove = (productId) => {
    setItems((prev) =>
      prev
        .map((i) => (i.product.id === productId ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const clear = () => setItems([]);

  const total = useMemo(
    () =>
      items.reduce(
        (acc, i) => ({
          price: acc.price + i.product.price * i.qty,
          sodium: acc.sodium + i.product.sodium * i.qty,
          kcal: acc.kcal + i.product.kcal * i.qty,
        }),
        { price: 0, sodium: 0, kcal: 0 }
      ),
    [items]
  );

  const value = { items, add, remove, clear, total };

  // .js 확장자라 JSX 대신 createElement를 씁니다 (빌드 시 JSX 파싱 에러 방지).
  return createElement(CartContext.Provider, { value }, children);
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart는 CartProvider 안에서만 쓸 수 있어요.');
  return ctx;
}
