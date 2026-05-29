import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { getImageUrl } from '../../utils/imageHelper';

/**
 * AssetImage component renders an image with fallback logic, lazy loading, and error handling.
 * 
 * @param {object} props
 * @param {string} props.src - Image URL or relative path
 * @param {string} props.alt - Image alt text
 * @param {string} props.className - Tailwind classes for the img tag
 * @param {string} props.fallbackClassName - Tailwind classes for the fallback container
 * @param {number} props.iconSize - Lucide icon size
 */
export default function AssetImage({
  src,
  alt = 'Asset Image',
  className = 'w-12 h-12 rounded-xl object-cover flex-shrink-0',
  fallbackClassName = 'w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center flex-shrink-0',
  iconSize = 20,
}) {
  const [hasError, setHasError] = useState(false);
  const resolvedUrl = getImageUrl(src);

  // Reset error state if the src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!resolvedUrl || hasError) {
    return (
      <div className={fallbackClassName} title="No image available">
        <Package size={iconSize} className="text-primary-500" />
      </div>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt={alt}
      className={`${className} object-cover`}
      onError={() => {
        console.warn(`⚠️ Failed to load image at: ${resolvedUrl}`);
        setHasError(true);
      }}
      loading="lazy"
    />
  );
}
