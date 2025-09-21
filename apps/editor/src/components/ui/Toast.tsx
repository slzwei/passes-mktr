// Toast.tsx
// Sleek toast notification component with auto-dismiss functionality

import React, { useState, useEffect } from 'react';
import './Toast.css';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  errorCode?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  errorCode,
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Match animation duration
  };

  const getToastStyles = () => {
    const baseStyles = "relative overflow-hidden rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ease-out";
    
    if (isLeaving) {
      return `${baseStyles} translate-x-full opacity-0 scale-95`;
    }
    
    if (isVisible) {
      return `${baseStyles} translate-x-0 opacity-100 scale-100`;
    }
    
    return `${baseStyles} translate-x-full opacity-0 scale-95`;
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-400 text-green-800',
          icon: 'text-green-400',
          iconBg: 'bg-green-100',
          iconSymbol: '✓'
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-400 text-red-800',
          icon: 'text-red-400',
          iconBg: 'bg-red-100',
          iconSymbol: '✕'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-400 text-yellow-800',
          icon: 'text-yellow-400',
          iconBg: 'bg-yellow-100',
          iconSymbol: '⚠'
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-400 text-blue-800',
          icon: 'text-blue-400',
          iconBg: 'bg-blue-100',
          iconSymbol: 'ℹ'
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-400 text-gray-800',
          icon: 'text-gray-400',
          iconBg: 'bg-gray-100',
          iconSymbol: 'ℹ'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className={getToastStyles()}>
      <div className={`p-4 ${styles.container}`}>
        <div className="flex items-start">
          {/* Icon */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full ${styles.iconBg} flex items-center justify-center mr-3`}>
            <span className={`text-sm font-bold ${styles.icon}`}>
              {styles.iconSymbol}
            </span>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold truncate">
                {title}
              </h4>
              <button
                onClick={handleClose}
                className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <p className="mt-1 text-sm text-gray-600">
              {message}
            </p>
            
            {errorCode && (
              <div className="mt-2 text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                Error Code: {errorCode}
              </div>
            )}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 overflow-hidden">
          <div 
            className={`h-full ${type === 'success' ? 'bg-green-400' : type === 'error' ? 'bg-red-400' : 'bg-blue-400'} toast-progress-bar`}
            style={{
              '--duration': `${duration}ms`
            } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  );
};

export default Toast;
