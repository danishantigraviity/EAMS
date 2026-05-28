import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import App from './App';
import store from './store';
import { injectStore } from './services/api';
import './index.css';

// Inject Redux store to break circular import cycle in services/api
injectStore(store);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toast-bg, #fff)',
            color: 'var(--toast-color, #111)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          },
          success: { iconTheme: { primary: '#26A69A', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </Provider>
  </React.StrictMode>
);
