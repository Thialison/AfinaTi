import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { carregarFontes } from './fontes';
import { capturarConviteDeInstalacao } from './sistema';
import './estilos.css';

capturarConviteDeInstalacao();
carregarFontes();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
