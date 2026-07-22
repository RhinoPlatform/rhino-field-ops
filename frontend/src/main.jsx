import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('=======================================================');
        console.log(' 🚀 RHINO PWA ENGINE INITIALIZED SUCCESSFULLY:', reg.scope);
        console.log('=======================================================');
      })
      .catch(err => console.error('❌ Service Worker crash:', err));
  });
}
