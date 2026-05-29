import { useState, useEffect, useRef } from 'react';
import { Package, Loader2 } from 'lucide-react';
import { getImageUrl } from '../../utils/imageHelper';

/**
 * AssetImage component renders an image with fallback logic, lazy loading, and error handling.
 * 
 * @param {object} props
 * @param {string} props.src - Image URL or relative path
 * @param {string} props.alt - Image alt text
 * @param {string} props.className - Tailwind classes for the container
 * @param {string} props.fallbackClassName - Tailwind classes for the fallback container
 * @param {number} props.iconSize - Lucide icon size
 * @param {string} props.objectFit - Object fit behavior ('cover', 'contain', etc.)
 */
export default function AssetImage({
  src,
  alt = 'Asset Image',
  className = 'w-12 h-12 rounded-xl flex-shrink-0',
  fallbackClassName = 'w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center flex-shrink-0',
  iconSize = 20,
  objectFit = 'cover',
}) {
  const [retryCount, setRetryCount] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState('');
  
  const timerRef = useRef(null);
  const resolvedUrl = getImageUrl(src);

  useEffect(() => {
    setHasError(false);
    setRetryCount(0);
    setLoading(true);
    setCurrentUrl(resolvedUrl);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [src, resolvedUrl]);

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    if (retryCount < 3) {
      setLoading(true);
      timerRef.current = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        const nextRetry = retryCount + 1;
        const separator = resolvedUrl.includes('?') ? '&' : '?';
        setCurrentUrl(`${resolvedUrl}${separator}retry=${nextRetry}`);
      }, 1500 * (retryCount + 1)); // Backoff: 1.5s, 3s, 4.5s
    } else {
      console.warn(`⚠️ Failed to load image after 3 retries: ${resolvedUrl}`);
      setHasError(true);
      setLoading(false);
    }
  };

  if (!resolvedUrl || hasError) {
    return (
      <div className={`${fallbackClassName} border border-gray-100 dark:border-dark-700/60 shadow-sm`} title="No image available">
        <Package size={iconSize} className="text-primary-500 animate-pulse" />
      </div>
    );
  }

  // Parse object fit from className if present, otherwise default to objectFit prop
  const hasObjectFit = className.includes('object-');
  const fitClass = hasObjectFit ? '' : `object-${objectFit}`;
  const customFit = className.match(/object-\w+/g)?.[0] || '';
  const cleanClassName = className.replace(/object-\w+/g, '');

  return (
    <div className={`relative overflow-hidden flex items-center justify-center bg-gray-50/50 dark:bg-dark-800/50 border border-gray-150/40 dark:border-dark-700/40 shadow-sm ${cleanClassName}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/60 dark:bg-dark-900/60 z-10">
          <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
        </div>
      )}
      <img
        src={currentUrl}
        alt={alt}
        className={`w-full h-full transition-all duration-300 ${loading ? 'blur-sm scale-95' : 'blur-0 scale-100'} ${fitClass} ${customFit}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  );
}
