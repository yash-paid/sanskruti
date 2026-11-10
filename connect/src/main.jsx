import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './context/LanguageContext';
import './index.css';

// Globally prevent dragging on all images and media across the website
if (typeof window !== 'undefined') {
  window.addEventListener(
    'dragstart',
    (e) => {
      if (
        e.target &&
        (e.target.nodeName === 'IMG' ||
          e.target.nodeName === 'PICTURE' ||
          e.target.nodeName === 'SVG' ||
          e.target.closest?.('img'))
      ) {
        e.preventDefault();
        return false;
      }
    },
    false
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);

