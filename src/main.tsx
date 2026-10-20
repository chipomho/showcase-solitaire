import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initialDealNumber } from './game/dealNumber';
import './styles/global.css';

const container = document.getElementById('root');
if (container === null) {
  throw new Error('index.html has no #root element to render into.');
}

createRoot(container).render(
  <StrictMode>
    <App initialDealNumber={initialDealNumber(window.location.search)} />
  </StrictMode>,
);
