import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css'; // Import the global CSS file for styling
// Grab the root anchoring container from the HTML DOM and mount the virtual React rendering tree
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);