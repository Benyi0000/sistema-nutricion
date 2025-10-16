// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";

import I18nProvider from "./app/I18nProvider.jsx";
import App from "./app/App.jsx";

import "./styles/tailwind.css"; // o tu hoja de estilos

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>
);
