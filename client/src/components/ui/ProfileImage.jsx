import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { getImageUrl } from '../../utils/imageHelper';

/**
 * ProfileImage component displays a user profile picture or fallback name initials.
 * 
 * @param {object} props
 * @param {string} props.src - Image URL or path
 * @param {string} props.name - User's name for initials fallback
 * @param {string} props.className - Tailwind classes for the img tag
 * @param {string} props.fallbackClassName - Tailwind classes for the initials container
 */
export default function ProfileImage({
  src,
  name = '',
  className = 'w-9 h-9 rounded-full object-cover flex-shrink-0',
  fallbackClassName = 'w-9 h-9 bg-primary-100 dark:bg-primary-950/30 text-primary-650 dark:text-primary-400 flex items-center justify-center font-bold text-sm rounded-full flex-shrink-0',
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
      console.warn(`⚠️ Failed to load profile image after 3 retries: ${resolvedUrl}`);
      setHasError(true);
      setLoading(false);
    }
  };

  if (!resolvedUrl || hasError) {
    const initials = name
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

    return (
      <div className={fallbackClassName} title={name}>
        {initials}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden inline-block rounded-full flex-shrink-0">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/60 dark:bg-dark-900/60 z-10 rounded-full">
          <Loader2 className="w-3.5 h-3.5 text-primary-500 animate-spin" />
        </div>
      )}
      <img
        src={currentUrl}
        alt={name}
        className={`${className} transition-all duration-300 ${loading ? 'blur-sm scale-95' : 'blur-0 scale-100'}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  );
}
