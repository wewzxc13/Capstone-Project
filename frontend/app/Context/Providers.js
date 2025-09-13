"use client";

import { AuthProvider } from "./AuthContext";
import { ThemeProvider } from "./ThemeContext";
import { UserProvider } from "./UserContext";
import { ModalProvider } from "./ModalContext";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import "react-toastify/dist/ReactToastify.css";

// Dynamically import ToastContainer to prevent hydration issues
const ToastContainer = dynamic(
  () => import("react-toastify").then((mod) => mod.ToastContainer),
  { ssr: false }
);

export function Providers({ children }) {
  // Suppress noisy runtime errors from browser extensions (e.g., MetaMask)
  // that bubble up as unhandled errors and trigger the Next.js overlay.
  // We only do this on the client and keep other real app errors visible.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const shouldIgnoreEvent = (event) => {
      try {
        const reason = event?.reason ?? event?.error ?? event;
        const message =
          (typeof reason === "string" && reason) || reason?.message || "";
        const filename = event?.filename || "";

        if (typeof filename === "string" && filename.startsWith("chrome-extension://")) {
          return true;
        }

        if (typeof message === "string" && message.includes("Failed to connect to MetaMask")) {
          return true;
        }
      } catch (_) {
        // no-op
      }
      return false;
    };

    const handleError = (event) => {
      if (shouldIgnoreEvent(event)) {
        event.preventDefault?.();
        event.stopImmediatePropagation?.();
      }
    };

    window.addEventListener("error", handleError, true);
    window.addEventListener("unhandledrejection", handleError, true);

    return () => {
      window.removeEventListener("error", handleError, true);
      window.removeEventListener("unhandledrejection", handleError, true);
    };
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <UserProvider>
          <ModalProvider>
            {children}
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
              suppressHydrationWarning={true}
              style={{ zIndex: 99999 }}
            />
          </ModalProvider>
        </UserProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
