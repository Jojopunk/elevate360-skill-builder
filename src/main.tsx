
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx'
import './index.css'
import { Capacitor } from '@capacitor/core';
import CapacitorApp from './components/capacitor/CapacitorApp.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <CapacitorApp>
        <App />
      </CapacitorApp>
    </BrowserRouter>
  </React.StrictMode>,
)
