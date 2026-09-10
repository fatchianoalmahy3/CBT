import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ToastMessage } from '../core/types';

interface ToastProps extends ToastMessage {
  onClose: (id: string) => void;
}

export const ToastItem: React.FC<ToastProps> = ({
  id,
  title,
  message,
  type = 'info',
  action,
  onClose,
  duration = 4500,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(duration);

  useEffect(() => {
    if (isPaused) return;

    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, remainingTimeRef.current - elapsed);
      const pct = (remaining / duration) * 100;
      setProgress(pct);

      if (remaining <= 0) {
        clearInterval(interval);
        onClose(id);
      }
    }, 40);

    return () => {
      clearInterval(interval);
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    };
  }, [isPaused, duration, id, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />,
  };

  const styleThemes = {
    success: {
      container: 'bg-white border-emerald-200 text-slate-800 shadow-emerald-500/10',
      bar: 'bg-emerald-500',
    },
    error: {
      container: 'bg-white border-rose-200 text-slate-800 shadow-rose-500/10',
      bar: 'bg-rose-500',
    },
    warning: {
      container: 'bg-white border-amber-200 text-slate-800 shadow-amber-500/10',
      bar: 'bg-amber-500',
    },
    info: {
      container: 'bg-white border-indigo-200 text-slate-800 shadow-indigo-500/10',
      bar: 'bg-indigo-500',
    },
  };

  const theme = styleThemes[type] || styleThemes.info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative w-full max-w-sm sm:max-w-md overflow-hidden rounded-2xl border shadow-xl backdrop-blur-md p-4 transition-all duration-200 pointer-events-auto ${theme.container}`}
    >
      <div className="flex items-start gap-3">
        {icons[type]}
        <div className="flex-1 min-w-0 pr-2">
          {title && (
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-0.5">
              {title}
            </h4>
          )}
          <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed break-words">
            {message}
          </p>
          {action && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => {
                  action.onClick();
                  onClose(id);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                <span>{action.label}</span>
                <ArrowRight className="w-3 h-3 text-indigo-600" />
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onClose(id)}
          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Shrinking Countdown Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100">
        <div
          className={`h-full transition-all duration-75 ease-linear ${theme.bar}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};

export interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-[90vw] pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} {...toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
};
