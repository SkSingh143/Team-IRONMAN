import { useEffect } from 'react';
import useUIStore from '../../store/uiStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export function useToast() {
  const addToast = useUIStore((state) => state.addToast);
  
  return {
    success: (message, title) => addToast('success', title, message),
    error: (message, title) => addToast('error', title, message),
    warning: (message, title) => addToast('warning', title, message),
    info: (message, title) => addToast('info', title, message),
  };
}

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(onRemove, 4000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const variants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2 } },
  };

  const getStyleParams = () => {
    switch (toast.type) {
      case 'success':
        return { icon: <CheckCircle className="text-emerald-400" />, border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' };
      case 'error':
        return { icon: <AlertCircle className="text-red-400" />, border: 'border-red-500/30', bg: 'bg-red-500/10' };
      case 'warning':
        return { icon: <AlertTriangle className="text-amber-400" />, border: 'border-amber-500/30', bg: 'bg-amber-500/10' };
      default:
        return { icon: <Info className="text-primary" />, border: 'border-primary/30', bg: 'bg-primary/10' };
    }
  };

  const params = getStyleParams();

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      className={`pointer-events-auto flex gap-3 p-4 w-[320px] rounded-xl shadow-xl backdrop-blur-md border ${params.border} ${params.bg} bg-surface/90`}
    >
      <div className="shrink-0 mt-0.5">{params.icon}</div>
      <div className="flex-1 min-w-0 pr-2">
        {toast.title && <div className="text-sm font-bold text-white mb-0.5">{toast.title}</div>}
        <div className="text-sm text-gray-300 leading-tight break-words">{toast.message}</div>
      </div>
      <button 
        onClick={onRemove} 
        className="shrink-0 p-1 text-gray-500 hover:text-white transition-colors self-start -mr-2 -mt-2 rounded-lg"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
