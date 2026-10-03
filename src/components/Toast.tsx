import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'info';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success' }) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="bg-[#121217] border-2 border-black text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 backdrop-blur-md">
        {type === 'success' ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        ) : (
          <AlertCircle className="w-4 h-4 text-sky-400 shrink-0" />
        )}
        <span className="text-xs sm:text-sm font-semibold tracking-wide">{message}</span>
      </div>
    </div>
  );
};
