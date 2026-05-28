import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Drawer({ isOpen, onClose, title, children, width = 'w-96' }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`${width} max-w-full bg-white dark:bg-dark-700 shadow-2xl flex flex-col h-full`}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-dark-600 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white font-heading">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 text-gray-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto modal-scroll">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
