import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./providers/ThemeProvider";
import "./global.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {/* No HeroUI Provider needed in v3! */}
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
