// useToast.js
// Hook for managing toast notifications with the editor's consistent API

import { useState, useCallback } from 'react';

let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toastData) => {
    const id = `toast-${++toastId}`;
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      ...toastData
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((title, message, duration = 5000) => {
    return addToast({ type: 'success', title, message, duration });
  }, [addToast]);

  const error = useCallback((title, message, duration = 5000) => {
    return addToast({ type: 'error', title, message, duration });
  }, [addToast]);

  const warning = useCallback((title, message, duration = 5000) => {
    return addToast({ type: 'warning', title, message, duration });
  }, [addToast]);

  const info = useCallback((title, message, duration = 5000) => {
    return addToast({ type: 'info', title, message, duration });
  }, [addToast]);

  // Legacy compatibility with existing toast API
  const toast = useCallback(({ title, description, variant, ...props }) => {
    const type = variant === 'destructive' ? 'error' : 'success';
    return addToast({ type, title, message: description, ...props });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info,
    toast // Legacy compatibility
  };
};

export default useToast;
