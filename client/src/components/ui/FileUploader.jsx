import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FileUploader({
  onFileSelect,
  accept,
  maxSize = 5 * 1024 * 1024,
  label = 'Drag & drop or click to upload',
  hint,
  preview = true,
  currentUrl,
  className = '',
}) {
  const [preview_, setPreview] = useState(null);
  const [error, setError] = useState('');

  const onDrop = useCallback((accepted, rejected) => {
    setError('');
    if (rejected.length > 0) {
      setError(rejected[0].errors[0]?.message || 'File rejected');
      return;
    }
    if (accepted.length > 0) {
      const file = accepted[0];
      onFileSelect(file);
      if (preview && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setPreview(file.name);
      }
    }
  }, [onFileSelect, preview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  });

  const clear = (e) => {
    e.stopPropagation();
    setPreview(null);
    setError('');
    onFileSelect(null);
  };

  const displayUrl = preview_ || currentUrl;

  return (
    <div className={className}>
      <motion.div
        {...getRootProps()}
        whileHover="hover"
        className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer overflow-hidden
          ${isDragActive ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20' : 'border-gray-200 dark:border-dark-500 hover:border-primary-400 hover:bg-gray-50/30 dark:hover:bg-dark-600/10'}
          ${error ? 'border-red-400 bg-red-50 dark:bg-red-950/10' : ''}
        `}
      >
        <input {...getInputProps()} />

        {displayUrl && preview_ ? (
          <div className="relative">
            {typeof displayUrl === 'string' && displayUrl.startsWith('data:image') ? (
              <img src={displayUrl} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
            ) : (
              <div className="flex items-center gap-3 p-4">
                <FileText size={24} className="text-primary-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{displayUrl}</span>
              </div>
            )}
            <button
              onClick={clear}
              className="absolute top-2 right-2 p-1.5 bg-white dark:bg-dark-700 rounded-lg shadow-md hover:bg-red-50 dark:hover:bg-dark-600 transition-colors"
            >
              <X size={14} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        ) : currentUrl && !preview_ ? (
          <div className="relative group">
            <img src={currentUrl} alt="Current" className="w-full h-40 object-cover rounded-xl opacity-70" />
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/20 group-hover:bg-black/35 transition-colors">
              <p className="text-white text-sm font-semibold tracking-wide">Click or Drag to replace</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <motion.div
              variants={{
                hover: { y: -5, scale: 1.08, rotate: [0, -5, 5, 0] }
              }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-12 h-12 bg-primary-50 dark:bg-primary-950/20 rounded-xl flex items-center justify-center mb-3 text-primary-500 shadow-sm"
            >
              <Upload size={22} />
            </motion.div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</p>
            {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{hint}</p>}
          </div>
        )}
      </motion.div>
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}
