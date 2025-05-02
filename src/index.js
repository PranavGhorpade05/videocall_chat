// src/index.js or src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';  // ⬅️ Correct for React 18+
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);