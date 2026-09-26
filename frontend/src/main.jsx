import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { CartProvider } from './store/useCart';
import { GoalProvider } from './store/useGoal';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoalProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </GoalProvider>
    </BrowserRouter>
  </React.StrictMode>
);
