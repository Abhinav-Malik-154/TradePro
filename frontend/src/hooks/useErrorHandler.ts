'use client';

import { toast } from 'react-hot-toast';

export const useErrorHandler = () => {
  const handleError = (error: any, fallbackMessage: string = 'Something went wrong') => {
    console.error('Error:', error);
    
    let message = fallbackMessage;
    
    if (error?.response?.data?.error) {
      message = error.response.data.error;
    } else if (error?.message) {
      message = error.message;
    }
    
    toast.error(message);
  };

  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const showLoading = (message: string) => {
    return toast.loading(message);
  };

  const showInfo = (message: string) => {
    toast(message);
  };

  return {
    handleError,
    showSuccess,
    showLoading,
    showInfo
  };
};