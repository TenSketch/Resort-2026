import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter } from "react-router";
import App from "./App.tsx";
import { AdminProvider } from "./lib/AdminProvider";
import { ToastProvider } from "./components/ui/ToastProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AdminProvider>
      <ToastProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ToastProvider>
    </AdminProvider>
  </StrictMode>,
);
