import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/dads-tokens.css';
import './styles/app.css';
import App from './App';
import { registerServiceWorker } from './platform/sw';

registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
