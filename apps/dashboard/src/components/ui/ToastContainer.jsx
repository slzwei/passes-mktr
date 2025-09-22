// ToastContainer.jsx
// Container component for managing multiple toast notifications

import React from 'react';
import Toast from './toast.jsx';

export const ToastContainer = ({ toasts, onRemoveToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          errorCode={toast.errorCode}
          duration={toast.duration}
          onClose={onRemoveToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
