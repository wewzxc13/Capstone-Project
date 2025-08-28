import React, { createContext, useContext, useState, useEffect } from "react";

// Create a context for toast management
const ToastContext = createContext();

// Toast provider component
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    const newToast = { id, message, type };
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (message) => addToast(message, 'success');
  const error = (message) => addToast(message, 'error');
  const info = (message) => addToast(message, 'info');

  return (
    <ToastContext.Provider value={{ success, error, info, removeToast }}>
      {children}
      <div className="fixed top-6 right-6 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Individual toast component
function Toast({ message, type = 'info', onClose }) {
  const bg = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  
  return (
    <div className={`px-6 py-3 rounded shadow-lg text-white font-semibold ${bg} min-w-[200px] max-w-[400px]`}>
      <div className="flex items-center justify-between gap-4">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-white font-bold hover:text-gray-200">×</button>
      </div>
    </div>
  );
}

// Static methods for backward compatibility
export const toast = {
  success: (message) => {
    // This will be overridden by the provider
    console.warn('Toast not initialized. Make sure ToastProvider is wrapping your app.');
  },
  error: (message) => {
    console.warn('Toast not initialized. Make sure ToastProvider is wrapping your app.');
  },
  info: (message) => {
    console.warn('Toast not initialized. Make sure ToastProvider is wrapping your app.');
  }
}; 