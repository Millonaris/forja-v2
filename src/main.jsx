import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";

import App from "./App.jsx";
import "./estilos/base.css";

// La app se actualiza sola: el service worker se registra en autoUpdate y
// Workbox recarga cuando hay versión nueva. Sin diálogo: es una app de una
// sola persona y no hay nada que perder al recargar.
registerSW({ immediate: true });

createRoot(document.getElementById("raiz")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
